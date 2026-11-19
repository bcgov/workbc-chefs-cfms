import { Box, Chip } from "@mui/material"
import { FunctionField, Identifier, List, TextField, useRedirect, Loading } from "react-admin"
import { useEffect, useState } from "react"
import CustomDatagrid from "../common/components/CustomDatagrid/CustomDatagrid"
import { ListAside } from "../common/components/ListAside/ListAside"
import { CustomSearchInput } from "../common/components/CustomSearchInput/CustomSearchInput"

export const applicationStatusFilters = {
    All: { label: "All" },
    Draft: { label: "Draft", status: "Draft" },
    New: { label: "New", status: "New" },
    InProgress: { label: "In Progress", status: "In Progress" },
    Completed: { label: "Completed", status: "Completed" },
    Cancelled: { label: "Cancelled", status: "Cancelled" }
}

export const ApplicationList = (props: any) => {
    const [statusFilter, setStatusFilter] = useState(applicationStatusFilters["All"])
    const redirect = useRedirect()
    const [listIsLoading, setListIsLoading] = useState(true)
    const [listAsideIsLoading, setListAsideIsLoading] = useState(true)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        if (!listIsLoading && !listAsideIsLoading) {
            setReady(true)
        }
    }, [listIsLoading, listAsideIsLoading])

    const handleRowClick = (id: Identifier, resource: string, record: any) => {
        if (record.form_submission_id) {
            const formURL = process.env.REACT_APP_MINISTRY_VIEW_URL + record.form_submission_id
            window.open(formURL, "_blank")?.focus()
            redirect("/", "applications")
        } else {
            return "" // rowClick expects a path to be returned
        }
    }

    const applicationFilters = [
        <CustomSearchInput
            placeholder="Search applications..."
            source="search_query"
            alwaysOn
            style={{ width: "18em" }}
            containerStyle={{ transform: "translate(0em, -2.8em)" }}
        />
    ]

    return (
        <>
            <Box id="main-content-custom" tabIndex={0} aria-label="main content">
                {!ready && <Loading sx={{ marginTop: 20 }}></Loading>}
                <Box hidden={!ready} sx={{ paddingTop: "2em" }}>
                    <List
                        {...props}
                        filter={{ ...statusFilter }}
                        filterDefaultValues={{ ...applicationStatusFilters["All"] }}
                        filters={applicationFilters}
                        aside={
                            <ListAside
                                statusFilters={applicationStatusFilters}
                                statusFilter={statusFilter}
                                setStatusFilter={setStatusFilter}
                                setIsLoading={setListAsideIsLoading}
                            />
                        }
                        sort={{
                            field: "form_submitted_date,updated_date,created_date",
                            order: "DESC"
                        }}
                    >
                        <CustomDatagrid
                            rowClick={handleRowClick}
                            ariaLabel="applications list"
                            setIsLoading={setListIsLoading}
                        >
                            <TextField label="Submission ID" source="form_confirmation_id" />
                            <TextField label="Organization" source="organization" emptyText="-" />
                            <FunctionField
                                label="Submitted"
                                sortBy="form_submitted_date,updated_date,created_date"
                                sortByOrder="DESC"
                                render={(record: any) =>
                                    record.form_submitted_date
                                        ? new Date(record.form_submitted_date).toLocaleDateString()
                                        : "-"
                                }
                            />
                            <FunctionField
                                label="Last Updated"
                                sortBy="updated_date,created_date"
                                sortByOrder="DESC"
                                render={(record: any) =>
                                    record.form_submitted_date
                                        ? new Date(record.updated_date).toLocaleDateString()
                                        : new Date(record.created_date).toLocaleDateString()
                                }
                            />
                            <FunctionField
                                label="Status"
                                sortBy="status"
                                render={(record: any) => (
                                    <Box display="flex" width="100%" justifyContent="flex-start">
                                        <Chip
                                            label={record.status}
                                            size="small"
                                            color={
                                                record.status === "Draft"
                                                    ? "secondary"
                                                    : record.status === "New"
                                                      ? "info"
                                                      : record.status === "In Progress"
                                                        ? "warning"
                                                        : record.status === "Completed"
                                                          ? "success"
                                                          : record.status === "Cancelled"
                                                            ? "error"
                                                            : "primary"
                                            }
                                        />
                                    </Box>
                                )}
                            />
                        </CustomDatagrid>
                    </List>
                </Box>
            </Box>
        </>
    )
}
