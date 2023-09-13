import { mkdirSync, writeFileSync } from 'fs'
import { randomUUID } from 'crypto'

import Queue from './Managers/Queue'
import { ParseModels } from './Managers/Schema'
import { SchemaValidator } from './Managers/Validator'
import { DeleteColumn, ExportTableToDustFile, ParseTable } from './Managers/Table'

import { Exists, ReadFileAsync } from './utils/FileReader'
import { RequiredParam } from './utils/Parameters'

import { Model, SandDunesOptions } from './types'

class SandDunes {
    isReady: boolean
    queue: Queue

    models: Map<string, Model>
    tables: {
        [name: string]: Map<string, unknown>
    }

    indentSize: number
    updateCanCreate: boolean

    constructor(options: SandDunesOptions = { updateCanCreate: false, indentSize: 0 }) {
        this.isReady = false
        this.queue = new Queue()

        this.models = new Map()
        this.tables = {}

        this.indentSize = options.indentSize || 0
        this.updateCanCreate = Boolean(options.updateCanCreate)
    }

    create(table: string, data?: any): boolean | {
        _ref: string,
        fields: unknown
    } {
        RequiredParam({ name: 'table', type: 'string', throwOnError: true }, table, 'Param "table" Is required.')

        if (!data) {
            throw new Error(`You need to provide the data to save in "${table}".`)
        }

        if (!this.isReady) {
            this.queue.add(() => {
                this.create(table, data)
            })

            return true
        }

        const _ref = data?._ref || randomUUID()
        const columnData = {
            _ref,
            fields: {
                _ref,
                ...data
            }
        }

        const selectedTable = this.tables[table]
        const authorization = SchemaValidator(this.models.get(table), columnData.fields, this)

        if (!authorization.valid) {
            throw new Error(authorization?.error, {
                cause: authorization.cause,
            })
        }

        selectedTable.set(_ref, columnData)

        this.sync(table)

        return {
            _ref,
            fields: {
                ...data
            }
        }
    }

    async update(table: string, where: object | any, newData: unknown) {
        RequiredParam({ name: 'table', type: 'string', throwOnError: true }, table, 'Param "table" Is required.')
        RequiredParam({ name: 'where', type: 'object', throwOnError: true }, where, 'You need to provide the where function to update old data.')

        const actualData = this.findWhere(table, where)

        if (!actualData && !this.updateCanCreate) {
            throw new Error(`None exists any column with provided where function in ${table} table`)
        }

        return (this.create(table, Object.assign(actualData, newData)))
    }

    findByRef(table: string, reference: string) {
        RequiredParam({ name: 'table', type: 'string', throwOnError: true }, table, 'Param "table" Is required.')
        RequiredParam({ name: 'ColumnReferenceID', type: 'string', throwOnError: true }, reference, 'Param "reference" Is required to find data.')

        return (this.tables[table].get(reference))
    }

    findWhere(table: string, where: object | any): any {
        RequiredParam({ name: 'table', type: 'string', throwOnError: true }, table, 'Param "table" Is required.')
        RequiredParam({ name: 'where', type: 'object', throwOnError: true }, where, 'You need to provide the where function to find data.')

        const selectedTable = this.tables[table]
        const arrayOfTable = Array.from(selectedTable.values())

        return (arrayOfTable.find((column: any, index) => {
            const whereKey = Object.keys(where)[0]

            return column.fields[whereKey] == where[whereKey]
                ? true
                : false
        }))
    }

    findMany(table: string) {
        RequiredParam({ name: 'table', type: 'string', throwOnError: true }, table, 'Param "table" Is required.')

        return (Object.fromEntries(this.tables[table].entries()))
    }

    drop(table: string, columnReferenceID: string) {
        RequiredParam({ name: 'table', type: 'string', throwOnError: true }, table, 'Param "table" Is required.')
        RequiredParam({ name: 'ColumnReferenceID', type: 'string', throwOnError: true }, columnReferenceID, 'Param "ColumnReferenceID" Is required to find data.')

        try {
            const selectedTable = this.tables[table]

            const tableContentAfterDelete = DeleteColumn(columnReferenceID, selectedTable.values())
            selectedTable.delete(columnReferenceID)
            this.sync(table, tableContentAfterDelete)

            return true
        } catch (error: any) {
            throw new Error(error)
        }
    }

    sync(table: string, data?: string) {
        const selectedTable = this.tables[table]
        writeFileSync(`${process.cwd()}/Dunes/tables/${table}.dust`, data || ExportTableToDustFile(selectedTable.values(), this.indentSize))

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

    private async ReadSchema(fileName: string, path = `${process.cwd()}/Dunes`) {
        const exists = Exists(`${path}/${fileName.endsWith('.dune') ? fileName : (fileName + '.dune')}`)

        if (!exists) {
            throw new Error(`Schema not found, how about checking if It really exists?`)
        }

        const dusts: any = await ReadFileAsync(`${path}/${fileName.endsWith('.dune') ? fileName : (fileName + '.dune')}`)
        return (ParseModels(dusts))
    }

    private async PrepareTables(models: Model[], path = `${process.cwd()}/Dunes`) {
        try {
            if (!Exists(`${path}/tables/`)) {
                mkdirSync(`${path}/tables/`)
            }

            for (const model of models) {
                const exists = Exists(`${path}/tables/${model.name}.dust`)

                if (exists) {
                    const response = await ReadFileAsync(`${path}/tables/${model.name}.dust`)

                    typeof response == 'string'
                        ? this.tables[model.name] = new Map(ParseTable(response))
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