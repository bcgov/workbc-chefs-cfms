/* eslint-disable camelcase */
/* eslint-disable import/prefer-default-export */
/* eslint-disable no-param-reassign */
import * as express from "express"
import { insertApplication } from "../lib/transactions"
import * as applicationService from "../services/application.service"
import * as userService from "../services/user.service"
import * as formService from "../services/form.service"
import * as geocoderService from "../services/geocoder.service"
import * as emailController from "./email.controller"
import { maskAddress } from "../utils/logging"

export const getAllApplications = async (req: any, res: express.Response) => {
    try {
        const bceid_guid = req.kauth.grant.access_token.content?.bceid_user_guid
        if (bceid_guid === undefined) {
            return res.status(401).send("Not Authorized")
        }
        const filter = req.query.filter ? JSON.parse(req.query.filter) : {}
        const sort: string[] = req.query.sort ? JSON.parse(req.query.sort) : []
        const sortFields = sort?.length > 0 ? sort[0].split(",") : []
        const sortOrder = sort?.length > 1 ? sort[1] : ""
        const page = req.query.page ?? 1
        const perPage = req.query.perPage ?? 1

        const applications = await applicationService.getAllApplications(
            Number(perPage),
            Number(page),
            filter,
            sortFields,
            sortOrder,
            bceid_guid
        )

        res.set({
            "Access-Control-Expose-Headers": "Content-Range",
            "Content-Range": `0 - ${applications.pagination.to} / ${applications.pagination.total}`
        })
        return res.status(200).send(applications.data)
    } catch (e: any) {
        console.log(e?.message)
        return res.status(500).send("Server Error")
    }
}

export const getApplicationCounts = async (req: any, res: express.Response) => {
    try {
        const bceid_guid = req.kauth.grant.access_token.content?.bceid_user_guid
        if (bceid_guid === undefined) {
            return res.status(401).send("Not Authorized")
        }
        const applicationCounts = await applicationService.getApplicationCounts(bceid_guid)
        return res.status(200).send(applicationCounts)
    } catch (e: unknown) {
        return res.status(500).send("Internal Server Error")
    }
}

export const createApplication = async (req: any, res: express.Response) => {
    try {
        const bceid_guid = req.kauth.grant.access_token.content?.bceid_user_guid
        if (bceid_guid === undefined) {
            return res.status(401).send("Not Authorized")
        }
        if (!req.body?.guid || req.body.guid !== bceid_guid) {
            return res.status(403).send("Forbidden")
        }

        const insertResult = await insertApplication(
            req.body.formKey,
            req.body.guid,
            req.body.formType,
            "",
            req.kauth.grant.access_token.content.idp,
            req.kauth.grant.access_token.content.idp_username
        )
        if (insertResult?.rowCount === 1) {
            // successful insertion
            return res.status(200).send({ recordId: req.body.formKey })
        }
        return res.status(500).send("Internal Server Error")
    } catch (e: any) {
        console.log(e?.message)
        return res.status(500).send("Internal Server Error")
    }
}

export const getOneApplication = async (req: any, res: express.Response) => {
    try {
        const bceid_guid = req.kauth.grant.access_token.content?.bceid_user_guid
        if (bceid_guid === undefined) {
            return res.status(401).send("Not Authorized")
        }
        const { id } = req.params
        const userApplicationRecord = await applicationService.getUserApplicationRecord(bceid_guid, id)
        if (!userApplicationRecord) {
            return res.status(403).send("Forbidden or Not Found")
        }
        const application = await applicationService.getApplicationByID(id)
        return res.status(200).send(application)
    } catch (e: unknown) {
        return res.status(500).send("Internal Server Error")
    }
}

// Update stale applications with latest data from CHEFS forms.
export const syncApplications = async (req: any, res: express.Response) => {
    try {
        const bceid_guid = req.kauth.grant.access_token.content?.bceid_user_guid
        if (bceid_guid === undefined) {
            return res.status(403).send("Not Authorized")
        }
        const user = await userService.getUserByID(bceid_guid)
        if (!user) {
            return res.status(403).send("Forbidden or Not Found")
        }
        // Update any drafts that have changed.
        const drafts = await applicationService.getStaleDrafts(bceid_guid)
        await Promise.all(drafts.map(updateApplicationFromForm))
        return res.status(200).send({})
    } catch (e: any) {
        console.log(e?.message)
        return res.status(500).send("Internal Server Error")
    }
}

