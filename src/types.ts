export interface Model {
    name: string,
    columns: {
        [column: string]: {
            type: string, test: Function
        }
    }
}

export interface SandDunesOptions {
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