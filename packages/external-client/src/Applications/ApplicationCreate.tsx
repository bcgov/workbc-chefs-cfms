import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import { useEffect, useState } from "react"
import { LoadingIndicator, useCreate, useGetIdentity, useGetList, useRedirect } from "react-admin"
import { useSearchParams } from "react-router-dom"
import { v4 as uuidv4 } from "uuid"
import BCGovPrimaryButton from "../common/components/BCGovPrimaryButton/BCGovPrimaryButton"
import Card from "../common/components/Card/Card"

export const ApplicationCreate = () => {
    const redirect = useRedirect()
    const { identity } = useGetIdentity()
    const [create] = useCreate()
    const [loading, setLoading] = useState(false)
    const { total, isLoading } = useGetList("applications", {
        pagination: { page: 1, perPage: 1 },
        filter: { status: ["Draft", "New", "In Progress", "Completed", "Cancelled"] }
    })
    const [searchParams] = useSearchParams()

    const handleClick = async (formType) => {
        if (identity?.guid) {
            setLoading(true)
            await create(
                "applications",
                { data: { formKey: uuidv4(), guid: identity?.guid || "", formType: formType } },
                {
                    onSuccess: (data) => {
                        setLoading(false)
                        const formURL = process.env.REACT_APP_DRAFT_URL + data.submission_id + `&stream=${formType}`
                        window.open(formURL, "_blank")?.focus()
                        redirect("/", "applications")
                    },
                    onError: () => {
                        setLoading(false)
                    }
                }
            )
        }
    }

    useEffect(() => {
        if (searchParams.get("redirectType") === "firstload" && typeof total === "number" && total !== 0) {
            redirect("list", "applications")
        }
    }, [isLoading, redirect, searchParams, total])

    return (
        <Box
            minHeight="50em"
            paddingTop="6em"
            paddingBottom="3em"
            width="100%"
            display="flex"
            justifyContent="center"
            minWidth="58em"
        >
            <Card>
                <Grid container direction="column" height="100%" spacing={4}>
                    <Grid item>
                        <Grid container direction="row">
                            <Grid item xs={7}>
                                <h2>Let's get started</h2>
                                <Box paddingLeft="0.75em">
                                    <p>
                                        In order to submit an application for CEP, you will need{<br />}
                                        the following information:
                                    </p>
                                    <ul>
                                        <li>CRA business number</li>
                                        <li>WorkSafeBC number and rate</li>
                                    </ul>
                                </Box>
                            </Grid>
                            <Grid item xs={5}>
                                <Box display="flex" height="100%" justifyContent="center" alignItems="center">
                                    <img
                                        width="90em"
                                        src="/external-application.svg"
                                        alt=""
                                        style={{ transform: "translate(-1.0em, 1.0em)" }}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </Grid>
                    {loading && (
                        <Box justifyContent="center" alignSelf="center">
                            <LoadingIndicator />
                        </Box>
                    )}
                    {!loading && (
                        <>
                            <Grid item xs>
                                <Box
                                    display="flex"
                                    height="40%"
                                    justifyContent="center"
                                    alignItems="end"
                                    sx={{ flexGrow: 1 }}
                                >
                                    <Grid container direction="row" alignContent={"flex-start"}>
                                        <Grid container direction="column">
                                            <Grid item width="100%">
                                                <Box
                                                    display="flex"
                                                    justifyContent="center"
                                                    maxHeight="6em"
                                                    minHeight="6em"
                                                >
                                                    <BCGovPrimaryButton
                                                        text="Project Based Labour Market Training (PBLMT)"
                                                        onClick={() => handleClick("PBLMT")}
                                                    />
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                    <Grid container direction="row">
                                        <Grid container direction="column">
                                            <Grid item width="100%">
                                                <Box
                                                    display="flex"
                                                    justifyContent="center"
                                                    maxHeight="6em"
                                                    minHeight="6em"
                                                >
                                                    <BCGovPrimaryButton
                                                        text="Labour Market Partnerships (LMP)"
                                                        onClick={() => handleClick("LMP")}
                                                    />
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Box>
                                <Box
                                    display="flex"
                                    height="60%"
                                    justifyContent="center"
                                    alignItems="end"
                                    sx={{ flexGrow: 1 }}
                                >
                                    <Grid container direction="row" alignContent={"flex-start"}>
                                        <Grid container direction="column">
                                            <Grid item width="100%">
                                                <Box
                                                    display="flex"
                                                    justifyContent="center"
                                                    maxHeight="6em"
                                                    minHeight="6em"
                                                >
                                                    <BCGovPrimaryButton
                                                        text="Job Creation Partnerships (JCP)"
                                                        onClick={() => handleClick("JCP")}
                                                    />
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                    <Grid container direction="row">
                                        <Grid container direction="column">
                                            <Grid item width="100%">
                                                <Box
                                                    display="flex"
                                                    justifyContent="center"
                                                    maxHeight="6em"
                                                    minHeight="6em"
                                                >
                                                    <BCGovPrimaryButton
                                                        text="Research and Innovation (R&I)"
                                                        onClick={() => handleClick("RI")}
                                                    />
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Box>
                                {/* <Box
                                    display="flex"
                                    height="20%"
                                    justifyContent="center"
                                    alignItems="end"
                                    sx={{ flexGrow: 1 }}
                                >
                                    <Grid container direction="row" alignContent={"flex-start"}>
                                        <Grid container direction="column">
                                            <Grid item width="100%">
                                                <Box display="flex" justifyContent="center">
                                                    <BCGovPrimaryButton
                                                        text="PBLMT"
                                                        onClick={() => handleClick("PBLMT")}
                                                    />
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                    <Grid container direction="row">
                                        <Grid container direction="column">
                                            <Grid item width="100%">
                                                <Box display="flex" justifyContent="center">
                                                    <BCGovPrimaryButton text="LMP" onClick={() => handleClick("LMP")} />
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Box> */}
                                {/* <Box
                                    display="flex"
                                    height="100%"
                                    justifyContent="center"
                                    alignItems="end"
                                    sx={{ flexGrow: 1 }}
                                >
                                    <Grid container direction="row">
                                        <Grid item width="100%">
                                            <Box display="flex" justifyContent="center">
                                                <BCGovPrimaryButton text="JCP" onClick={() => handleClick("JCP")} />
                                            </Box>
                                        </Grid>
                                    </Grid>
                                    <Grid container direction="row">
                                        <Grid item width="100%">
                                            <Box display="flex" justifyContent="center">
                                                <BCGovPrimaryButton text="R&I" onClick={() => handleClick("RI")} />
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Box> */}
                            </Grid>
                        </>
                    )}
                </Grid>
            </Card>
        </Box>
    )
}
