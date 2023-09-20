import { Model } from '../types'
import tests from '../utils/TestFunctions'

const ParseColumns = (columns: Array<string>) => {
    let response: any = {}

    for (const column of columns) {
        const name = column.trim().split(':')[0]
        const primitiveType = column.toLowerCase().replace(/\s/gi, '').split(':')[1]
        const type = primitiveType.match(/(.*)<(.*)>/)

        const isRequired = type?.[1] == 'optional' ? false : true
        const isUnique = type?.[1] == 'unique' ? true : false
        const isList = type?.[1] == 'list' ? true : false

        const testFunction = isRequired
            ? tests[type?.[2] || primitiveType]
            : tests.optional(tests[type?.[2] || primitiveType])

        name && primitiveType
            ? response[name] = {
                type: (type?.[2] || primitiveType),
                required: isRequired,
                unique: isUnique,
                list: isList,
                test: (isList ? tests.list(tests[type?.[2] || primitiveType]) : testFunction)
            }
            : null
    }

    return response
}

export const ParseModels = (scheme: string): Model[] => {
    const models = scheme.replace(/[\r\n]/gi, '').split(';')
    const response: Model[] = []

    models.forEach(d => {
        const model = d.match(/model\("(.*)",(.*)\)/)

        if (model?.[0]) {
            response.push({
                name: model[1],
                columns: ParseColumns(model[2].replace(/[{}]/gi, '').split(','))
            })
        }
    })

    return response
}