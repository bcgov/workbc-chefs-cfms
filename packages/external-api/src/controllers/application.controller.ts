/* eslint-disable camelcase */
/* eslint-disable import/prefer-default-export */
/* eslint-disable no-param-reassign */
import * as express from "express"
import { insertApplication } from "../lib/transactions"
import * as applicationService from "../services/application.service"
import * as userService from "../services/user.service"
import * as formService from "../services/form.service"
import * as emailController from "./email.controller"

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

        // Update any drafts that have changed.
        const drafts = await applicationService.getStaleDrafts(bceid_guid)
        await Promise.all(drafts.map(updateApplicationFromForm))

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

        // Create a new form draft //
        const formID = applicationService.getFormId(req.body.formType)
        const formVersionID = applicationService.getFormVersionId(req.body.formType)
        const createDraftResult = await formService.createLoginProtectedDraft(
            req.kauth.grant.access_token,
            formID,
            formVersionID,
            req.body.formKey,
            {}
        )

        if (createDraftResult?.id) {
            const insertResult = await insertApplication(
                req.body.formKey,
                req.body.guid,
                req.body.formType,
                createDraftResult.id,
                req.kauth.grant.access_token.content.idp,
                req.kauth.grant.access_token.content.idp_username
            )
            if (insertResult?.rowCount === 1) {
                // successful insertion
                return res.status(200).send({ recordId: req.body.formKey, submissionId: createDraftResult.id })
            }
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
                if (submissionResponse.submission.draft === false) {
                    // Application form has been submitted; determine the catchment & storefront, then update the application in the DB //
                    await applicationService.updateApplication(
                        application.id,
                        "New",
                        submissionResponse.submission,
                        false
                    )

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
                        false
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
        const application = await applicationService.getApplicationByID(id)
        /* Only applications created by the user who sent the request
        or if the status is Awaiting Submission can be deleted */
        if (application.createdby !== bceid_guid || application.status !== null) {
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
