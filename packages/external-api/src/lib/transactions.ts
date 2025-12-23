/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/prefer-default-export */
import { knex } from "../config/db-config"
import * as applicationService from "../services/application.service"

export const insertApplication = async (
    id: string,
    userGuid: string,
    formType: string,
    submissionID: string,
    idp: string,
    idpUsername: string
) =>
    knex.transaction(async (trx: any) => {
        const applicationResult = await applicationService.insertApplication(
            id,
            userGuid,
            formType,
            submissionID,
            idp,
            idpUsername,
            trx
        )
        if (applicationResult.rowCount !== 1) {
            throw new Error("Insert failed")
        }
        const userApplicationResult = await applicationService.insertUserApplicationRecord(userGuid, id, trx)
        if (userApplicationResult.rowCount !== 1) {
            throw new Error("Insert failed")
        }
        return applicationResult
    })
