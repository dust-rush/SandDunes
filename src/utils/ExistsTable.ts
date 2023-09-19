import SandDunes from 'main'

export default function ExistsTable(app: SandDunes, tableName: string) {
    let response = true

    app.models.get(tableName)
        ? null
        : response = false

    return response
}