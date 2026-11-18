/* eslint-disable camelcase */
/* eslint-disable import/prefer-default-export */
import * as express from "express"

import WorkBcCentres from "../data/workbc-centres"
import { getCatchments } from "../lib/catchment"
import { updateApplicationWithSideEffects } from "../lib/transactions"
import * as applicationService from "../services/application.service"

const workBcCentreCodes = Object.keys(WorkBcCentres)

export const getAllApplications = async (req: any, res: express.Response) => {
    try {
        const { bceid_user_guid, idir_user_guid, idp } = req.kauth.grant.access_token.content
        if (bceid_user_guid === undefined && idir_user_guid === undefined) {
            return res.status(401).send("Not Authorized")
        }
        const filter = req.query.filter ? JSON.parse(req.query.filter) : {}
        const catchments = await getCatchments(req.kauth.grant.access_token)
        if (
            catchments.length === 0 ||
            filter.catchmentno == null ||
            (Number(filter.catchmentno) === 0 && idp !== "idir") ||
            (Number(filter.catchmentno) !== -1 &&
                Number(filter.catchmentno) !== 0 &&
                !catchments.includes(filter.catchmentno))
        ) {
            return res.status(403).send("Forbidden")
        }
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
            sortOrder
        )

        // TODO: synchronize DB with CHEFS forms as necessary.

        res.set({
            "Access-Control-Expose-Headers": "Content-Range",
            "Content-Range": `0 - ${applications.pagination.to} / ${applications.pagination.total}`
        })
        return res.status(200).send(applications.data)
    } catch (e: unknown) {
        console.log(e)
        return res.status(500).send("Internal Server Error")
    }
}

export const getApplicationCounts = async (req: any, res: express.Response) => {
    try {
        const { bceid_user_guid, idir_user_guid, idp } = req.kauth.grant.access_token.content
        if (bceid_user_guid === undefined && idir_user_guid === undefined) {
            return res.status(401).send("Not Authorized")
        }
        const filter = req.query.filter ? JSON.parse(req.query.filter) : {}
        const catchments = await getCatchments(req.kauth.grant.access_token)
        if (
            catchments.length === 0 ||
            filter.catchmentno == null ||
            (Number(filter.catchmentno) === 0 && idp !== "idir") ||
            (Number(filter.catchmentno) !== -1 &&
                Number(filter.catchmentno) !== 0 &&
                !catchments.includes(filter.catchmentno))
        ) {
            return res.status(403).send("Forbidden")
        }
        const applicationCounts = await applicationService.getApplicationCounts(filter.catchmentno)
        return res.status(200).send(applicationCounts)
    } catch (e: unknown) {
        console.log(e)
        return res.status(500).send("Internal Server Error")
    }
}

export const getOneApplication = async (req: any, res: express.Response) => {
    try {
        const { bceid_user_guid, idir_user_guid } = req.kauth.grant.access_token.content
        if (bceid_user_guid === undefined && idir_user_guid === undefined) {
            return res.status(401).send("Not Authorized")
        }
        const { id } = req.params
        const application = await applicationService.getApplicationByID(id)
        const catchments = await getCatchments(req.kauth.grant.access_token)
        if (catchments.length === 0 || (application && !catchments.includes(application.catchmentno))) {
            return res.status(403).send("Forbidden")
        }
        if (!application) {
            return res.status(404).send("Not Found")
        }
        return res.status(200).send(application)
    } catch (e: unknown) {
        console.log(e)
        return res.status(500).send("Internal Server Error")
    }
}

export const updateApplication = async (req: any, res: express.Response) => {
    try {
        const { bceid_user_guid, idir_user_guid } = req.kauth.grant.access_token.content
        if (bceid_user_guid === undefined && idir_user_guid === undefined) {
            return res.status(401).send("Not Authorized")
        }
        const { id } = req.params
        const application = await applicationService.getApplicationByID(id)
        const catchments = await getCatchments(req.kauth.grant.access_token)
        if (
            catchments.length === 0 ||
            (application && !catchments.includes(application.catchmentno)) ||
            (req.body.workBcCentre && !req.body.catchmentNo) ||
            (req.body.catchmentNo &&
                (!catchments.includes(req.body.catchmentNo) ||
                    !req.body.workBcCentre ||
                    Number(req.body.workBcCentre.split("-")[0]) !== req.body.catchmentNo ||
                    !workBcCentreCodes.includes(req.body.workBcCentre))) ||
            (application &&
                req.body.catchmentNo &&
                (application.catchmentno !== req.body.catchmentNo ||
                    application.workbc_centre !== req.body.workBcCentre) &&
                idir_user_guid === undefined)
        ) {
            return res.status(403).send("Forbidden")
        }
        if (!application) {
            return res.status(404).send("Not Found")
        }
        await updateApplicationWithSideEffects(application, bceid_user_guid || idir_user_guid, req.body)
        return res.status(200).send({ id })
    } catch (e: unknown) {
        console.log(e)
        return res.status(500).send("Internal Server Error")
    }
}

export const deleteApplication = async (req: any, res: express.Response) => {
    try {
        const { bceid_user_guid, idir_user_guid } = req.kauth.grant.access_token.content
        if (bceid_user_guid === undefined && idir_user_guid === undefined) {
            return res.status(401).send("Not Authorized")
        }
        const { id } = req.params
        const application = await applicationService.getApplicationByID(id)
        const catchments = await getCatchments(req.kauth.grant.access_token)
        if (
            idir_user_guid === undefined ||
            catchments.length === 0 ||
            (application && !catchments.includes(application.catchmentno))
        ) {
            return res.status(403).send("Forbidden")
        }
        if (!application) {
            return res.status(404).send("Not Found")
        }
        const numDeleted = await applicationService.deleteApplication(id)
        if (numDeleted === 1) {
            // TODO: delete CHEFS form.
        } else {
            throw new Error("Delete failed")
        }
        return res.status(200).send({ id })
    } catch (e: unknown) {
        console.log(e)
        return res.status(500).send("Internal Server Error")
    }
}
