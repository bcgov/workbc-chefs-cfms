import Box from "@mui/material/Box"
import ExternalCard from "../../components/ExternalCard/ExternalCard"
import Intro from "../../components/Intro/Intro"
import CardContainer from "../../components/common/CardContainer/CardContainer"

const Home = () => (
    <Box padding="0em 8em">
        <Intro />
        <CardContainer>
            <ExternalCard />
        </CardContainer>
    </Box>
)

export default Home
