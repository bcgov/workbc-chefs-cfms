/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function up(knex) {
    return knex.raw(`
    CREATE TABLE IF NOT EXISTS public.applications
    (
        id character varying(255) COLLATE pg_catalog."default" NOT NULL,
        organization character varying(255) COLLATE pg_catalog."default",
        status character varying(255) COLLATE pg_catalog."default",
        form_type character varying(255) COLLATE pg_catalog."default",
        catchmentno integer,
        workbc_centre character varying(4) COLLATE pg_catalog."default",
        form_confirmation_id character varying(255) COLLATE pg_catalog."default",
        form_submission_id character varying(255) COLLATE pg_catalog."default",
        form_submitted_date timestamptz,
        created_by character varying(255) COLLATE pg_catalog."default",
        created_by_idp character varying(255) COLLATE pg_catalog."default",
        created_date timestamptz,
        updated_by character varying(255) COLLATE pg_catalog."default",
        updated_date timestamptz,
        stale boolean,
        CONSTRAINT applications_pkey PRIMARY KEY (id)
    )
    
    TABLESPACE pg_default;
    
    ALTER TABLE IF EXISTS public.applications
        OWNER to postgres;
    
    CREATE TABLE IF NOT EXISTS public.users
    (
        -- 'id': bceid guid
        id character varying(255) COLLATE pg_catalog."default" NOT NULL,
        bceid_username character varying(255) COLLATE pg_catalog."default",
        bceid_business_guid character varying(255) COLLATE pg_catalog."default",
        bceid_business_name character varying(255) COLLATE pg_catalog."default",
        contact_name character varying(255) COLLATE pg_catalog."default",
        contact_email character varying(255) COLLATE pg_catalog."default",
        phone_number character varying(12) COLLATE pg_catalog."default",
        fax_number character varying(12) COLLATE pg_catalog."default",
        cra_business_number character varying(255) COLLATE pg_catalog."default",
        street_address character varying(255) COLLATE pg_catalog."default",
        city character varying(255) COLLATE pg_catalog."default",
        province character varying(255) COLLATE pg_catalog."default",
        postal_code character varying(255) COLLATE pg_catalog."default",
        created_by character varying(255) COLLATE pg_catalog."default",
        created_date timestamptz,
        updated_by character varying(255) COLLATE pg_catalog."default",
        updated_date timestamptz,
        CONSTRAINT users_pkey PRIMARY KEY (id)
    )
    
    TABLESPACE pg_default;
    
    ALTER TABLE IF EXISTS public.users
        OWNER to postgres;
    
    CREATE TABLE IF NOT EXISTS public.users_applications
    (
        user_id character varying(255) COLLATE pg_catalog."default" REFERENCES users(id),
        application_id character varying(255) COLLATE pg_catalog."default" REFERENCES applications(id),
        CONSTRAINT users_applications_pkey PRIMARY KEY (user_id, application_id)
    )
    
    TABLESPACE pg_default;
    
    ALTER TABLE IF EXISTS public.users_applications
        OWNER to postgres;
    
    CREATE TABLE IF NOT EXISTS public.notifications
    (
        id SERIAL NOT NULL,
        email character varying(255) COLLATE pg_catalog."default",
        username character varying(255) COLLATE pg_catalog."default",
        catchmentno integer,
        type character varying(255) COLLATE pg_catalog."default"
    )
    
    TABLESPACE pg_default;
    
    ALTER TABLE IF EXISTS public.notifications
        OWNER to postgres;
    
    `)
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function down(knex) {
    return knex.raw(`
        DROP TABLE public.applications CASCADE;
        DROP TABLE public.users CASCADE;
        DROP TABLE public.users_applications CASCADE;
        DROP TABLE public.notifications CASCADE;
    `)
}
