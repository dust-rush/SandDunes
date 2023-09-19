export interface Model {
    name: string,
    columns: {
        [column: PropertyKey]: {
            type: string,
            required: boolean,
            unique: boolean,
            list: boolean,
            test: Function
        }
    }
}

export interface Column {
    _ref: string,
    fields: {
        [field: PropertyKey]: unknown
    }
}

export interface SandDunesOptions {
    name?: string,
    indentSize?: number,
    updateCanCreate?: boolean
}

export interface File {
    name: string,
    content: string,
}

export interface RequiredParamOptions {
    name: string,
    type: string,
    throwOnError?: boolean
}