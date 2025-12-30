// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const generateHTMLEmail = require("../utils/htmlEmail")

const catchmentMoveNotification = (catchmentNo: string, catchmentName: string, resource: string) => {
    const applicationsUrl = `${process.env.CEP_INTAKE_URL}/#/applications`
    const email = generateHTMLEmail(
        `A CEP Intake Application has been moved to Catchment ${catchmentNo} - ${catchmentName}`,
        [
            ` Hello, `,
            ` You are receiving this email because you enabled notifications on CEP Intake Applications for Catchment ${catchmentNo} - ${catchmentName}.`
        ],
        [`Please log into the <a href="${applicationsUrl}">CEP Intake Platform </a> to view the Application.`],
        [`Sincerely,<br><b>Your WorkBC team<br></b>`]
    )
    return email
}

export default {
    catchmentMoveNotification
}
