/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/prefer-default-export */
import { knex } from "../config/db-config"
import * as applicationService from "../services/application.service"
import * as formService from "../services/form.service"
import * as emailController from "../controllers/email.controller"

const updateApplication = async (application: any, data: any, username: string, trx: any) => {
    const numUpdated = await applicationService.updateApplication(application.id, username, data, trx)
    const applicationCancelled = data.status && data.status === "Cancelled"
    const catchmentUpdated =
        (data.catchmentNo && !application.catchmentno) ||
        (data.catchmentNo && application.catchmentno && data.catchmentNo !== application.catchmentno)
    const workBcCentreUpdated =
        (data.workBcCentre && !application.workbc_centre) ||
        (data.workBcCentre && application.workbc_centre && data.workBcCentre !== application.workbc_centre)
    if (!catchmentUpdated && !workBcCentreUpdated && !applicationCancelled) {
        return numUpdated
    }

    // update the chefs form if required //
    if (catchmentUpdated) {
        await updateChefsCatchment(application.form_type, application.form_submission_id, data.catchmentNo)

        // send notifications to the catchment if requested //
        if (data.sendNotifications === true) {
            await emailController.sendEmail("Application", data.catchmentNo)
        }
    }
    return numUpdated
}

export const updateChefsCatchment = async (formType: string, submissionID: string, catchment: number) => {
    const formID = process.env.CEP_FORM_ID as string
    const formPass = process.env.CEP_FORM_PASS as string
    if (submissionID && formID && formPass) {
        await formService
            .getSubmission(formID, formPass, submissionID)
            .then(async (submission) => {
                await formService
                    .updateSubmissionCatchment(submissionID, submission, catchment)
                    .then(() => {
                        console.log(
                            `[transactions] chefs update submission catchment call succeeded for submission id ${submissionID} with catchment ${catchment}`
                        )
                    })
                    .catch((e) => {
                        console.log(
                            `[transactions] chefs update submission catchment call failed for submission id ${submissionID} with catchment ${catchment} with error ${e} - this shouldn't happen!`
                        )
                    })
            })
            .catch((e) => {
                console.log(
                    `[transactions] chefs GET submission call failed for submission id ${submissionID} with error ${e} - this shouldn't happen!`
                )
            })
    } else {
        console.log(
            `[transactions] unable to update catchment for chefs form for submission id ${submissionID} - misconfiguration - this shouldn't happen!`
        )
    }
}

export const updateApplicationWithSideEffects = async (application: any, username: string, data: any) =>
    knex.transaction(async (trx: any) => updateApplication(application, data, username, trx))
