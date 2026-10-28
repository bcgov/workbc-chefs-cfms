import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import React, { useCallback } from "react"
import BCGovModal from "../common/BCGovModal/BCGovModal"
import ModalButton from "../common/BCGovModalButton/BCGovModalButton"
import BCGovPrimaryButton from "../common/BCGovPrimaryButton/BCGovPrimaryButton"
import Card from "../common/Card/Card"

const EmployerCard = () => {
    const [isOpen, setIsOpen] = React.useState(false)

    const openModal = useCallback(() => {
        setIsOpen(true)
    }, [])

    const closeModal = useCallback(() => {
        setIsOpen(false)
    }, [])

    return (
        <Card>
            <Grid container direction="column" height="100%">
                <Grid item>
                    <Grid container direction="row">
                        <Grid item xs={7}>
                            <h2>Are you a CEP applicant?</h2>
                            <Box paddingLeft="0.75em">
                                <p>You will need to log in to CEP to access your applications</p>
                                <p>
                                    You can log in with either a <strong>Basic BCeID</strong> or a&nbsp;
                                    <strong>Business BCeID</strong>
                                </p>
                                <ModalButton
                                    text="More info on BCeID"
                                    showIcon
                                    onClick={openModal}
                                    ariaHasPopup="dialog"
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={5}>
                            <Box display="flex" height="100%" justifyContent="center" alignItems="center">
                                <img
                                    width="130em"
                                    src="/applicant-2.svg"
                                    alt=""
                                    //style={{ transform: "translate(0.0em, -0.75em)" }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs>
                    <Box display="flex" height="100%" justifyContent="center" alignItems="end" sx={{ flexGrow: 1 }}>
                        <BCGovPrimaryButton
                            text="CEP Applicant Login"
                            onClick={() => window.open(import.meta.env.VITE_APPLICANT_URL, "_self")}
                        />
                    </Box>
                </Grid>
            </Grid>
            <BCGovModal isOpen={isOpen} onRequestClose={closeModal} contentLabel="More information about BCeIDs">
                <h2>BCeID Options</h2>
                <h3>Business BCeID</h3>
                <p>
                    Note that if you are starting a new Business BCeID registration, it can take some time to verify
                    your business if it is not already registered with&nbsp;
                    <a href="https://www2.gov.bc.ca/gov/content/governments/organizational-structure/ministries-organizations/ministries/citizens-services/bc-registries-online-services">
                        BC Registries and Online Services
                    </a>
                    .
                </p>
                <p>
                    Note also that you can <strong>convert</strong> a <strong>Basic BCeID</strong> to a
                    <strong> Business BCeID.</strong> If time is an issue and you don&apos;t already have a Business
                    BCeID, set up a Basic BCeID now and convert it later.
                </p>
                <p>
                    If your organization already has a Business BCeID account, talk to your account administrator to
                    ensure you have a user account under the organization&apos;s overall account. Once you have this
                    user account set up, use this to log in to CEP.
                </p>
                <h3>Basic BCeID</h3>
                <p>
                    With a&nbsp;
                    <a href="https://www.bceid.ca/register/basic/account_details.aspx?type=regular&eServiceType=basic">
                        Basic BCeID
                    </a>
                    , you will be able to log in to CEP to submit and view your own applications.
                </p>
                <p>
                    For <a href="https://www.bceid.ca/">more information</a> and&nbsp;
                    <a href="https://www.bceid.ca/aboutbceid/faqs.aspx">Frequently Asked Questions</a>, visit&nbsp;
                    <a href="https://www.bceid.ca/">www.bceid.ca</a>
                </p>
            </BCGovModal>
        </Card>
    )
}

export default EmployerCard
