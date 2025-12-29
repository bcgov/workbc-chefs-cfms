// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const generateHTMLEmail = require("../utils/htmlEmail")

const employeeReceivedHaveEmployee = () => {
    const email = generateHTMLEmail("WorkBC CEP Intake Application - Next Steps", [], [])
    return email
}

const userReceivedHaveEmployee = () => {
    const email = generateHTMLEmail("Thank you, your application has been received", [], [])
    return email
}

const userReceivedNeedEmployee = () => {
    const email = generateHTMLEmail("Thank you, your application has been received", [], [])
    return email
}

export default {
    employeeReceivedHaveEmployee,
    userReceivedHaveEmployee,
    userReceivedNeedEmployee
}
