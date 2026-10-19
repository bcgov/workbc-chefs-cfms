import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import BCGovPrimaryButton from "../common/BCGovPrimaryButton/BCGovPrimaryButton"
import Card from "../common/Card/Card"

const ServiceProviderCard = () => (
    <Card>
        <Grid container direction="column" height="100%">
            <Grid item>
                <Grid container direction="row">
                    <Grid item xs={8}>
                        <h2>Are you a CEP administrator?</h2>
                        <Box paddingLeft="0.75em">
                            <p>If you are a CEP administrator, log in here</p>
                        </Box>
                    </Grid>
                    <Grid item xs={4}>
                        <Box display="flex" justifyContent="center">
                            <img
                                width="170em"
                                src="/admin-1.svg"
                                alt=""
                                //style={{ transform: "translate(-2.0em, 0.0em)" }}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Grid>
            <Grid item xs>
                <Box display="flex" height="100%" justifyContent="center" alignItems="end" sx={{ flexGrow: 1 }}>
                    <BCGovPrimaryButton text="Administrator Login" onClick={() => {}} />
                </Box>
            </Grid>
        </Grid>
    </Card>
)

export default ServiceProviderCard
