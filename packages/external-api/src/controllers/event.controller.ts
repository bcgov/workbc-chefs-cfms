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

        const formPass = process.env.APPLICATION_FORM_PASS

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
        if (formType === "HaveEmployeeForm" || formType === "NeedEmployeeForm") {
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
                    console.log(
                        `[event.controller] updating submitted application for application id ${application.id} and submission id ${req.body.submissionId}`
                    )
                    // Application form has been submitted; determine the catchment & storefront, then update the application in the DB //
                    let catchment
                    let storefront
                    const selected = submission?.data?.otherSelectedCentre ?? submission?.data?.selectedCentre
                    if (selected && selected.catchment && selected.storefront) {
                        console.log(
                            `[event.controller] submission id ${req.body.submissionId} has selected the following catchment & storefront: ${selected.catchment} ${selected.storefront}`
                        )
                        catchment = selected.catchment
                        storefront = selected.storefront
                    } else {
                        // Route the catchment & storefront for the submitted application //
                        // Use the workplace address if provided, otherwise use the business address //
                        let address
                        let city
                        let province
                        const workplaceContainer = submission?.data?.container
                        if (
                            workplaceContainer?.addressAlt &&
                            workplaceContainer.cityAlt &&
                            workplaceContainer.provinceAlt
                        ) {
                            address = workplaceContainer.addressAlt
                            city = workplaceContainer.cityAlt
                            province = workplaceContainer.provinceAlt
                        } else if (
                            submission.data.businessAddress &&
                            submission.data.businessCity &&
                            submission.data.businessProvince
                        ) {
                            address = submission.data.businessAddress
                            city = submission.data.businessCity
                            province = submission.data.businessProvince
                        }
                        console.log(
                            `[event.controller] address for submission id ${
                                req.body.submissionId
                            } - Address: ${maskAddress(address)}, City: ${city}, Province: ${province}`
                        )
                        const { Score, Catchment, Storefront } = await geocoderService.geocodeAddress(
                            address,
                            city,
                            province
                        )
                        console.log(
                            `[event.controller] address validation result for submission id ${req.body.submissionId} - Score: ${Score}, Catchment: ${Catchment}, Storefront: ${Storefront}`
                        )
                        if (Score && Catchment && Storefront) {
                            if (Score >= 80) {
                                catchment = Catchment
                                storefront = Storefront
                            } else {
                                console.log(
                                    `[event.controller] insufficient address validation score for application submission id ${req.body.submissionId} - this shouldn't happen!`
                                )
                            }
                        } else {
                            console.log(
                                `[event.controller] insufficient results returned from address validation for submission id ${req.body.submissionId} - this shouldn't happen!`
                            )
                        }
                    }

                    if (catchment && storefront) {
                        const newDataObj = Object.assign(submissionResponse.submission.submission.data, {
                            catchmentNo: catchment,
                            storefrontId: storefront,
                            catchmentNoStoreFront: `${catchment}-${storefront}`,
                            matchedToCentre: `${catchment}-${storefront}`
                        })
                        submissionResponse.submission.submission.data = newDataObj // update the object used for updating the application record
                    } else {
                        console.log(
                            `[event.controller] catchment & storefront calculation failed for submission id ${req.body.submissionId} - this shouldn't happen!`
                        )
                    }

                    // Update the application //
                    updateResult = await applicationService.updateApplication(
                        application.id,
                        "New",
                        submissionResponse.submission,
                        false
                    )

                    // If first application submitted, backfill user profile from form data.
                    const firstApplicationSubmitted = await applicationService.oneApplicationSubmitted(
                        application.created_by
                    )
                    if (firstApplicationSubmitted) {
                        const user = await userService.getUserByID(application.created_by)
                        if (!user) {
                            throw new Error("Internal Server Error")
                        }
                        await userService.updateUserFromApplicationForm(
                            user,
                            submissionResponse.submission.submission.data
                        )
                    }

                    // Update the catchment of the form in CHEFS //
                    if (catchment) {
                        await formService.updateSubmissionCatchment(
                            req.body.submissionId,
                            submissionResponse.submission,
                            catchment
                        )
                    }

                    // Send notification(s) //
                    await emailController
                        .sendEmail(submissionResponse.submission.submission, application.id)
                        .then(() => {
                            console.log(
                                `[event.controller] successfully sent notifications for submission id ${req.body.submissionId}`
                            )
                        })
                        .catch((e) => {
                            console.log(
                                `[event.controller] error sending notifications for submission id ${req.body.submissionId} - Error:`,
                                e
                            )
                            return res.status(500).send("Internal Server Error")
                        })
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
