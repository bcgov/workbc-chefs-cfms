/* eslint-disable import/prefer-default-export */
// eslint-disable-next-line import/no-relative-packages
import { Notification } from "../typings/emailData"
import pins from "../constants/centres.json"

import notificationService from "../services/notification.service"
import * as emailService from "../services/email.service"
import received from "../templates/received.template"
import notificationTemplate from "../templates/notification.template"

const createEmailHTMLBasedOnType = (applicationType: string, applicantType: string) => {
    let emailHTML = ""
    if (String(applicationType) === "HaveEmployee") {
        if (applicantType === "employee") {
            emailHTML = received.employeeReceivedHaveEmployee()
        } else if (applicantType === "user") {
            emailHTML = received.userReceivedHaveEmployee()
        }
    } else if (String(applicationType) === "NeedEmployee") {
        emailHTML = received.userReceivedNeedEmployee()
    }
    return emailHTML
}

export const sendEmail = async (formData: any, formID?: string) => {
    try {
        const { data } = formData
        const applicationType = String(data.applicationType)
        let userRecipients: string[] = []
        const employeeRecipients: string[] = []
        if (String(applicationType) === "HaveEmployee") {
            Object.keys(data).forEach((key: string) => {
                userRecipients = [data.userEmail]
                if (key.includes("employeeEmail")) {
                    if (!employeeRecipients.includes(data[key])) {
                        employeeRecipients.push(data[key])
                    }
                }
                if (key.includes("position2")) {
                    Object.keys(data[key]).forEach((k: string) => {
                        if (k.includes("employeeEmail")) {
                            // check if email in employee recipients array already
                            if (!employeeRecipients.includes(data[key][k])) {
                                employeeRecipients.push(data[key][k])
                            }
                        }
                    })
                }
            })
            // if it is a Need Employee email, only send the user a confirmation email
        } else if (String(applicationType) === "NeedEmployee") {
            userRecipients = [data.userEmail]
        }

        const userEmailHTML = createEmailHTMLBasedOnType(applicationType, "user")
        const employeeEmailHTML = createEmailHTMLBasedOnType(applicationType, "employee")

        // Send the emails //
        if (userRecipients.length !== 0) {
            await emailService
                .sendEmail(userEmailHTML, `Wage Subsidy Application Submitted`, userRecipients)
                .catch((e) => {
                    console.log(`[email.controller] error sending user email`)
                })
        }
        if (employeeRecipients.length !== 0) {
            await emailService
                .sendEmail(employeeEmailHTML, `Wage Subsidy Application Submitted`, employeeRecipients)
                .catch((e) => {
                    console.log(`[email.controller] error sending employee email(s)`)
                })
        }

        // Get catchment number and then proceed to send notifications to all users who have enabled notifications on that catchment's applications
        if (String(applicationType) === "ApplicationForm") {
            const catchmentName = pins.find((pin) => Number(pin.CatchmentNo) === Number(data.catchmentNo))?.Title
            const notificationHTML = notificationTemplate.applicationNotification(
                `${data.catchmentNo}`,
                catchmentName || "",
                "application",
                formID
            )
            const notificationList = await notificationService.getNotification(Number(data.catchmentNo), "application")
            if (notificationList.length === 0) {
                console.log(`[email.controller] No notifications found for catchment ${data.catchmentNo}`)
            }
            // Send notifications emails to clients with notifications enabled (entry in notifications table)
            await Promise.all(
                notificationList.map(async (notification: Notification) => {
                    await emailService.sendEmail(notificationHTML, `New CEP Application Submitted`, [
                        notification.email
                    ])
                })
            )
        }

        return "Email sent"
    } catch (e: unknown) {
        // eslint-disable-next-line no-console
        console.error(e)
        throw new Error("Email failed to send")
    }
}
