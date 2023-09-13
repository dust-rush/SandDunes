const functions: {
    [FunctionName: string]: Function
} = {
    'string': (input: any) => {
        if (typeof input !== 'string') {
            return false
        } else {
            return true
        }
    },
    'emailaddress': (input: any) => {
        if (typeof input !== 'string') {
            return false
        } else {
            return Boolean(String(input).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/))
        }
    },
    'datetime': (input: any) => {
        if (typeof input !== 'string' || typeof input !== 'number') {
            return false
        } else {
            return (/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)((-(\d{2}):(\d{2})|Z)?)$/gm.test(input))
        }
    },
    'optional': (primitiveTypeTest: Function) => {
        return (input: any) => {
            if (!input) {
                return true
            }

            const result = primitiveTypeTest(input)
            return result
        }
    }
}

export default functions