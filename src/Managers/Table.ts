import * as Types from '../types'

export const RemoveComments = (tableContent: string) => {
    return tableContent.replace(/\/\*\*(.*)\*\*\//g, '')
}

export const ParseTable = (tableContent: string): Array<[string, Types.Column]> => {
    const columns = RemoveComments(tableContent).replace(/[\r\n]/g, '').split(';')
    const response: [string, Types.Column][] = []

    columns.forEach(column => {
        if (!column) return

        const columnData = JSON.parse(column)
        response.push([columnData._ref, columnData])
    })

    return response
}

export const ExportTableToDustFile = (tableContentIterator: IterableIterator<Types.Column>, indentSize: number = 0) => {
    let response = ''

    for (const column of tableContentIterator) {
        response += `${JSON.stringify(column, null, indentSize)};${indentSize ? '\n\n' : ''}`
    }

    return response
}

export const DeleteColumn = (reference: string, tableContentIterator: IterableIterator<Types.Column>, indentSize: number = 0) => {
    let response = ''

    for (const column of tableContentIterator) {
        column?._ref == reference
            ? null
            : response += `${JSON.stringify(column, null, indentSize)};${indentSize ? '\n\n' : ''}`
    }

    return response
}