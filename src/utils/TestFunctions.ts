const functions: {
    [FunctionName: string]: Function
} = {
    'string': (input: any) => {
        if (typeof input !== 'string') {
            return false
        }
        return true

    },
    'number': (input: any) => {
        return typeof input == 'number' && !isNaN(input)
    },
    'int': (input: any) => {
        return typeof input == 'number' && !isNaN(input)
    },
    'json': (input: any) => {
        if (typeof input !== 'string') {
            return false
        }

        try {
            JSON.parse(input)
            return true
        } catch (error: any) {
            return false
        }
    },
    'emailaddress': (input: any) => {
        if (typeof input !== 'string') {
            return false
        }

        return Boolean(String(input).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/))
    },
    'datetime': (input: any) => {
        if (typeof input !== 'string' || typeof input !== 'number') {
            return false
        }
        return (/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)((-(\d{2}):(\d{2})|Z)?)$/gm.test(input))

    },
    'optional': (primitiveTypeTest: Function) => {
        return (input: any) => {
            const result = primitiveTypeTest(input)
            return input ? result : true
        }
    },
    'list': (primitiveTypeTest: Function) => {
        return (input: any) => {
            if (!Array.isArray(input)) {
                return false
            }

            const result = input.every((item) => primitiveTypeTest(item))
            return result
        }
    }
}

export default functions