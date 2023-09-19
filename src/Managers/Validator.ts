import SandDunes from 'main'
import * as Types from '../types'

export const SchemaValidator = async (schema: Types.Model | undefined, input: any, ORMInstance: SandDunes): Promise<{ valid: boolean, error?: string, cause?: string }> => {
    console.log(schema)
    console.log('===========')
    console.log(input)
    if (typeof input !== 'object' || typeof schema !== 'object') {
        throw new Error('Both Input and Schema must be objects');
    }


    let response: {
        valid: boolean,
        error?: string,
        cause?: string
    } = {
        valid: true
    }

    const refExists = Boolean(await ORMInstance.findByRef(schema.name, input._ref))

    if (refExists) {
        response.valid = false
        response.error = `Reference "${input._ref}" Is already being used.`
        response.cause = 'REFERENCE CONSTRAINT'

        return response
    }

    for (const columnName of Object.keys(schema.columns)) {
        const column = schema.columns[columnName]
        const value = input[columnName]

        if (column.required && !value) {
            response.valid = false
            response.error = `Column "${columnName}" Is required!`
            response.cause = 'REQUIRED COLUMN CONSTRAINT'

            return response
        }

        if (value && !column.test(value)) {
            response.valid = false
            response.error = `Column "${columnName}" types does not match "${column.type}" type.`
            response.cause = 'COLUMN TYPE INCOMPATIBLE'

            return response
        }

        const exists = (
            column.unique
                ? await ORMInstance.findWhere(schema.name, {
                    [columnName]: value
                })
                : null
        )

        if (exists) {
            response.valid = false
            response.error = `It's not possible to create a new column with unique data. \n> "${columnName}" has the same content: "${exists.fields[columnName]}" of ${exists._ref} column`
            response.cause = 'UNIQUE COLUMN CONSTRAINT'

            return response
        }

    }

    return response;
}