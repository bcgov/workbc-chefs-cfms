import Box from "@mui/material/Box"
import React, { useCallback } from "react"
import BCGovModal from "../common/BCGovModal/BCGovModal"
import ModalButton from "../common/BCGovModalButton/BCGovModalButton"
import "./Intro.css"

const Intro = () => {
    const [modalIsOpen, setIsOpen] = React.useState(false)

    const openModal = useCallback(() => {
        setIsOpen(true)
    }, [])

    const closeModal = useCallback(() => {
        setIsOpen(false)
    }, [])

    return (
        <div className="intro">
            <h1>Community and Employer Partnerships</h1>
            <p>
                Community and Employer Partnerships (CEP) is a part of ELMSD’s WorkBC Employment service system,
                supporting projects across BC that deliver employment and skills training services and initiatives that
                strengthen local labour markets. The program includes four funding streams that support a wide variety
                of activities ranging from labour market plan development to targeted skills training and work
                experience.
            </p>
            <ModalButton
                text="Find out more"
                showIcon
                onClick={() => {
                    window.open(
                        "https://www.workbc.ca/employers-industry/funding-programs/community-and-employer-partnerships",
                        "_blank"
                    )
                }}
                ariaHasPopup="dialog"
            />
        </div>
    )
}

export default Intro
