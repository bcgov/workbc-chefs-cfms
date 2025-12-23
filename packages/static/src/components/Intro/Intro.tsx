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
            <h1>WorkBC CEP Intake</h1>
            <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
                ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
                fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
                deserunt mollit anim id est laborum.
            </p>
            <ModalButton text="Find out more" showIcon onClick={openModal} ariaHasPopup="dialog" />
            <BCGovModal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                contentLabel="More information about the WorkBC CEP Intake"
            >
                <h2>Community Partnership Benefits</h2>
                <Box paddingLeft="1em">
                    <p>CEP offers the community:</p>
                    <ul>
                        <li>Advantage A</li>
                        <li>Advantage B</li>
                        <li>Advantage C</li>
                        <li>Advantage D</li>
                    </ul>
                    <p>CEP offers job-seekers:</p>
                    <ul>
                        <li>Advantage E</li>
                        <li>Advantage F</li>
                        <li>Advantage G</li>
                    </ul>
                </Box>
            </BCGovModal>
        </div>
    )
}

export default Intro
