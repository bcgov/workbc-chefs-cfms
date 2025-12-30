import { AppEnv } from "../types"
const APP_ENV = process.env.REACT_APP_ENVIRONMENT || "Local Dev"

export const setAbsoluteCEPUrl = (): string => {
    switch (APP_ENV) {
        case "Local Dev":
            return "http://localhost:3000/"
        case "TEST":
            return "https://cep-intake-test.es.workbc.ca/"
        case "DEV":
            return "https://cep-intake-dev.es.workbc.ca/"
        case "PRODUCTION":
            return "https://cep-intake.es.workbc.ca/"
        default:
            return "http://localhost:3000/"
    }
}

export const setAppEnv = (): AppEnv => {
    switch (APP_ENV) {
        case "Local Dev":
            return "Local Dev"
        case "DEV":
            return "DEV"
        case "TEST":
            return "TEST"
        case "PRODUCTION":
            return "PRODUCTION"
        default:
            return "Local Dev"
    }
}

export const setEnvVariables = (): { appEnv: AppEnv; absolutePath: string } => {
    const appEnv = setAppEnv()
    const absolutePath = setAbsoluteCEPUrl()
    return { appEnv, absolutePath }
}
