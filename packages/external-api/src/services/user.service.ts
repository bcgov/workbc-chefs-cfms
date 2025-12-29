/* eslint-disable import/prefer-default-export */
import { knex } from "../config/db-config"

export const getAllusers = async (
    perPage: number,
    currPage: number,
    filters: any,
    sort: string[],
    businessGuid: string
) => {
    const users = await knex("users")
        .modify((queryBuilder: any) => {
            queryBuilder.where("bceid_business_guid", businessGuid)
            if (sort) {
                queryBuilder.orderBy(sort[0], sort[1])
            }
        })
        .paginate({ perPage, currentPage: currPage, isLengthAware: true })
    return users
}

export const insertuser = async (data: any) => {
    const userData: any = {}
    userData.id = data.id
    userData.created_by = data.id
    userData.created_date = new Date().toISOString()
    userData.contact_name = data.contact_name
    userData.contact_email = data.contact_email
    if (data.bceid_business_guid) {
        userData.bceid_business_guid = data.bceid_business_guid
    }
    if (data.bceid_business_name) {
        userData.bceid_business_name = data.bceid_business_name
    }
    if (data.bceid_username) {
        userData.bceid_username = data.bceid_username
    }
    const result = await knex("users").insert(userData)
    return result
}

export const getUserByID = async (userGuid: string) => {
    const user = await knex("users").where((builder: any) => builder.where("id", userGuid))
    return user.length === 1 ? user[0] : null
}

export const getUsersByIDs = async (userGuids: string[]) => {
    const users = await knex("users").where((builder: any) => builder.whereIn("id", userGuids))
    return users
}

export const updateUser = async (userGuid: string, data: any) => {
    let numUpdated = 0
    if (Object.keys(data).length > 0) {
        numUpdated = await knex("users")
            .where("id", userGuid)
            .modify((queryBuilder: any) => {
                queryBuilder.update("updated_by", userGuid)
                queryBuilder.update("updated_date", new Date().toISOString())
                if (data?.bceid_business_guid || data.bceid_business_guid === null) {
                    queryBuilder.update("bceid_business_guid", data.bceid_business_guid)
                }
                if (data?.bceid_business_name || data.bceid_business_name === null) {
                    queryBuilder.update("bceid_business_name", data.bceid_business_name)
                }
                if (data?.contact_name || data.contact_name === null) {
                    queryBuilder.update("contact_name", data.contact_name)
                }
                if (data?.contact_email || data.contact_email === null) {
                    queryBuilder.update("contact_email", data.contact_email)
                }
                if (data?.phone_number || data.phone_number === null) {
                    queryBuilder.update("phone_number", data.phone_number)
                }
                if (data?.fax_number || data.fax_number === null) {
                    queryBuilder.update("fax_number", data.fax_number)
                }
                if (data?.cra_business_number || data.cra_business_number === null) {
                    queryBuilder.update("cra_business_number", data.cra_business_number)
                }
                if (data?.street_address || data.street_address === null) {
                    queryBuilder.update("street_address", data.street_address)
                }
                if (data?.city || data.city === null) {
                    queryBuilder.update("city", data.city)
                }
                if (data?.province || data.province === null) {
                    queryBuilder.update("province", data.province)
                }
                if (data?.postal_code || data.postal_code === null) {
                    queryBuilder.update("postal_code", data.postal_code)
                }
            })
    }
    return numUpdated
}

// Update user profile from an application form obtained from CHEFS.
// Only update profile fields if they are not already set.
export const updateUserFromApplicationForm = async (user: any, appFormData: any) => {
    const updateData = {
        ...(appFormData?.operatingName &&
            !user?.bceid_business_name && { bceid_business_name: appFormData.operatingName }),
        ...(appFormData?.signatory1 && !user?.contact_name && { contact_name: appFormData.signatory1 }),
        ...(appFormData?.userEmail && !user?.contact_email && { contact_email: appFormData.userEmail }),
        ...(appFormData?.businessPhone && !user?.phone_number && { phone_number: appFormData.businessPhone }),
        ...(appFormData?.businessFax && !user?.fax_number && { fax_number: appFormData.businessFax }),
        ...(appFormData?.businessNumber &&
            !user?.cra_business_number && { cra_business_number: appFormData.businessNumber }),
        ...(appFormData?.businessAddress && !user?.street_address && { street_address: appFormData.businessAddress }),
        ...(appFormData?.businessCity && !user?.city && { city: appFormData.businessCity }),
        ...(appFormData?.businessProvince && !user?.province && { province: appFormData.businessProvince }),
        ...(appFormData?.businessPostal && !user?.postal_code && { postal_code: appFormData.businessPostal })
    }
    return updateUser(user.id, updateData)
}
