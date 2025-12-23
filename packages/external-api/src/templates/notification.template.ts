// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const generateHTMLEmail = require("../utils/htmlEmail")

const applicationNotification = (catchmentNo: string, catchmentName: string, type: string, formID?: string) => {
    const newApplicationUrl = `${process.env.APPLICATION_NOTIFICATION_URL}${formID}`
    const email = generateHTMLEmail(
        `A CEP Application has been submitted`,
        [
            ` Hello `,
            ` You are receiving this email because you enabled notifications on CEP Applications for Catchment ${catchmentNo} - ${catchmentName}.`
        ],
        [
            `Please log into the CEP Intake Platform to view the 
            <a href="${newApplicationUrl}"> ${"Application"} </a>`
        ],
        [`Sincerely,<br><b>Your WorkBC team<br></b>`]
    )
    return email
}

export default {
    applicationNotification
}
