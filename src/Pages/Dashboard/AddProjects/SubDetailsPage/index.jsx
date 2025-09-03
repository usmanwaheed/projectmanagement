import style from "./style.module.scss"
import { useState, useEffect, useCallback } from "react";
import {
    Container, Typography,
    Box, Stack,
    TableBody, TableRow,
    TableCell, TableHead,
    Table, TableContainer,
    Dialog, IconButton,
    Chip, Alert, CircularProgress,
    Grid, Card, CardMedia,
    CardContent, Tooltip,
    Badge,
} from "@mui/material";
import { Link, useNavigate, useParams } from "react-router-dom";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserScreenshots, getProjectScreenshots, getUserTrackerStatus } from "../../../../api/subDetailSnapShot";
import { useAuth } from "../../../../context/AuthProvider";

const Index = () => {
    const { theme, mode, user, accessToken } = useAuth();
    const queryClient = useQueryClient();
    const tableGap = mode === 'light' ? style.tableBodyLight : style.tableBodyDark;
    const tableClassText = mode === 'light' ? 'lightTableText' : 'darkTableText';

    const [open, setOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedImageData, setSelectedImageData] = useState(null);
    const [lastScreenshotTime, setLastScreenshotTime] = useState(null);

    const handleOpen = (imageSrc, imageData = null) => {
        setSelectedImage(imageSrc);
        setSelectedImageData(imageData);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedImage(null);
        setSelectedImageData(null);
    };

    const navigate = useNavigate();
    const goBack = () => {
        navigate(-1);
    }

    const { id: ProjectId } = useParams();
    const currentUserId = user?._id;
    const userRole = user?.role;
    const isAdmin = userRole === 'company' || userRole === 'admin' || userRole === 'qcadmin';

    // Fetch user's own screenshots with refetch interval
    const {
        data: userScreenshots,
        isLoading: userScreenshotsLoading,
        error: userScreenshotsError,
        refetch: refetchUserScreenshots
    } = useQuery({
        queryKey: ['userScreenshots', ProjectId],
        queryFn: () => getUserScreenshots(ProjectId, { limit: 50, page: 1 }),
        enabled: !!accessToken && !!ProjectId,
        refetchInterval: 30000, // Refetch every 30 seconds
        staleTime: 10000, // Data is fresh for 10 seconds
    });

    // Fetch all screenshots (only for admins)
    const {
        data: allScreenshotsData,
        isLoading: allScreenshotsLoading,
        error: allScreenshotsError,
        refetch: refetchAllScreenshots
    } = useQuery({
        queryKey: ['allScreenshots', ProjectId],
        queryFn: () => getProjectScreenshots(ProjectId, { limit: 100, page: 1 }),
        enabled: !!accessToken && !!ProjectId && isAdmin,
        refetchInterval: 30000,
        staleTime: 10000,
    });

    // Fetch user tracker status with more frequent updates
    const {
        data: trackerStatus,
        isLoading: trackerLoading,
        error: trackerError,
        refetch: refetchTrackerStatus
    } = useQuery({
        queryKey: ['userTrackerStatus'],
        queryFn: getUserTrackerStatus,
        enabled: !!accessToken,
        refetchInterval: 10000, // Check every 10 seconds
        staleTime: 5000,
    });

    // Manual refresh function
    const handleRefresh = useCallback(() => {
        refetchUserScreenshots();
        refetchTrackerStatus();
        if (isAdmin) {
            refetchAllScreenshots();
        }
    }, [refetchUserScreenshots, refetchTrackerStatus, refetchAllScreenshots, isAdmin]);

    // Update last screenshot time when new screenshots are received
    useEffect(() => {
        if (userScreenshots && userScreenshots.length > 0) {
            const latest = userScreenshots[0];
            setLastScreenshotTime(latest.createdAt || latest.captureTime);
        }
    }, [userScreenshots]);

    // WebSocket listener for real-time screenshot updates (if available)
    useEffect(() => {
        const handleScreenshotUpdate = () => {
            queryClient.invalidateQueries(['userScreenshots', ProjectId]);
            if (isAdmin) {
                queryClient.invalidateQueries(['allScreenshots', ProjectId]);
            }
        };

        // You can implement WebSocket listener here if needed
        // window.addEventListener('screenshot-updated', handleScreenshotUpdate);

        return () => {
            // window.removeEventListener('screenshot-updated', handleScreenshotUpdate);
        };
    }, [ProjectId, isAdmin, queryClient]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCreatedAtTime = (createdAt) => {
        const date = new Date(createdAt);
        return date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getTimeAgo = (dateString) => {
        const now = new Date();
        const past = new Date(dateString);
        const diffInMinutes = Math.floor((now - past) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`;
        return `${Math.floor(diffInMinutes / 1440)} days ago`;
    };

    // Group screenshots by date
    const groupByDate = (screenshots) => {
        return screenshots?.reduce((acc, snap) => {
            const dateKey = formatDate(snap.createdAt || snap.captureTime);
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(snap);
            return acc;
        }, {});
    };

    const groupedUserScreenshots = groupByDate(userScreenshots);

    // Calculate screenshot statistics
    const getScreenshotStats = () => {
        const today = new Date().toDateString();
        const todayScreenshots = userScreenshots?.filter(
            shot => new Date(shot.createdAt || shot.captureTime).toDateString() === today
        ) || [];

        return {
            total: userScreenshots?.length || 0,
            today: todayScreenshots.length,
            lastCapture: lastScreenshotTime ? getTimeAgo(lastScreenshotTime) : 'Never'
        };
    };

    const stats = getScreenshotStats();

    // Error handling component
    const ErrorAlert = ({ error, onRetry }) => (
        <Alert
            severity="error"
            action={
                <IconButton color="inherit" size="small" onClick={onRetry}>
                    <CameraAltIcon />
                </IconButton>
            }
        >
            {error?.message || error?.response?.data?.message || 'Failed to load data'}
        </Alert>
    );

    // Loading component
    const LoadingBox = ({ message }) => (
        <Box display="flex" alignItems="center" justifyContent="center" p={4}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography>{message}</Typography>
        </Box>
    );

    // Screenshot grid component
    const ScreenshotGrid = ({ screenshots, userName = "Your" }) => (
        <Grid container spacing={2}>
            {screenshots.map((snap) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={snap._id}>
                    <Card
                        sx={{
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                                transform: 'scale(1.02)',
                                boxShadow: theme.shadows[4]
                            }
                        }}
                        onClick={() => handleOpen(snap.imageUrl, snap)}
                    >
                        <CardMedia
                            component="img"
                            height="140"
                            image={snap.imageUrl}
                            alt={`${userName} Snapshot`}
                            sx={{ objectFit: 'cover' }}
                        />
                        <CardContent sx={{ pb: 1 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="caption" color="text.secondary">
                                    {formatCreatedAtTime(snap.createdAt || snap.captureTime)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {getTimeAgo(snap.createdAt || snap.captureTime)}
                                </Typography>
                            </Stack>
                            {snap.projectId?.projectTitle && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                    Project: {snap.projectId.projectTitle}
                                </Typography>
                            )}
                            {snap.status && (
                                <Chip
                                    label={snap.status}
                                    size="small"
                                    color={
                                        snap.status === 'approved' ? 'success' :
                                            snap.status === 'flagged' ? 'warning' :
                                                snap.status === 'rejected' ? 'error' : 'default'
                                    }
                                    sx={{ mt: 1 }}
                                />
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );

    return (
        <Container>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Link className={style.goBack} onClick={goBack}>
                    <IconButton disableRipple>
                        <ArrowBackIosNewIcon sx={{ color: theme.palette.text.primary }} />
                    </IconButton>
                    <Typography className={style.goBackTitle} sx={{ color: theme.palette.text.primary }}>
                        Return
                    </Typography>
                </Link>

                <Tooltip title="Refresh Data">
                    <IconButton onClick={handleRefresh} color="primary">
                        <CameraAltIcon />
                    </IconButton>
                </Tooltip>
            </Stack>

            <Stack variant="div" gap={3} my={4}>
                {/* Status Overview */}
                <Card sx={{ p: 3 }}>
                    <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
                        {/* Tracker Status */}
                        {trackerLoading ? (
                            <CircularProgress size={20} />
                        ) : trackerError ? (
                            <ErrorAlert error={trackerError} onRetry={refetchTrackerStatus} />
                        ) : trackerStatus ? (
                            <>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <AccessTimeIcon color={trackerStatus.isRunning ? "success" : "disabled"} />
                                    <Typography variant="h6">Status:</Typography>
                                    <Chip
                                        label={
                                            trackerStatus.isRunning && !trackerStatus.isCheckedOut
                                                ? "Active & Recording"
                                                : trackerStatus.isCheckedOut
                                                    ? "Checked Out"
                                                    : "Inactive"
                                        }
                                        color={
                                            trackerStatus.isRunning && !trackerStatus.isCheckedOut
                                                ? "success"
                                                : "default"
                                        }
                                        variant="outlined"
                                    />
                                </Stack>

                                {trackerStatus.projectTitle && (
                                    <Typography variant="body2" color="text.secondary">
                                        Project: <strong>{trackerStatus.projectTitle}</strong>
                                    </Typography>
                                )}
                            </>
                        ) : (
                            <Typography color="text.secondary">No tracker status available</Typography>
                        )}

                        {/* Screenshot Stats */}
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Badge badgeContent={stats.today} color="primary">
                                <CameraAltIcon />
                            </Badge>
                            <Stack>
                                <Typography variant="body2">
                                    Total: {stats.total} | Today: {stats.today}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Last: {stats.lastCapture}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Stack>
                </Card>

                {/* User's Own Screenshots */}
                <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h5">
                            <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Your Screenshots
                        </Typography>
                        {userScreenshotsLoading && <CircularProgress size={20} />}
                    </Stack>

                    {userScreenshotsError ? (
                        <ErrorAlert error={userScreenshotsError} onRetry={refetchUserScreenshots} />
                    ) : userScreenshotsLoading ? (
                        <LoadingBox message="Loading your screenshots..." />
                    ) : (
                        <Stack>
                            {groupedUserScreenshots && Object.entries(groupedUserScreenshots).length > 0 ? (
                                Object.entries(groupedUserScreenshots).map(([date, snaps]) => (
                                    <Box key={date} mb={4}>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                color: theme.palette.text.primary,
                                                mb: 2,
                                                borderBottom: `1px solid ${theme.palette.divider}`,
                                                pb: 1
                                            }}
                                        >
                                            {date} ({snaps.length} screenshots)
                                        </Typography>
                                        <ScreenshotGrid screenshots={snaps} />
                                    </Box>
                                ))
                            ) : (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    No screenshots available yet. Screenshots are automatically taken when you're checked in and the timer is running.
                                </Alert>
                            )}
                        </Stack>
                    )}
                </Box>

                {/* All Users Screenshots (Admin Only) */}
                {isAdmin && (
                    <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h5">Team Screenshots</Typography>
                            {allScreenshotsLoading && <CircularProgress size={20} />}
                        </Stack>

                        {allScreenshotsError ? (
                            <ErrorAlert error={allScreenshotsError} onRetry={refetchAllScreenshots} />
                        ) : allScreenshotsLoading ? (
                            <LoadingBox message="Loading team screenshots..." />
                        ) : allScreenshotsData?.groupedByUser?.length > 0 ? (
                            allScreenshotsData.groupedByUser.map((userGroup) => {
                                const groupedSnapshots = groupByDate(userGroup.screenshots);
                                return (
                                    <Card key={userGroup.user._id} sx={{ mb: 3, p: 2 }}>
                                        <Typography variant="h6" mb={2}>
                                            {userGroup.user.name || userGroup.user.email}'s Screenshots
                                            <Chip
                                                label={`${userGroup.screenshots.length} total`}
                                                size="small"
                                                sx={{ ml: 1 }}
                                            />
                                        </Typography>
                                        {Object.entries(groupedSnapshots).map(([date, snaps]) => (
                                            <Box key={date} mb={3}>
                                                <Typography
                                                    variant="subtitle1"
                                                    sx={{ color: theme.palette.text.secondary, mb: 1 }}
                                                >
                                                    {date} ({snaps.length})
                                                </Typography>
                                                <ScreenshotGrid
                                                    screenshots={snaps}
                                                    userName={userGroup.user.name || userGroup.user.email}
                                                />
                                            </Box>
                                        ))}
                                    </Card>
                                );
                            })
                        ) : (
                            <Alert severity="info">
                                No team screenshots available for this project.
                            </Alert>
                        )}
                    </Box>
                )}

                {/* Enhanced Image Preview Dialog */}
                <Dialog
                    open={open}
                    onClose={handleClose}
                    maxWidth="lg"
                    fullWidth
                    PaperProps={{
                        sx: { backgroundColor: theme.palette.background.paper }
                    }}
                >
                    {selectedImage && (
                        <Box>
                            <img
                                src={selectedImage}
                                alt="Enlarged View"
                                style={{
                                    width: "100%",
                                    height: "auto",
                                    maxHeight: "80vh",
                                    objectFit: "contain",
                                    display: 'block'
                                }}
                            />
                            {selectedImageData && (
                                <Box p={2}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" color="text.secondary">
                                            Captured: {formatCreatedAtTime(selectedImageData.createdAt || selectedImageData.captureTime)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {getTimeAgo(selectedImageData.createdAt || selectedImageData.captureTime)}
                                        </Typography>
                                    </Stack>
                                    {selectedImageData.projectId?.projectTitle && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            Project: <strong>{selectedImageData.projectId.projectTitle}</strong>
                                        </Typography>
                                    )}
                                    {selectedImageData.status && (
                                        <Chip
                                            label={selectedImageData.status}
                                            size="small"
                                            color={
                                                selectedImageData.status === 'approved' ? 'success' :
                                                    selectedImageData.status === 'flagged' ? 'warning' :
                                                        selectedImageData.status === 'rejected' ? 'error' : 'default'
                                            }
                                            sx={{ mt: 1 }}
                                        />
                                    )}
                                </Box>
                            )}
                        </Box>
                    )}
                </Dialog>
            </Stack>
        </Container>
    );
};

export default Index;