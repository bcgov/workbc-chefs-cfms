import { maskJSON2, maskStringV2 } from "maskdata"

const IDMaskingConfig = {
    maskWith: "*",
    fixedOutputLength: undefined,
    unmaskedStartCharacters: 3
}

const AddressMaskingConfig = {
    maskWith: "*",
    fixedOutputLength: undefined,
    unmaskedStartCharacters: 5,
    unmaskedEndCharacters: 0
}

const JSONMaskingConfig = {
    emailMaskOptions: {
        maskWith: "*",
        unmaskedStartCharactersBeforeAt: 3,
        unmaskedEndCharactersAfterAt: 3,
        maskAtTheRate: false
    },
    emailFields: ["Email", "email"],

    phoneMaskOptions: {
        maskWith: "*",
        unmaskedStartDigits: 4,
        unmaskedEndDigits: 1
    },
    phoneFields: ["mobileNumber", "phn", "homeNumber"],

    stringMaskOptions: {
        maskWith: "*",
        maskOnlyFirstOccurance: false,
        values: [],
        maskAll: false,
        maskSpace: true
    },
    stringFields: ["baseProfile.email"],

    jwtMaskOptions: {
        maskWith: "*",
        maxMaskedCharacters: 20,
        maskDot: true,
        maskHeader: true,
        maskPayload: true,
        maskSignature: true
    },
    jwtFields: ["SigningToken"],

    genericStrings: [
        {
            fields: [],
            config: {
                maskWith: "*",
                maskAll: true
            }
        }
    ]
}

const EmailMaskingConfig = {
    maskWith: "*",
    fixedOutputLength: 20,
    unmaskedStartCharacters: 5,
    unmaskedEndCharacters: 0
}

const maskID = (ID: string) => maskStringV2(ID, IDMaskingConfig)

const maskJSON = (log: unknown): string | undefined => {
    try {
        if (typeof log === "object" && log !== null) {
            return JSON.stringify(maskJSON2(log, JSONMaskingConfig))
        }
    } catch (error) {
        return String(log)
    }
    return String(log)
}

const maskAddress = (address: string) => maskStringV2(address, AddressMaskingConfig)

const maskEmail = (email: string) => maskStringV2(email, EmailMaskingConfig)

export { maskID, maskJSON, maskAddress, maskEmail }
