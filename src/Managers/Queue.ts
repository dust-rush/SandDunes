class Queue extends Array<{ exec: Function, arguments: unknown | any }> {
    constructor() {
        super()
    }

    add(callback: Function, ...callbackArguments: any[]) {
        return this.push({
            exec: async () => {
                return await callback(...callbackArguments)
            },
            arguments: callbackArguments
        })
    }

    dump() {
        return new Promise((resolve, reject) => {
            try {
                this.forEach(Item => {
                    Item.exec(...Item.arguments)
                })

                resolve(true)
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default Queue