import React from 'react';
import styles from './page.module.scss';
import logoimage from '../../assets/Hide-sidebar.svg';
import { RouteNames } from '../../Constants/route';
import { drawerWidth } from '../../Constants/app';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';

import DashboardIcon from '../../assets/dashboard.svg';
import ProjectsIcon from '../../assets/Project.svg';
import MessagesIcon from '../../assets/Message.png';

import DashboardIconWhite from '../../assets/Dashboard active.svg';
import ProjectsIconWhite from '../../assets/Project active.svg';
import MessagesIconWhite from '../../assets/Message active.svg';

import { useAuth } from '../../context/AuthProvider'; // <-- Added

const Sidebar = () => {
    const { theme, mode } = useAuth(); // <-- Added
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;
    const pages = [
        { name: 'Dashboard', path: `/${RouteNames.ADMINDASHBOARD}`, Icon: DashboardIcon, ActiveIcon: DashboardIconWhite },
        { name: 'Customer Managment', path: `/${RouteNames.CUSTOMERMANAGMENT}`, Icon: DashboardIcon, ActiveIcon: DashboardIconWhite },
        { name: 'Notification & Messages', path: `/${RouteNames.NOTIFICATIONorMESSAGES}`, Icon: DashboardIcon, ActiveIcon: DashboardIconWhite },
        { name: 'Plan Managment', path: `/${RouteNames.PLANMANAGMENT}`, Icon: DashboardIcon, ActiveIcon: DashboardIconWhite },
        { name: 'Transition & Billing', path: `/${RouteNames.TRANSITIONorBILLING}`, Icon: DashboardIcon, ActiveIcon: DashboardIconWhite },
        // { name: 'Overview', path: `/${RouteNames.ADMINPAGE1}`, Icon: DashboardIcon, ActiveIcon: DashboardIconWhite },
        // { name: 'Plans', path: `/${RouteNames.ADMINPLANS}`, Icon: ProjectsIcon, ActiveIcon: ProjectsIconWhite },
        // { name: 'Plan Request', path: `/${RouteNames.PLANREQUEST}`, Icon: ProjectsIcon, ActiveIcon: ProjectsIconWhite },
        // { name: 'AdminPage3', path: `/${RouteNames.ADMINPAGE3}`, Icon: MessagesIcon, ActiveIcon: MessagesIconWhite },
    ];

    const handleClick = (path) => {
        navigate(path);
    };

    return (
        <Drawer
            variant="permanent"
            open
            sx={{
                // width: drawerWidth,
                width: "270px",
                display: { xs: 'none', sm: 'block' },
                '& .MuiDrawer-paper': {
                    // width: drawerWidth,
                    width: "270px",
                    alignItems: 'center',
                    overflow: 'hidden',
                },
            }}
        >
            <Box
                className={styles.sidebar}
                style={{
                    '--sidebar-background': mode === 'light' ? theme.palette.background.paper : theme.palette.background.default,
                    '--text-primary': mode === 'light' ? theme.palette.text.primary : theme.palette.text.primary,
                    '--hover-color': mode === 'light' ? 'rgba(128, 128, 128, 0.2)' : 'rgba(149, 149, 149, 0.1)',
                    '--active-background': mode === 'light' ? 'rgb(0, 0, 0)' : 'rgba(226, 223, 210, 0.3)',
                    '--active-text': mode === 'light' ? 'rgb(255, 255, 255)' : theme.palette.text.primary,
                    '--logo-brightness': mode === 'light' ? '1' : '0.8',
                    '--icon-brightness': mode === 'light' ? '1' : '1',
                }}
            >
                <Box className={styles.upperRow}>
                    <Box className={styles.logo}>
                        <img className={styles.image} src={logoimage} alt="image" />
                    </Box>

                    <List className={styles.list}>
                        {pages.map(({ name, Icon, ActiveIcon, path }) => (
                            <React.Fragment key={name}>
                                <ListItem
                                    disablePadding
                                    className={`${styles.listItem} 
                                        ${(name === 'AdminPage1' && currentPath.includes(RouteNames.ADDPRODUCTS)) || currentPath === path ? styles.activeItem : ''}`
                                    }
                                >
                                    <ListItemButton onClick={() => handleClick(path)} className={styles.listItemBtn}>
                                        <ListItemIcon className={styles.listItemIcon}>
                                            <img
                                                src={(name === 'AdminPage1' && currentPath.includes(RouteNames.ADDPRODUCTS)) || currentPath === path ? ActiveIcon : Icon}
                                                alt={name}
                                                className={`${styles.icon} ${currentPath === path ? styles.activeIcon : ''}`}
                                            />
                                        </ListItemIcon>
                                        <ListItemText primary={name} className={styles.listItemText} />
                                    </ListItemButton>
                                </ListItem>
                            </React.Fragment>
                        ))}
                    </List>
                </Box>
            </Box>
        </Drawer>
    );
};

export default Sidebar;
