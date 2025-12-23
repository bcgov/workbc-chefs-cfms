/* eslint-disable camelcase */
/* eslint-disable import/prefer-default-export */
import * as express from "express"

import * as userService from "../services/user.service"

export const getAllusers = async (req: any, res: express.Response) => {
    try {
        const { bceid_user_guid: bceid_guid, bceid_business_guid: business_guid } = req.kauth.grant.access_token.content
        if (bceid_guid === undefined || business_guid === undefined) {
            return res.status(403).send("Not Authorized")
        }
        const filter = req.query.filter ? JSON.parse(req.query.filter) : {}
        const sort: string[] = req.query.sort ? JSON.parse(req.query.sort) : ["id", "ASC"]
        const page = req.query.page ?? 1
        const perPage = req.query.perPage ?? 1
        const users = await userService.getAllusers(
            Number(perPage),
            Number(page),
            filter,
            sort,
            // Restrict results to user's own business.
            business_guid
        )
        res.set({
            "Access-Control-Expose-Headers": "Content-Range",
            "Content-Range": `0 - ${users.pagination.to} / ${users.pagination.total}`
        })
        return res.status(200).send(users.data)
    } catch (e: any) {
        console.log(e?.message)
        return res.status(500).send("Server Error")
    }
}

export const createuser = async (req: any, res: express.Response) => {
    try {
        const bceid_guid = req.kauth.grant.access_token.content?.bceid_user_guid
        if (bceid_guid === undefined) {
            return res.status(403).send("Not Authorized")
        }
        if (!req.body?.id || bceid_guid !== req.body.id) {
            return res.status(403).send("Forbidden")
        }
        const user = await userService.getUserByID(req.body.id)
        if (!user) {
            const insertResult = await userService.insertuser(req.body)
            return res.status(200).send({ data: insertResult })
        }
        return res.status(200).send({ data: {} })
    } catch (e: any) {
        console.log(e?.message)
        return res.status(500).send("Server Error")
    }
}

export const getOneuser = async (req: any, res: express.Response) => {
    try {
        const bceid_guid = req.kauth.grant.access_token.content?.bceid_user_guid
        if (bceid_guid === undefined) {
            return res.status(403).send("Not Authorized")
        }
        const { id } = req.body
        if (id == null) {
            return res.status(400).send("id is required")
        }
        if (bceid_guid !== id) {
            return res.status(403).send("Forbidden")
        }
        const user = await userService.getUserByID(id)
        if (!user) {
            return res.status(404).send("Not Found")
        }
        return res.status(200).send(user)
    } catch (e: any) {
        console.log(e?.message)
        return res.status(500).send("Server Error")
    }
}

export const updateUser = async (req: any, res: express.Response) => {
    try {
        const bceid_guid = req.kauth.grant.access_token.content?.bceid_user_guid
        if (bceid_guid === undefined) {
            return res.status(403).send("Not Authorized")
        }
        const { id } = req.body
        if (id == null) {
            return res.status(400).send("id is required")
        }
        const user = await userService.getUserByID(id)
        if (id !== bceid_guid) {
            return res.status(403).send("Forbidden")
        }
        if (!user) {
            return res.status(404).send("Not Found")
        }
        await userService.updateUser(id, req.body)
        return res.status(200).send({ id })
    } catch (e: any) {
        console.log(e?.message)
        return res.status(500).send("Server Error")
    }
}