// updates the status of applications that have been submitted or in draft
const updateApplicationFromForm = async (application: any) => {
    try {
        if (application.status === "Draft") {
            const formID = applicationService.getFormId(application.form_type)
            const formPass = applicationService.getFormPass(application.form_type)
            if (formID && formPass && application.form_submission_id) {
                console.log(
                    `[application.controller] updating submitted application for application id ${application.id} and submission id ${application.form_submission_id}`
                )
                const submissionResponse = await formService.getSubmission(
                    formID,
                    formPass,
                    application.form_submission_id
                )
                const submission = submissionResponse?.submission.submission
                if (submissionResponse.submission.draft === false) {
                    // Application form has been submitted; determine the catchment & storefront, then update the application in the DB //
                    let catchment
                    let storefront
                    const selected = submission?.data?.otherSelectedCentre ?? submission?.data?.selectedCentre
                    if (selected && selected.catchment && selected.storefront) {
                        console.log(
                            `[application.controller] submission id ${application.form_submission_id} has selected the following catchment & storefront: ${selected.catchment} ${selected.storefront}`
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
                            submission?.data?.businessAddress &&
                            submission.data.businessCity &&
                            submission.data.businessProvince
                        ) {
                            address = submission.data.businessAddress
                            city = submission.data.businessCity
                            province = submission.data.businessProvince
                        }
                        console.log(
                            `[application.controller] address for submission id ${
                                application.form_submission_id
                            } - Address: ${maskAddress(address)}, City: ${city}, Province: ${province}`
                        )
                        const { Score, Catchment, Storefront } = await geocoderService.geocodeAddress(
                            address,
                            city,
                            province
                        )
                        console.log(
                            `[application.controller] address validation result for submission id ${application.form_submission_id} - Score: ${Score}, Catchment: ${Catchment}, Storefront: ${Storefront}`
                        )
                        if (Score && Catchment && Storefront) {
                            if (Score >= 80) {
                                catchment = Catchment
                                storefront = Storefront
                            } else {
                                console.log(
                                    `[application.controller] insufficient address validation score for application submission id ${application.form_submission_id} - this shouldn't happen!`
                                )
                            }
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
                            `[application.controller] catchment & storefront calculation failed for submission id ${application.form_submission_id} - this shouldn't happen!`
                        )
                    }
                    await applicationService.updateApplication(
                        application.id,
                        "New",
                        submissionResponse.submission,
                        true
                    )

                    // Update the catchment of the form in CHEFS //
                    if (catchment) {
                        await formService.updateSubmissionCatchment(
                            application.form_submission_id,
                            submissionResponse.submission,
                            catchment
                        )
                    }

                    // Send email confirmations and notifications //
                    await emailController
                        .sendEmail(submissionResponse.submission.submission, application.id)
                        .then(() => {
                            console.log(
                                `[application.controller] successfully sent notifications for submission id ${application.form_submission_id}`
                            )
                        })
                        .catch((e) => {
                            console.log(
                                `[application.controller] error sending notifications for submission id ${application.form_submission_id} - Error:`,
                                e
                            )
                        })
                } else if (submissionResponse.submission.draft === true) {
                    // Form is still in draft
                    await applicationService.updateApplication(
                        application.id,
                        "Draft",
                        submissionResponse.submission,
                        true
                    )
                }
            }
        }
    } catch (e: any) {
        throw new Error(
            `[application.controller] updateApplicationFromForm failed for submission id ${application.form_submission_id} with message: ${e?.message}`
        )
    }
}

export const shareApplication = async (req: any, res: express.Response) => {
    try {
        const { bceid_user_guid, bceid_business_guid } = req.kauth.grant.access_token.content
        if (bceid_user_guid === undefined) {
            return res.status(401).send("Not Authorized")
        }
        const { id } = req.params
        const { users } = req.body
        const targetUsers = await userService.getUsersByIDs(users)
        const userApplicationRecord = await applicationService.getUserApplicationRecord(bceid_user_guid, id)
        const applicationRecord = await applicationService.getApplicationByID(userApplicationRecord?.application_id)
        if (
            !userApplicationRecord ||
            !applicationRecord ||
            bceid_business_guid === undefined ||
            !targetUsers.every((user: any) => user.bceid_business_guid === bceid_business_guid)
        ) {
            return res.status(403).send("Forbidden or Not Found")
        }
        const application = await applicationService.getApplicationByID(id)
        const shareResult = await formService.shareForm(
            applicationRecord.status === "Draft" ? req.kauth.grant.access_token.token : null, // use users token for draft states
            application.form_submission_id,
            users
        )
        if (shareResult) {
            await applicationService.shareApplication(id, users)
        } else {
            console.log(`error sharing form for application ${id}`)
            return res.status(500).send("Internal Server Error")
        }
        return res.status(200).send({ id })
    } catch (e: any) {
        console.log(e?.message)
        return res.status(500).send("Internal Server Error")
    }
}

export const deleteApplication = async (req: any, res: express.Response) => {
    try {
        const bceid_guid = req.kauth.grant.access_token.content?.bceid_user_guid
        if (bceid_guid === undefined) {
            return res.status(403).send("Not Authorized")
        }
        const { id } = req.params
        const wage = await applicationService.getApplicationByID(id)
        /* Only applications created by the user who sent the request
        or if the status is Awaiting Submission can be deleted */
        if (wage.createdby !== bceid_guid || wage.status !== null) {
            return res.status(401).send("Not Authorized")
        }
        const deleted = await applicationService.deleteApplication(id)
        if (deleted) {
            return res.status(200).send({ id })
        }
        return res.status(401).send("Not Found or Not Authorized")
    } catch (e: any) {
        console.log(e?.message)
        return res.status(500).send("Internal Server Error")
    }
}

export const updateApplication = async (req: any, res: express.Response) => {
    try {
        const bceid_guid = req.kauth.grant.access_token.content?.bceid_user_guid
        if (bceid_guid === undefined) {
            return res.status(403).send("Not Authorized")
        }
        const { id } = req.params
        const userApplicationRecord = await applicationService.getUserApplicationRecord(bceid_guid, id)
        if (!userApplicationRecord) {
            return res.status(403).send("Forbidden or Not Found")
        }
        await applicationService.updateApplication(id, null, req.body)
        return res.status(200).send({ id })
    } catch (e: any) {
        console.log(e?.message)
        return res.status(500).send("Internal Server Error")
    }
}

// Mark an application as stale.
export const markApplication = async (req: any, res: express.Response) => {
    try {
        const bceid_guid = req.kauth.grant.access_token.content?.bceid_user_guid
        if (bceid_guid === undefined) {
            return res.status(403).send("Not Authorized")
        }
        const { id } = req.params
        const userApplicationRecord = await applicationService.getUserApplicationRecord(bceid_guid, id)
        if (!userApplicationRecord) {
            return res.status(403).send("Forbidden or Not Found")
        }
        await applicationService.markApplication(id)
        return res.status(200).send({ id })
    } catch (e: any) {
        console.log(e?.message)
        return res.status(500).send("Internal Server Error")
    }
}
