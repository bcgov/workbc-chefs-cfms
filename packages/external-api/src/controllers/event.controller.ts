/* eslint-disable camelcase */
/* eslint-disable import/prefer-default-export */
import * as express from "express"
import * as applicationService from "../services/application.service"
import * as userService from "../services/user.service"
import * as formService from "../services/form.service"
import * as emailController from "./email.controller"
import * as geocoderService from "../services/geocoder.service"
import { maskAddress } from "../utils/logging"

export const submission = async (req: express.Request, res: express.Response) => {
    try {
        const { formType } = req.params
        const passedKey = req.headers["x-api-key"]
        if (!formType) {
            return res.status(400).send("Form type parameter required")
        }
        console.log(
            `[event.controller] submission event received for form type ${formType} with submission id ${req.body.submissionId}`
        )

        const formPass = applicationService.getFormPass(formType)

        if (!formPass) {
            return res.status(400).send("Invalid form type parameter provided")
        }
        if (!passedKey || passedKey !== formPass) {
            return res.status(401).send("Invalid api key")
        }

        const submissionResponse = await formService.getSubmission(req.body.formId, formPass, req.body.submissionId)
        const submission = submissionResponse?.submission?.submission
        if (!submission) {
            console.log(
                `[event.controller] failed to obtain submission data for submission id ${req.body.submissionId}`
            )
            return res.status(500).send("Internal Server Error")
        }

        // Application form events //
        if (formType === "PBLMT" || formType === "JCP" || formType === "LMP" || formType === "RI") {
            const application = await applicationService.getApplicationBySubmissionID(req.body.submissionId)
            if (!application) {
                console.log(
                    `[event.controller] application record not found - aborting for submission id ${req.body.submissionId}`
                )
                return res.status(404).send()
            }
            if (application?.status === "Draft") {
                let updateResult
                if (submissionResponse.submission.draft === false) {
                    // Update the application //
                    updateResult = await applicationService.updateApplication(
                        application.id,
                        "New",
                        submissionResponse.submission,
                        false
                    )
                } else if (submissionResponse.submission.draft === true) {
                    console.log(
                        `[event.controller] updating saved application for application id ${application.id} and submission id ${req.body.submissionId}`
                    )
                    updateResult = await applicationService.updateApplication(
                        application.id,
                        "Draft",
                        submissionResponse.submission,
                        false
                    )
                }
                if (updateResult === 1) {
                    console.log(
                        `[event.controller] application record update successful for application id ${application.id} and submission id ${req.body.submissionId}`
                    )
                    return res.status(200).send()
                }
                console.log(
                    `[event.controller] unable to update application database entry for application id ${application.id} and submission id ${req.body.submissionId}`
                )
                return res.status(500).send("Internal Server Error")
            }
            console.log(
                `[event.controller] application record is not in Draft status - aborting for submission id ${req.body.submissionId}`
            )
            return res.status(500).send("Internal Server Error")
        }

        return res.status(200).send()
    } catch (e: unknown) {
        console.log(e)
        return res.status(500).send("Server Error")
    }
}
