import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { axiosInstance } from '../api/axiosInstance';
import { darkTheme, lightTheme } from '../Theme/Theme';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Auth state management
    const [accessToken, setAccessToken] = useState(() => {
        return localStorage.getItem('userToken') || localStorage.getItem('accessAdminToken');
    });
    const isAdmin = useMemo(() => !!localStorage.getItem('accessAdminToken'), [accessToken]);

    // Theme management
    const [mode, setMode] = useState(() => {
        return localStorage.getItem("Theme") || 'light';
    });
    const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);
    const getRefreshToken = localStorage.getItem('userRefreshToken');
    // WebSocket reference for Electron integration
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const [wsConnected, setWsConnected] = useState(false);
    const heartbeatIntervalRef = useRef(null);
    const [electronStatus, setElectronStatus] = useState({
        connected: false,
        authenticated: false,
        screenshotEnabled: false,
        lastScreenshot: null,
        error: null
    });

    // Current timer status
    const [currentTimerStatus, setCurrentTimerStatus] = useState({
        isRunning: false,
        isCheckedOut: true,
        checkIn: null,
        projectId: null,
        canTakeScreenshot: false
    });

    // Theme effects 
    useEffect(() => {
        localStorage.setItem('Theme', mode);
        document.body.setAttribute('data-theme', mode);
    }, [mode]);

    const toggleTheme = useCallback(() => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    }, []);

    // Get cookies utility function
    const getCookies = useCallback(() => {
        const cookies = {};
        document.cookie.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name && value) {
                cookies[name] = decodeURIComponent(value);
            }
        });
        return cookies;
    }, []);

    // Send authentication data to Electron
    const sendAuthToElectron = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const cookies = getCookies();
            const hasRefreshToken = cookies.refreshToken || cookies.accessToken;

            if (hasRefreshToken) {
                wsRef.current.send(JSON.stringify({
                    type: 'AUTH_COOKIES',
                    cookies: cookies
                }));
            } else if (accessToken) {
                // Send just the token string
                wsRef.current.send(JSON.stringify({
                    type: 'AUTH_TOKEN',
                    // token: getRefreshToken // Just the token string
                    token: accessToken // Just the token string
                }));
            } else {
                console.warn('No authentication credentials available for Electron');
            }
        }
    }, [accessToken, getCookies]);

    // Get current timer status from backend
    const getCurrentTimerStatus = useCallback(async () => {
        if (!accessToken) return null;

        try {
            const response = await axiosInstance.get('/screenshot/can-capture');
            const statusData = response.data.data;

            const timerStatus = {
                isRunning: statusData.isTimerActive || false,
                isCheckedOut: !statusData.canTakeScreenshot,
                checkIn: statusData.checkInTime || null,
                projectId: statusData.currentProject?.id || null,
                canTakeScreenshot: statusData.canTakeScreenshot || false,
                currentProject: statusData.currentProject || null
            };

            setCurrentTimerStatus(timerStatus);
            return timerStatus;
        } catch (error) {
            console.error('Failed to get timer status:', error);

            // If token is invalid, clear it
            if (error.response?.status === 401) {
                setAccessToken(null);
                localStorage.removeItem(isAdmin ? 'accessAdminToken' : 'userToken');
            }
            return null;
        }
    }, [accessToken, isAdmin]);

    // WebSocket setup function
    const setupWebSocket = useCallback(() => {
        // Check if we're in an Electron environment
        const isElectron = window.location.protocol === 'file:' ||
            window.location.hostname === 'localhost' ||
            window.navigator.userAgent.indexOf('Electron') !== -1;

        if (!isElectron) {
            return;
        }

        // Close existing connection if any
        if (wsRef.current) {
            wsRef.current.close(1000, 'Reconnecting');
        }

        try {
            wsRef.current = new WebSocket("ws://localhost:3001");

            wsRef.current.onopen = () => {
                setWsConnected(true);
                setElectronStatus(prev => ({ ...prev, connected: true, error: null }));
                reconnectAttempts.current = 0;

                // Send authentication data
                sendAuthToElectron();

                // Start heartbeat
                startHeartbeat();
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    switch (data.type) {
                        case 'AUTH_ACK':
                            setElectronStatus(prev => ({
                                ...prev,
                                authenticated: true,
                                error: null
                            }));

                            // Update token if a new one was provided
                            if (data.payload.token) {
                                setAccessToken(data.payload.token);
                                localStorage.setItem(
                                    isAdmin ? 'accessAdminToken' : 'userToken',
                                    data.payload.token
                                );
                            }

                            // Request initial timer status
                            wsRef.current.send(JSON.stringify({ type: 'REQUEST_STATUS' }));
                            break;

                        case 'AUTH_ERROR':
                            console.error('Authentication error from Electron:', data.payload);
                            setElectronStatus(prev => ({
                                ...prev,
                                authenticated: false,
                                error: data.payload.error
                            }));
                            break;

                        case 'TIMER_STATUS_UPDATE':
                            setCurrentTimerStatus(data.payload);
                            setElectronStatus(prev => ({
                                ...prev,
                                screenshotEnabled: data.payload.canTakeScreenshot
                            }));
                            break;

                        case 'TIMER_STATUS_RESPONSE':
                            setCurrentTimerStatus(data.payload);
                            setElectronStatus(prev => ({
                                ...prev,
                                screenshotEnabled: data.payload.canTakeScreenshot
                            }));
                            break;

                        case 'SCREENSHOT_TAKEN':
                            setElectronStatus(prev => ({
                                ...prev,
                                lastScreenshot: data.payload.timestamp
                            }));
                            break;

                        case 'SCREENSHOT_ERROR':
                            console.error('Screenshot error from Electron:', data.payload);
                            setElectronStatus(prev => ({
                                ...prev,
                                error: `Screenshot error: ${data.payload.error}`
                            }));
                            break;

                        case 'PONG':
                            // Handle pong response silently
                            break;

                        default:
                            console.log('Unknown message type from Electron:', data.type);
                    }
                } catch (error) {
                    console.log('Non-JSON message from Electron:', event.data);
                }
            };

            wsRef.current.onerror = (error) => {
                console.error("WebSocket Error:", error);
                setWsConnected(false);
                setElectronStatus(prev => ({
                    ...prev,
                    connected: false,
                    error: 'WebSocket connection error'
                }));
                stopHeartbeat();
            };

            wsRef.current.onclose = (event) => {
                setWsConnected(false);
                setElectronStatus(prev => ({
                    ...prev,
                    connected: false,
                    authenticated: false
                }));
                stopHeartbeat();

                // Attempt to reconnect if it wasn't a manual close
                if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttempts.current++;
                        setupWebSocket();
                    }, delay);
                }
            };

        } catch (error) {
            console.error('Failed to setup WebSocket:', error);
            setWsConnected(false);
            setElectronStatus(prev => ({
                ...prev,
                connected: false,
                error: 'Failed to setup WebSocket'
            }));
        }
    }, [sendAuthToElectron]);

    // Heartbeat to keep connection alive
    const startHeartbeat = useCallback(() => {
        stopHeartbeat(); // Clear any existing heartbeat

        heartbeatIntervalRef.current = setInterval(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                try {
                    wsRef.current.send(JSON.stringify({ type: 'PING' }));
                } catch (error) {
                    console.error('Failed to send heartbeat:', error);
                }
            }
        }, 25000); // Send ping every 25 seconds
    }, []);

    const stopHeartbeat = useCallback(() => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
        }
    }, []);

    // WebSocket management for Electron
    useEffect(() => {
        setupWebSocket();

        return () => {
            stopHeartbeat();
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close(1000, 'Component unmounting');
            }
        };
    }, [setupWebSocket, stopHeartbeat]);

    // Send timer status updates to Electron when timer status changes
    useEffect(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && electronStatus.authenticated) {
            wsRef.current.send(JSON.stringify({
                type: 'TIMER_STATUS',
                payload: currentTimerStatus
            }));
        }
    }, [currentTimerStatus, electronStatus.authenticated]);

    // Cleanup on token change
    useEffect(() => {
        if (!accessToken) {
            setWsConnected(false);
            setCurrentTimerStatus({
                isRunning: false,
                isCheckedOut: true,
                checkIn: null,
                projectId: null,
                canTakeScreenshot: false
            });
            setElectronStatus({
                connected: false,
                authenticated: false,
                screenshotEnabled: false,
                lastScreenshot: null,
                error: null
            });
        } else {
            // Re-authenticate with Electron when token changes
            if (wsConnected) {
                sendAuthToElectron();
            }
        }
    }, [accessToken, wsConnected, sendAuthToElectron]);

    // User data query
    const { data: user, isLoading, error } = useQuery({
        queryKey: ["user", accessToken],
        queryFn: async () => {
            try {
                const endpoint = isAdmin ? '/admin/get-admin-data' : '/user/get-user-data';
                const response = await axiosInstance.get(endpoint, {
                    withCredentials: true
                });
                return response.data.data;
            } catch (error) {
                console.error('AuthProvider data error:', error);
                // Clear invalid token
                setAccessToken(null);
                localStorage.removeItem(isAdmin ? 'accessAdminToken' : 'userToken');
                return null;
            }
        },
        retry: 1,
        staleTime: 5 * 60 * 1000,
        enabled: !!accessToken,
    });

    // Expose method to manually update timer status
    const updateTimerStatus = useCallback(async (newStatus) => {
        if (newStatus) {
            setCurrentTimerStatus(newStatus);
        } else {
            // Fetch current status from backend
            await getCurrentTimerStatus();
        }
    }, [getCurrentTimerStatus]);

    // Method to request timer status from Electron
    const requestElectronTimerStatus = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'REQUEST_STATUS' }));
        }
    }, []);

    // Context value
    const contextValue = useMemo(() => ({
        user,
        accessToken,
        isLoading,
        isAdmin,
        mode,
        toggleTheme,
        theme,
        setAccessToken,
        // WebSocket utilities
        wsConnected,
        electronStatus,
        reconnectWebSocket: setupWebSocket,
        requestElectronTimerStatus,
        // Timer status utilities
        currentTimerStatus,
        getCurrentTimerStatus,
        updateTimerStatus
    }), [
        user,
        accessToken,
        isLoading,
        isAdmin,
        mode,
        toggleTheme,
        theme,
        wsConnected,
        electronStatus,
        setupWebSocket,
        requestElectronTimerStatus,
        currentTimerStatus,
        getCurrentTimerStatus,
        updateTimerStatus
    ]);

    return (
        <AuthContext.Provider value={contextValue}>
            <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};