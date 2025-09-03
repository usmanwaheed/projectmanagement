import PropTypes from 'prop-types';
import style from "./style.module.scss"
import { Link, Outlet, useLocation, useParams } from "react-router-dom";
import { useAuth } from '../../../context/AuthProvider';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import SouthWestIcon from '@mui/icons-material/SouthWest';
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import SyncIcon from '@mui/icons-material/Sync';
import CheckIcon from '@mui/icons-material/Check';
import OverView from "./Overview"
import Teams from "./Teams"
import Assign from "./Assign"
import Videos from "./Videos"
import Time from "./Time"
import Files from "./Files"
import Controls from "./Controls"
import {
    Button, Tab, Tabs,
    IconButton, Stack,
    Typography, Box, Tooltip,
    CircularProgress,
    Badge,
    Chip,
    Alert
} from "@mui/material";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { toast } from 'react-toastify';
import { userTimeProject } from '../../../api/userTracker';
import { useQuery } from '@tanstack/react-query';
import { RouteNames } from '../../../Constants/route';
import { useOptimizedTimeTracker, TIMER_STATES } from '../../../api/userTracker';
import { useState, useEffect, useMemo } from 'react';

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

CustomTabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

const allyProps = (index) => {
    return {
        id: `simpleTab-${index}`,
        'aria-controls': `simpleTab-${index}`
    }
}

