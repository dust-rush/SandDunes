import { RequiredParamOptions } from '../types'

const RequiredParam = (paramOptions: RequiredParamOptions, input: unknown, errorMessage?: string) => {
    const response: { error?: string, passed: boolean } = {
        passed: true
    }

    typeof input != paramOptions.type
        ? response.passed = false
        : null

    if (typeof input != paramOptions.type && paramOptions.throwOnError) {
        throw new Error(errorMessage)
    }

    return response
}

export { RequiredParam }
export default RequiredParam