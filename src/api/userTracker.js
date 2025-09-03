import { axiosInstance } from "./axiosInstance";
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from "../context/AuthProvider";

// API Functions
export const userCheckIn = async (projectId) => {
    const { data } = await axiosInstance.post('/user/checkIn', { projectId });
    return data;
}

export const userGetElapsedTime = async (projectId) => {
    try {
        const { data } = await axiosInstance.get(`/user/getElapsedTime?projectId=${projectId}`);
        return data;
    } catch (error) {
        console.error("Error fetching elapsed time:", error);
        throw error;
    }
}

export const userPauseOrResume = async (projectId) => {
    const response = await axiosInstance.put('/user/pauseOrResume', { projectId });
    return response;
};

export const userCheckOut = async (projectId) => {
    const { data } = await axiosInstance.put('/user/checkOut', { projectId });
    return data;
}

export const userTimeProject = async (projectId) => {
    const { data } = await axiosInstance.get(`/user/getUserTimeProject?projectId=${projectId}`);
    return data;
}

export const usersTimeProject = async (projectId) => {
    const { data } = await axiosInstance.get(`/user/getUsersTimeProject?projectId=${projectId}`);
    return data;
};

// Timer States
export const TIMER_STATES = {
    IDLE: 'idle',
    RUNNING: 'running',
    PAUSED: 'paused',
    CHECKED_OUT: 'checked_out'
};

// Local storage keys for persistence
const getStorageKeys = (projectId) => ({
    timerState: `timer_state_${projectId}`,
    checkInTime: `check_in_time_${projectId}`,
    pausedDuration: `paused_duration_${projectId}`,
    lastPauseTime: `last_pause_time_${projectId}`,
    totalElapsed: `total_elapsed_${projectId}`
});