export default function AddProjects() {
    const { theme, mode, accessToken } = useAuth();
    const themeTab = mode === 'light' ? '#36454F' : theme.palette.text.primary;
    const { id: ProjectId } = useParams();
    const location = useLocation('');
    const subDetailsPageVar = location.pathname.includes(`${RouteNames.SUBDETAILSPAGE}`);
    const [activeTab, setActiveTab] = useState(0);

    // Optimized timer hook
    const {
        elapsedTime,
        timerState,
        isRunning,
        isPaused,
        isCheckedOut,
        isIdle,
        formattedTime,
        checkIn,
        pauseOrResume,
        checkOut,
        isCheckingIn,
        isPausingOrResuming,
        isCheckingOut,
        connectionStatus,
        syncWithServer,
        lastServerSync,
        formatTime,
        debugInfo // For development debugging
    } = useOptimizedTimeTracker(ProjectId);

    // User time details query with longer cache time to avoid conflicts
    const { data: userInfo, isLoading: userInfoLoading, refetch: refetchUserInfo } = useQuery({
        queryKey: ['userInfo', ProjectId],
        queryFn: () => userTimeProject(ProjectId),
        enabled: !!accessToken && !!ProjectId,
        staleTime: 300000, // 5 minutes
        refetchInterval: false, // Disable auto-refetch to avoid conflicts
        refetchOnWindowFocus: false,
    });

    // Refetch user info when timer state changes to checked out
    useEffect(() => {
        if (isCheckedOut) {
            setTimeout(() => {
                refetchUserInfo();
            }, 2000); // Give server time to process
        }
    }, [isCheckedOut, refetchUserInfo]);

    // Handle tab changes
    const handleChangeTab = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Enhanced timer state display
    const getTimerStateChip = () => {
        const stateConfig = {
            [TIMER_STATES.IDLE]: {
                label: 'Ready',
                color: 'default'
            },
            [TIMER_STATES.RUNNING]: {
                label: 'Running',
                color: 'success',
                icon: <PlayArrowRoundedIcon fontSize="small" />
            },
            [TIMER_STATES.PAUSED]: {
                label: 'Paused',
                color: 'warning',
                icon: <PauseIcon fontSize="small" />
            },
            [TIMER_STATES.CHECKED_OUT]: {
                label: 'Completed',
                color: 'info',
                icon: <CheckIcon fontSize="small" />
            }
        };

        const config = stateConfig[timerState] || stateConfig[TIMER_STATES.IDLE];

        return (
            <Chip
                size="small"
                label={config.label}
                color={config.color}
                icon={config.icon}
                variant={isRunning ? "filled" : "outlined"}
                sx={{
                    ml: 1,
                    minWidth: '80px',
                    '& .MuiChip-label': { fontSize: '0.75rem' }
                }}
            />
        );
    };

    // Connection status display
    const getConnectionStatusColor = () => {
        switch (connectionStatus) {
            case 'connected':
                return 'success.main';
            case 'error':
                return 'error.main';
            case 'stale':
                return 'warning.main';
            default:
                return 'grey.500';
        }
    };

    const getConnectionStatusTooltip = () => {
        const tooltips = {
            'connected': 'Connected to server',
            'error': 'Connection error - click to retry',
            'stale': 'Connection stale - syncing...',
            'connecting': 'Connecting...'
        };

        const baseTooltip = tooltips[connectionStatus] || tooltips.connecting;

        if (lastServerSync && connectionStatus === 'connected') {
            const secondsAgo = Math.floor((Date.now() - lastServerSync) / 1000);
            return `${baseTooltip} (${secondsAgo}s ago)`;
        }

        return baseTooltip;
    };

    // Improved timer display with better error handling
    const TimerDisplay = () => (
        <Stack direction="row" spacing={1} alignItems="center">
            <Typography
                variant="h6"
                sx={{
                    color: theme.palette.text.primary,
                    fontWeight: isRunning ? 600 : 500,
                    fontFamily: 'monospace',
                    transition: 'all 0.2s ease',
                    minWidth: '100px',
                    textAlign: 'center',
                    fontSize: isRunning ? '1.25rem' : '1.1rem'
                }}
            >
                {formattedTime}
            </Typography>
            {getTimerStateChip()}
        </Stack>
    );

    // Enhanced connection status with better indicators
    const ConnectionStatus = () => (
        <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title={getConnectionStatusTooltip()} arrow>
                <Badge
                    variant="dot"
                    color="primary"
                    overlap="circular"
                    sx={{
                        '& .MuiBadge-badge': {
                            backgroundColor: getConnectionStatusColor(),
                            color: getConnectionStatusColor(),
                            boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                            animation: connectionStatus === 'connecting' || connectionStatus === 'stale'
                                ? 'pulse 2s infinite' : 'none',
                        },
                        '@keyframes pulse': {
                            '0%': {
                                transform: 'scale(0.95)',
                                boxShadow: `0 0 0 0 ${getConnectionStatusColor()}40`,
                            },
                            '70%': {
                                transform: 'scale(1)',
                                boxShadow: `0 0 0 10px ${getConnectionStatusColor()}00`,
                            },
                            '100%': {
                                transform: 'scale(0.95)',
                                boxShadow: `0 0 0 0 ${getConnectionStatusColor()}00`,
                            },
                        },
                    }}
                    onClick={() => connectionStatus === 'error' && syncWithServer()}
                    style={{ cursor: connectionStatus === 'error' ? 'pointer' : 'default' }}
                >
                    <Box sx={{ width: 12, height: 12 }} />
                </Badge>
            </Tooltip>

            {(connectionStatus === 'error' || connectionStatus === 'stale') && (
                <Tooltip title="Retry connection">
                    <IconButton
                        size="small"
                        onClick={syncWithServer}
                        sx={{
                            color: theme.palette.text.secondary,
                            '&:hover': { color: theme.palette.primary.main }
                        }}
                    >
                        <SyncIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
        </Stack>
    );

    // Improved button styles
    const hoverStyles = mode === "light" ? {
        backgroundColor: "rgba(52, 52, 52, 0.1) !important",
        color: "#343434",
        boxShadow: 0,
        transform: 'translateY(-1px)'
    } : {
        backgroundColor: "rgba(250, 249, 246, 0.1) !important",
        border: "1px solid transparent",
        color: "#FAF9F6 !important",
        transform: 'translateY(-1px)'
    };

    const trackerBtnsStyles = mode === 'light' ? {
        backgroundColor: "#343434 !important",
        color: "#FAF9F6",
        boxShadow: 0,
        transition: 'all 0.2s ease'
    } : {
        backgroundColor: "#FAF9F6 !important",
        color: "#343434",
        border: "#FAF9F6",
        transition: 'all 0.2s ease'
    };

    // Enhanced timer controls with better state management
    const renderTimerControls = () => {
        // Show loading state while fetching initial data
        if (userInfoLoading && !lastServerSync) {
            return (
                <Stack direction="row" spacing={2} alignItems="center">
                    <CircularProgress size={24} />
                    <Typography variant="body2" color="text.secondary">
                        Loading...
                    </Typography>
                </Stack>
            );
        }

        // Check-in button - show when idle
        if (isIdle) {
            return (
                <Button
                    variant="contained"
                    onClick={checkIn}
                    disabled={isCheckingIn}
                    sx={{
                        ...trackerBtnsStyles,
                        '&:hover': hoverStyles,
                        minWidth: '120px',
                        height: '40px'
                    }}
                >
                    {isCheckingIn ? (
                        <CircularProgress size={20} color="inherit" />
                    ) : (
                        <>
                            <PlayArrowRoundedIcon sx={{ mr: 1 }} />
                            Check In
                        </>
                    )}
                </Button>
            );
        }

        // Timer controls - show when running or paused
        if (isRunning || isPaused) {
            return (
                <Stack direction="row" spacing={2} alignItems="center">
                    <Button
                        variant="contained"
                        onClick={pauseOrResume}
                        disabled={isPausingOrResuming}
                        sx={{
                            ...trackerBtnsStyles,
                            '&:hover': hoverStyles,
                            minWidth: '120px',
                            height: '40px'
                        }}
                    >
                        {isPausingOrResuming ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : isRunning ? (
                            <>
                                <PauseIcon sx={{ mr: 1 }} />
                                Pause
                            </>
                        ) : (
                            <>
                                <PlayArrowRoundedIcon sx={{ mr: 1 }} />
                                Resume
                            </>
                        )}
                    </Button>

                    <Button
                        variant="contained"
                        onClick={checkOut}
                        disabled={isCheckingOut || isPaused} // Disable checkout while paused
                        sx={{
                            ...trackerBtnsStyles,
                            '&:hover': hoverStyles,
                            minWidth: '120px',
                            height: '40px',
                            opacity: isPaused ? 0.6 : 1
                        }}
                    >
                        {isCheckingOut ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            <>
                                <CheckIcon sx={{ mr: 1 }} />
                                Check Out
                            </>
                        )}
                    </Button>
                </Stack>
            );
        }

        // Checked out state
        if (isCheckedOut) {
            return (
                <Stack direction="row" spacing={2} alignItems="center">
                    <Chip
                        label={`Completed: ${formattedTime}`}
                        color="success"
                        variant="filled"
                        icon={<CheckIcon />}
                        sx={{ height: '40px', fontSize: '0.9rem' }}
                    />
                </Stack>
            );
        }

        return null;
    };

    // Connection error alert
    const ConnectionErrorAlert = () => {
        if (connectionStatus !== 'error') return null;

        return (
            <Alert
                severity="warning"
                action={
                    <Button
                        color="inherit"
                        size="small"
                        onClick={syncWithServer}
                    >
                        Retry
                    </Button>
                }
                sx={{ mb: 2 }}
            >
                Connection lost. Timer continues locally. Click retry to sync.
            </Alert>
        );
    };

    // Debug info (remove in production)
    const DebugInfo = () => {
        if (process.env.NODE_ENV !== 'development') return null;

        return (
            <Box sx={{ position: 'fixed', bottom: 10, right: 10, fontSize: '0.7rem', opacity: 0.7 }}>
                <Typography variant="caption">
                    State: {timerState} | Elapsed: {elapsedTime}s |
                    CheckIn: {debugInfo.checkInTime ? new Date(debugInfo.checkInTime).toLocaleTimeString() : 'None'}
                </Typography>
            </Box>
        );
    };

    return (
        <Box>
            <ConnectionErrorAlert />

            {!subDetailsPageVar && (
                <>
                    <Stack flexDirection="row" width="100%" alignItems="center" justifyContent="center">
                        <Link className={style.goBack} to={`/project`}>
                            <IconButton disableRipple >
                                <ArrowBackIosNewIcon sx={{ color: theme.palette.text.primary }} />
                            </IconButton>
                            <Typography className={style.goBackTitle} sx={{ color: theme.palette.text.primary }}>Go Back</Typography>
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
                                    label="Overview"
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
                                    label="Docs"
                                    {...allyProps(1)}
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
                                    label="Videos"
                                    {...allyProps(2)}
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
                                    label="Team"
                                    {...allyProps(3)}
                                    sx={(theme) => ({
                                        backgroundColor: activeTab === 3 ? theme.palette.background.paper : 'transparent',
                                        color: activeTab === 3 ? `${themeTab} !important` : 'grey',
                                        fontWeight: activeTab === 3 ? '600' : '500',
                                        '&.Mui-selected': {
                                            color: theme.palette.grey.darkGrey,
                                        },
                                    })}
                                    className={style.Tab} />
                                <Tab
                                    label="Assign"
                                    {...allyProps(4)}
                                    sx={(theme) => ({
                                        backgroundColor: activeTab === 4 ? theme.palette.background.paper : 'transparent',
                                        color: activeTab === 4 ? `${themeTab} !important` : 'grey',
                                        fontWeight: activeTab === 4 ? '600' : '500',
                                        '&.Mui-selected': {
                                            color: theme.palette.grey.darkGrey,
                                        },
                                    })}
                                    className={style.Tab} />
                                <Tab
                                    label="Leaderboard"
                                    {...allyProps(5)}
                                    sx={(theme) => ({
                                        backgroundColor: activeTab === 5 ? theme.palette.background.paper : 'transparent',
                                        color: activeTab === 5 ? `${themeTab} !important` : 'grey',
                                        fontWeight: activeTab === 5 ? '600' : '500',
                                        '&.Mui-selected': {
                                            color: theme.palette.grey.darkGrey,
                                        },
                                    })}
                                    className={style.Tab} />
                            </Tabs>
                        </Box>

                        {/* Enhanced Timer Display and Controls Section */}
                        <Stack direction="row" spacing={3} alignItems="center" sx={{ mr: 2 }}>
                            <ConnectionStatus />

                            <Stack direction="column" alignItems="center" spacing={0.5}>
                                <TimerDisplay />
                                {connectionStatus === 'connected' && lastServerSync && (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ fontSize: '0.65rem' }}
                                    >
                                        Synced {Math.floor((Date.now() - lastServerSync) / 1000)}s ago
                                    </Typography>
                                )}
                            </Stack>

                            {renderTimerControls()}
                        </Stack>
                    </Stack>

                    <CustomTabPanel value={activeTab} index={0}>
                        <OverView />
                    </CustomTabPanel>
                    <CustomTabPanel value={activeTab} index={1}>
                        <Files />
                    </CustomTabPanel>
                    <CustomTabPanel value={activeTab} index={2}>
                        <Videos />
                    </CustomTabPanel>
                    <CustomTabPanel value={activeTab} index={3}>
                        <Teams />
                    </CustomTabPanel>
                    <CustomTabPanel value={activeTab} index={4}>
                        <Assign />
                    </CustomTabPanel>
                    <CustomTabPanel value={activeTab} index={5}>
                        <Time />
                    </CustomTabPanel>
                </>
            )}

            <DebugInfo />
            <Outlet />
        </Box>
    );
}