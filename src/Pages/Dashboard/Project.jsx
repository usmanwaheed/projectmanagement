import PropTypes from 'prop-types';
import AddIcon from '@mui/icons-material/Add';
import Template from "../ProjectTabs/Template";
import Complete from "../ProjectTabs/Complete";
import TableActive from "../ProjectTabs/TableActive";
import Request from "../ProjectTabs/Request";
import style from "./DashboardScss/project.module.scss"
import TextDialog from '../ProjectTabs/TextDialog';


import { useState } from "react";
import { RouteNames } from "../../Constants/route";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Box, IconButton, Stack, Tab, Tabs } from "@mui/material";
import { useAuth } from '../../context/AuthProvider';


const CustomTabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simpleTabPanel-${index}`}
            aria-labelledby={`simpleTabPanel-${index}`}
            {...other}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    )
}


const allyProps = (index) => {
    return {
        id: `simpleTab-${index}`,
        'aria-controls': `simpleTab-${index}`
    }
}


export default function Project() {
    const { theme, mode } = useAuth();
    const themeTab = mode === 'light' ? '#36454F' : theme.palette.text.primary;
    const [activeTab, setActiveTab] = useState(0)
    const location = useLocation('')
    const isAddProductPage = location.pathname.includes(`${RouteNames.ADDPRODUCTS}`)

    const handleChangeTab = (event, newValue) => {
        setActiveTab(newValue)
    }

    // This is for the Dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const handleClickOpen = () => {
        setDialogOpen(true);
    };
    const handleCloseTab = () => {
        setDialogOpen(false);
    };


    return (
        <Box>
            {!isAddProductPage && (
                <>
                    <Stack flexDirection="row" width="100%" alignItems="center" justifyContent="space-between" flex>
                        <Link onClick={handleClickOpen}>
                            <IconButton><AddIcon /></IconButton>
                        </Link>

                        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                            <Tabs
                                onChange={handleChangeTab}
                                aria-label="user details tabs"
                                value={activeTab}
                                TabIndicatorProps={{ sx: { display: 'none' } }}
                                sx={{ backgroundColor: theme.palette.background.default }}
                                className={style.Tabs}>
                                <Tab
                                    {...allyProps(0)}
                                    label="Active"
                                    sx={(theme) => ({
                                        backgroundColor: activeTab === 0 ? theme.palette.background.paper : 'transparent',
                                        color: activeTab === 0 ? `${themeTab} !important` : 'grey',
                                        fontWeight: activeTab === 0 ? '600' : '500',
                                        '&.Mui-selected': {
                                            color: theme.palette.grey.darkGrey,
                                        },
                                    })}
                                    className={style.Tab} />


                                <Tab
                                    {...allyProps(0)}
                                    label="Request"
                                    sx={(theme) => ({
                                        backgroundColor: activeTab === 1 ? theme.palette.background.paper : 'transparent',
                                        color: activeTab === 1 ? `${themeTab} !important` : 'grey',
                                        fontWeight: activeTab === 1 ? '600' : '500',
                                        '&.Mui-selected': {
                                            color: theme.palette.grey.darkGrey,
                                        },
                                    })}
                                    className={style.Tab} />


                                <Tab
                                    {...allyProps(2)}
                                    label="Complete"
                                    sx={(theme) => ({
                                        backgroundColor: activeTab === 2 ? theme.palette.background.paper : 'transparent',
                                        color: activeTab === 2 ? `${themeTab} !important` : 'grey',
                                        fontWeight: activeTab === 2 ? '600' : '500',
                                        '&.Mui-selected': {
                                            color: theme.palette.grey.darkGrey,
                                        },
                                    })}
                                    className={style.Tab} />


                                <Tab
                                    {...allyProps(3)}
                                    label="Template"
                                    sx={(theme) => ({
                                        backgroundColor: activeTab === 3 ? theme.palette.background.paper : 'transparent',
                                        color: activeTab === 3 ? `${themeTab} !important` : 'grey',
                                        fontWeight: activeTab === 3 ? '600' : '500',
                                        '&.Mui-selected': {
                                            color: theme.palette.grey.darkGrey,
                                        },
                                    })}
                                    className={style.Tab} />
                            </Tabs>
                        </Box>
                    </Stack>


                    <Box>
                        <CustomTabPanel value={activeTab} index={0}>
                            <TableActive />
                        </CustomTabPanel>

                        <CustomTabPanel value={activeTab} index={1}>
                            <Request />
                        </CustomTabPanel>

                        <CustomTabPanel value={activeTab} index={2}>
                            <Complete />
                        </CustomTabPanel>

                        <CustomTabPanel value={activeTab} index={3}>
                            <Template />
                        </CustomTabPanel>
                    </Box>
                    <TextDialog open={dialogOpen} handleClose={handleCloseTab} />
                </>
            )}
            <Outlet />
        </Box >
    )
}



CustomTabPanel.propTypes = {
    children: PropTypes.node.isRequired,
    value: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
};
