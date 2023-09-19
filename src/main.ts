import { mkdirSync, writeFileSync } from 'fs'
import { randomUUID } from 'crypto'

import Queue from './Managers/Queue'
import * as SchemaManager from './Managers/Schema'
import { SchemaValidator } from './Managers/Validator'
import * as TableManager from './Managers/Table'

import { Exists, ReadFileAsync } from './utils/FileReader'
import { RequiredParam } from './utils/Parameters'

import * as Types from './types'
import ExistsTable from './utils/ExistsTable'

class SandDunes {
    name?: string
    indentSize: number
    updateCanCreate: boolean

    isReady: boolean
    queue: Queue
    models: Map<PropertyKey, Types.Model>
    tables: {
        [name: PropertyKey]: Map<PropertyKey, Types.Column>
    }

    constructor(options: Types.SandDunesOptions = { updateCanCreate: false, indentSize: 0 }) {
        this.name = options.name
        this.indentSize = options.indentSize || 0
        this.updateCanCreate = Boolean(options.updateCanCreate)

        this.isReady = false
        this.queue = new Queue()
        this.models = new Map()
        this.tables = {}
    }

    create(table: string, data?: unknown): Promise<{
        _ref: string,
        fields: unknown
    }> {
        return new Promise(async (resolve, reject) => {
            RequiredParam({ name: 'table', type: 'string', throwOnError: true }, table, 'Param "table" Is required.')

            if (!ExistsTable(this, table)) {
                throw new Error(`Table "${table}" not exists.`)
            }

            if (!data) {
                throw new Error(`You need to provide the data to save in "${table}".`)
            }

            if (!this.isReady) {
                this.queue.add(async () => {
                    resolve(await this.create(table, data))
                })

                return
            }

            const _ref = randomUUID()
            const columnData = {
                _ref,
                fields: {
                    _ref,
                    ...data
                }
            }

            const selectedTable = this.tables[table]
            const authorization = await SchemaValidator(this.models.get(table), columnData.fields, this)

            if (!authorization.valid) {
                throw new Error(authorization?.error, {
                    cause: authorization.cause,
                })
            }

            selectedTable.set(_ref, columnData)

            this.sync(table)

            resolve({
                _ref,
                fields: {
                    ...data
                }
            })
        })
    }

    update(table: string, where: object, newData: object) {
        return new Promise(async (resolve, reject) => {
            RequiredParam({ name: 'table', type: 'string', throwOnError: true }, table, 'Param "table" Is required.')
            RequiredParam({ name: 'where', type: 'object', throwOnError: true }, where, 'You need to provide the where function to update old data.')

            if (!ExistsTable(this, table)) {
                throw new Error(`${table} not exists.`)
            }

            if (!this.isReady) {
                this.queue.add(async () => {
                    resolve(await this.update(table, where, newData))
                })

                return
            }

            const actualData = this.findWhere(table, where)

            if (!actualData && !this.updateCanCreate) {
                throw new Error(`None exists any column with provided where function in ${table} table`)
            }

            resolve(await this.create(table, Object.assign(actualData, newData)))
        })
    }

    findByRef(table: string, reference: string): Promise<unknown> {
        return new Promise((resolve, reject) => {
            RequiredParam({ name: 'table', type: 'string', throwOnError: true }, table, 'Param "table" Is required.')
            RequiredParam({ name: 'ColumnReferenceID', type: 'string', throwOnError: true }, reference, 'Param "reference" Is required to find data.')

            if (!ExistsTable(this, table)) {
                throw new Error(`${table} not exists.`)
            }

            if (!this.isReady) {
                this.queue.add(async () => {
                    resolve(await this.findByRef(table, reference))
                })

                return
            }

            resolve(this.tables[table].get(reference))
        })
    }

    findWhere(table: string, where: object): Promise<Types.Column | undefined> {
        return new Promise((resolve, reject) => {
            RequiredParam({ name: 'table', type: 'string', throwOnError: true }, table, 'Param "table" Is required.')
            RequiredParam({ name: 'where', type: 'object', throwOnError: true }, where, 'You need to provide the where function to find data.')

            if (!ExistsTable(this, table)) {
                throw new Error(`${table} not exists.`)
            }

            if (!this.isReady) {
                this.queue.add(async () => {
                    resolve(await this.findWhere(table, where))
                })

                return
            }

            const selectedTable = this.tables[table]
            const arrayOfTable = Array.from(selectedTable.values())
            const response = arrayOfTable.find((column) => {
                const whereKey = Object.keys(where)[0]

                return column.fields[whereKey] == where[whereKey as keyof PropertyKey]
                    ? true
                    : false
            })

            resolve(response)
        })


    }

