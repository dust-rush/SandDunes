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

        name && primitiveType
            ? response[name] = {
                type: type?.[2] || primitiveType,
                required: isRequired,
                unique: isUnique,
                test: isRequired ? tests[type?.[2] || primitiveType] : tests.optional(tests[type?.[2] || primitiveType])
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