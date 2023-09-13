export const SchemaValidator = (schema: any, input: any, ORMInstance: any) => {
    if (typeof input !== 'object' || typeof schema !== 'object') {
        throw new Error('Both Input and Schema must be objects');
    }

    let response: {
        valid: boolean,
        error?: string,
        cause?: string
    } = {
        valid: true,
    }

    const refExists = Boolean(ORMInstance.findByRef(schema.name, input._ref))

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
            response.error = `Column "${columnName}" types does not match types in model at schema.dune`
            response.cause = 'TYPE COLUMN INCOMPATIBLE'

            return response
        }

        const exists = (
            column.unique
                ? ORMInstance.findWhere(schema.name, {
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