    findMany(table: string) {
        return new Promise((resolve, reject) => {
            RequiredParam({ name: 'table', type: 'string', throwOnError: true }, table, 'Param "table" Is required.')

            if (!ExistsTable(this, table)) {
                throw new Error(`${table} not exists.`)
            }

            if (!this.isReady) {
                this.queue.add(async () => {
                    resolve(await this.findMany(table))
                })

                return
            }

            resolve(Object.fromEntries(this.tables[table].entries()))
        })
    }

    drop(table: string, columnReferenceID: string) {
        return new Promise((resolve, reject) => {
            RequiredParam({ name: 'table', type: 'string', throwOnError: true }, table, 'Param "table" Is required.')
            RequiredParam({ name: 'ColumnReferenceID', type: 'string', throwOnError: true }, columnReferenceID, 'Param "ColumnReferenceID" Is required to find data.')

            if (!ExistsTable(this, table)) {
                throw new Error(`${table} not exists.`)
            }

            const selectedTable = this.tables[table]
            const columnData = selectedTable.get(columnReferenceID)

            if (!selectedTable || !columnData) {
                reject('You need to provide a valid Table or valid ColumnID')
            }

            try {
                const tableContentAfterDelete = TableManager.DeleteColumn(columnReferenceID, selectedTable.values())
                selectedTable.delete(columnReferenceID)

                this.sync(table, tableContentAfterDelete)
                resolve(columnData)
            } catch (error: any) {
                reject(error?.message)
            }
        })
    }

    sync(table: string, data?: string) {
        const selectedTable = this.tables[table]
        writeFileSync(`${process.cwd()}/dunes/${this.name ? `${this.name}/` : '/'}tables/${table}.dust`, data || TableManager.ExportTableToDustFile(selectedTable.values(), this.indentSize))

        return true
    }

    async init(SchemaFileName: string = 'schema.dune') {
        try {
            const models = await this.ReadSchema(SchemaFileName ?? 'schema.dune')
            await this.PrepareTables(models)

            for (const model of models) {
                this.models.set(model.name, model)
            }

            this.isReady = true
            this.queue.dump()

            return true
        } catch (error: any) {
            return false
        }
    }

    private async ReadSchema(fileName: string, path = `${process.cwd()}/dunes${this.name ? `/${this.name}` : ''}`) {
        if (!Exists(path)) {
            mkdirSync(path, {
                recursive: true
            })
            writeFileSync(`${path}/schema.dune`, 'model("User", {\n  name: String,\n  email: Unique<EmailAddress>\n});')
        }

        const exists = Exists(`${path}/${fileName.endsWith('.dune') ? fileName : `${fileName}.dust`}`)

        if (!exists) {
            throw new Error(`Schema not found, how about checking if It really exists?`)
        }

        const dusts: any = await ReadFileAsync(`${path}/${fileName.endsWith('.dune') ? fileName : `${fileName}.dust`}`)
        return (SchemaManager.ParseModels(dusts))
    }

    private async PrepareTables(models: Types.Model[], path = `${process.cwd()}/dunes/${this.name || ''}`) {
        try {
            if (!Exists(`${path}/tables/`)) {
                mkdirSync(`${path}/tables/`)
            }

            for (const model of models) {
                const exists = Exists(`${path}/tables/${model.name}.dust`)

                if (exists) {
                    const response = await ReadFileAsync(`${path}/tables/${model.name}.dust`)

                    typeof response == 'string'
                        ? this.tables[model.name] = new Map(TableManager.ParseTable(response))
                        : null
                } else {
                    this.tables[model.name] = new Map()
                    writeFileSync(`${path}/tables/${model.name}.dust`, '')
                }
            }
        } catch (error: any) {
            throw new Error(error)
        }
    }
}

export default SandDunes

export {
    Types,
    RequiredParam,
    SchemaValidator,
    TableManager,
    SchemaManager
}