// Custom hook for optimized time tracking with persistence
export const useOptimizedTimeTracker = (projectId) => {
    const { accessToken } = useAuth();
    const queryClient = useQueryClient();

    // Storage keys
    const storageKeys = useMemo(() => getStorageKeys(projectId), [projectId]);

    // Initialize state from localStorage or defaults
    const initializeState = useCallback(() => {
        if (typeof window === 'undefined') return {
            timerState: TIMER_STATES.IDLE,
            elapsedTime: 0,
            checkInTime: null,
            pausedDuration: 0,
            lastPauseTime: null
        };

        try {
            return {
                timerState: localStorage.getItem(storageKeys.timerState) || TIMER_STATES.IDLE,
                elapsedTime: 0, // Always start with 0, will be calculated
                checkInTime: localStorage.getItem(storageKeys.checkInTime) ?
                    parseInt(localStorage.getItem(storageKeys.checkInTime)) : null,
                pausedDuration: parseInt(localStorage.getItem(storageKeys.pausedDuration) || '0'),
                lastPauseTime: localStorage.getItem(storageKeys.lastPauseTime) ?
                    parseInt(localStorage.getItem(storageKeys.lastPauseTime)) : null
            };
        } catch (error) {
            console.error('Error loading timer state from localStorage:', error);
            return {
                timerState: TIMER_STATES.IDLE,
                elapsedTime: 0,
                checkInTime: null,
                pausedDuration: 0,
                lastPauseTime: null
            };
        }
    }, [storageKeys]);

    // State
    const [state, setState] = useState(initializeState);
    const [lastServerSync, setLastServerSync] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('connecting');

    // Refs for intervals
    const timerIntervalRef = useRef(null);
    const syncIntervalRef = useRef(null);
    const mountedRef = useRef(true);

    // Persist state to localStorage
    const persistState = useCallback((newState) => {
        if (typeof window === 'undefined') return;

        try {
            if (newState.timerState) {
                localStorage.setItem(storageKeys.timerState, newState.timerState);
            }
            if (newState.checkInTime !== undefined) {
                if (newState.checkInTime) {
                    localStorage.setItem(storageKeys.checkInTime, newState.checkInTime.toString());
                } else {
                    localStorage.removeItem(storageKeys.checkInTime);
                }
            }
            if (newState.pausedDuration !== undefined) {
                localStorage.setItem(storageKeys.pausedDuration, newState.pausedDuration.toString());
            }
            if (newState.lastPauseTime !== undefined) {
                if (newState.lastPauseTime) {
                    localStorage.setItem(storageKeys.lastPauseTime, newState.lastPauseTime.toString());
                } else {
                    localStorage.removeItem(storageKeys.lastPauseTime);
                }
            }
        } catch (error) {
            console.error('Error persisting timer state:', error);
        }
    }, [storageKeys]);

    // Calculate current elapsed time
    const calculateElapsedTime = useCallback((currentState = state) => {
        if (!currentState.checkInTime || currentState.timerState === TIMER_STATES.IDLE) {
            return 0;
        }

        const now = Date.now();
        let totalElapsed = Math.floor((now - currentState.checkInTime) / 1000);

        // Subtract paused duration
        let totalPausedTime = currentState.pausedDuration || 0;

        // If currently paused, add current pause duration
        if (currentState.timerState === TIMER_STATES.PAUSED && currentState.lastPauseTime) {
            totalPausedTime += Math.floor((now - currentState.lastPauseTime) / 1000);
        }

        return Math.max(0, totalElapsed - totalPausedTime);
    }, [state]);

    // Update state helper
    const updateState = useCallback((updates) => {
        setState(prevState => {
            const newState = { ...prevState, ...updates };
            persistState(updates);
            return newState;
        });
    }, [persistState]);

    // Clear all stored data
    const clearStoredData = useCallback(() => {
        if (typeof window === 'undefined') return;

        try {
            Object.values(storageKeys).forEach(key => {
                localStorage.removeItem(key);
            });
        } catch (error) {
            console.error('Error clearing stored data:', error);
        }
    }, [storageKeys]);

    // Server sync
    const { data: serverTimeData, refetch: refetchServerTime, isError, isLoading } = useQuery({
        queryKey: ['elapsedTime', projectId],
        queryFn: () => userGetElapsedTime(projectId),
        enabled: !!accessToken && !!projectId,
        staleTime: 30000,
        refetchInterval: (data) => {
            // Only auto-refetch if timer is running on server
            if (data?.data?.isRunning && !data?.data?.isCheckedOut) {
                return 60000; // 1 minute
            }
            return false;
        },
        refetchOnWindowFocus: true,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        onSuccess: (data) => {
            syncWithServerData(data);
            setConnectionStatus('connected');
            setLastServerSync(Date.now());
        },
        onError: (error) => {
            console.error('Server sync failed:', error);
            setConnectionStatus('error');
        }
    });

    // Sync local state with server data
    const syncWithServerData = useCallback((data) => {
        if (!data?.data || !mountedRef.current) return;

        const serverData = data.data;
        const now = Date.now();

        // Determine server state
        if (serverData.isCheckedOut) {
            updateState({
                timerState: TIMER_STATES.CHECKED_OUT,
                elapsedTime: serverData.totalDuration || serverData.elapsedTime || 0
            });
        } else if (serverData.isRunning && serverData.checkInTime) {
            const serverCheckInTime = new Date(serverData.checkInTime).getTime();
            updateState({
                timerState: TIMER_STATES.RUNNING,
                checkInTime: serverCheckInTime,
                pausedDuration: serverData.pausedDuration || 0,
                lastPauseTime: null
            });
        } else if (serverData.checkInTime && !serverData.isRunning) {
            const serverCheckInTime = new Date(serverData.checkInTime).getTime();
            updateState({
                timerState: TIMER_STATES.PAUSED,
                checkInTime: serverCheckInTime,
                pausedDuration: serverData.pausedDuration || 0,
                lastPauseTime: now // Approximate pause time
            });
        } else {
            // No active session
            updateState({
                timerState: TIMER_STATES.IDLE,
                checkInTime: null,
                pausedDuration: 0,
                lastPauseTime: null,
                elapsedTime: 0
            });
            clearStoredData();
        }
    }, [updateState, clearStoredData]);

    // Timer effect - runs every second when timer is running
    useEffect(() => {
        if (state.timerState === TIMER_STATES.RUNNING && state.checkInTime) {
            timerIntervalRef.current = setInterval(() => {
                if (!mountedRef.current) return;

                setState(currentState => ({
                    ...currentState,
                    elapsedTime: calculateElapsedTime(currentState)
                }));
            }, 1000);
        } else {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
    }, [state.timerState, state.checkInTime, calculateElapsedTime]);

    // Calculate current elapsed time for display
    const currentElapsedTime = useMemo(() => {
        if (state.timerState === TIMER_STATES.CHECKED_OUT) {
            return state.elapsedTime;
        }
        return calculateElapsedTime();
    }, [state, calculateElapsedTime]);

    // Periodic server sync for running timers
    useEffect(() => {
        if (state.timerState === TIMER_STATES.RUNNING) {
            syncIntervalRef.current = setInterval(() => {
                if (mountedRef.current) {
                    refetchServerTime();
                }
            }, 120000); // 2 minutes
        } else {
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
                syncIntervalRef.current = null;
            }
        }

        return () => {
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
                syncIntervalRef.current = null;
            }
        };
    }, [state.timerState, refetchServerTime]);

    // Initial sync on mount and project change
    useEffect(() => {
        if (projectId && (!lastServerSync || Date.now() - lastServerSync > 30000)) {
            refetchServerTime();
        }
    }, [projectId, refetchServerTime, lastServerSync]);

    // Derived states
    const isRunning = state.timerState === TIMER_STATES.RUNNING;
    const isPaused = state.timerState === TIMER_STATES.PAUSED;
    const isCheckedOut = state.timerState === TIMER_STATES.CHECKED_OUT;
    const isIdle = state.timerState === TIMER_STATES.IDLE;

    // Check-in mutation
    const checkInMutation = useMutation({
        mutationFn: () => userCheckIn(projectId),
        onMutate: async () => {
            await queryClient.cancelQueries(['elapsedTime', projectId]);

            const now = Date.now();
            updateState({
                timerState: TIMER_STATES.RUNNING,
                checkInTime: now,
                pausedDuration: 0,
                lastPauseTime: null,
                elapsedTime: 0
            });
        },
        onSuccess: (data) => {
            toast.success("Checked in successfully!");
            setTimeout(() => refetchServerTime(), 1000);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to check in.");
            updateState({
                timerState: TIMER_STATES.IDLE,
                checkInTime: null,
                pausedDuration: 0,
                lastPauseTime: null,
                elapsedTime: 0
            });
            clearStoredData();
        },
        onSettled: () => {
            queryClient.invalidateQueries(['elapsedTime', projectId]);
        }
    });

    // Pause/Resume mutation
    const pauseOrResumeMutation = useMutation({
        mutationFn: () => userPauseOrResume(projectId),
        onMutate: async () => {
            await queryClient.cancelQueries(['elapsedTime', projectId]);

            const now = Date.now();

            if (isRunning) {
                // Pause: add current session time to paused duration
                const currentElapsed = calculateElapsedTime();
                updateState({
                    timerState: TIMER_STATES.PAUSED,
                    lastPauseTime: now,
                    elapsedTime: currentElapsed
                });
            } else if (isPaused) {
                // Resume: add pause duration and restart
                const pauseDuration = state.lastPauseTime ?
                    Math.floor((now - state.lastPauseTime) / 1000) : 0;

                updateState({
                    timerState: TIMER_STATES.RUNNING,
                    pausedDuration: (state.pausedDuration || 0) + pauseDuration,
                    lastPauseTime: null
                });
            }
        },
        onSuccess: (response) => {
            const message = isRunning ? "Timer paused successfully!" : "Timer resumed successfully!";
            toast.success(message);
            setTimeout(() => refetchServerTime(), 1000);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to pause/resume timer.");
            // Revert state change
            updateState({
                timerState: isRunning ? TIMER_STATES.RUNNING : TIMER_STATES.PAUSED
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries(['elapsedTime', projectId]);
        }
    });

    // Check-out mutation
    const checkOutMutation = useMutation({
        mutationFn: () => userCheckOut(projectId),
        onMutate: async () => {
            await queryClient.cancelQueries(['elapsedTime', projectId]);

            const finalTime = calculateElapsedTime();
            updateState({
                timerState: TIMER_STATES.CHECKED_OUT,
                elapsedTime: finalTime
            });
        },
        onSuccess: (data) => {
            toast.success("Checked out successfully!");

            if (data?.data?.totalDuration !== undefined) {
                updateState({
                    elapsedTime: data.data.totalDuration
                });
            }

            // Clear stored data after successful checkout
            setTimeout(() => {
                clearStoredData();
                queryClient.invalidateQueries(['userInfo', projectId]);
            }, 1000);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to check out.");
            // Revert to previous state
            updateState({
                timerState: isRunning ? TIMER_STATES.RUNNING : TIMER_STATES.PAUSED
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries(['elapsedTime', projectId]);
        }
    });

    // Format time helper
    const formatTime = useCallback((seconds) => {
        if (!seconds || isNaN(seconds) || seconds < 0) return "00:00:00";

        const hrs = Math.floor(Math.abs(seconds) / 3600);
        const mins = Math.floor((Math.abs(seconds) % 3600) / 60);
        const secs = Math.abs(seconds) % 60;
        return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }, []);

    // Manual server sync
    const syncWithServer = useCallback(async () => {
        try {
            await refetchServerTime();
        } catch (error) {
            console.error('Manual sync failed:', error);
            setConnectionStatus('error');
        }
    }, [refetchServerTime]);

    // Connection status based on loading and error states
    useEffect(() => {
        if (isLoading) {
            setConnectionStatus('connecting');
        } else if (isError) {
            setConnectionStatus('error');
        } else if (lastServerSync && Date.now() - lastServerSync > 120000) {
            setConnectionStatus('stale');
        } else {
            setConnectionStatus('connected');
        }
    }, [isLoading, isError, lastServerSync]);

    // Cleanup on component unmount
    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
            }
        };
    }, []);

    return {
        // State
        elapsedTime: currentElapsedTime,
        timerState: state.timerState,
        isRunning,
        isPaused,
        isCheckedOut,
        isIdle,

        // Formatted values
        formattedTime: formatTime(currentElapsedTime),

        // Actions
        checkIn: checkInMutation.mutate,
        pauseOrResume: pauseOrResumeMutation.mutate,
        checkOut: checkOutMutation.mutate,
        syncWithServer,

        // Loading states
        isCheckingIn: checkInMutation.isLoading,
        isPausingOrResuming: pauseOrResumeMutation.isLoading,
        isCheckingOut: checkOutMutation.isLoading,

        // Connection info
        serverTimeData,
        connectionStatus,
        lastServerSync,

        // Helper
        formatTime,

        // Debug info (can be removed in production)
        debugInfo: {
            checkInTime: state.checkInTime,
            pausedDuration: state.pausedDuration,
            lastPauseTime: state.lastPauseTime,
            storedState: typeof window !== 'undefined' ? {
                timerState: localStorage.getItem(storageKeys.timerState),
                checkInTime: localStorage.getItem(storageKeys.checkInTime),
                pausedDuration: localStorage.getItem(storageKeys.pausedDuration)
            } : null
        }
    };
};