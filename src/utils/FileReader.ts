import * as fs from 'fs'
import { File } from '../types'


export const Exists = (path: string): boolean => {
    return fs.existsSync(path)
}

export const ReadFileAsync = (filePath: string): Promise<NodeJS.ErrnoException | string | null> => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (error, data) => {
            if (error) reject(error)

            resolve(data?.toString('utf-8'))
        })
    })
}

export const ReadFilesInPath = (path: string): Promise<File[] | Array<string>> => {
    return new Promise(async (resolve, reject) => {
        const inPath = fs.readdirSync(path, {
            encoding: 'utf-8'
        })

        resolve(inPath)
    })
}