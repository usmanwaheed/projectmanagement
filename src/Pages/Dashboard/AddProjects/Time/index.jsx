/* eslint-disable react-hooks/rules-of-hooks */

import style from "../Controls/style.module.scss"
// -------------- I am Using this files Styles from the Controllers Tab Folder --------------
import { useAuth } from "../../../../context/AuthProvider";

import {
    Stack, Table,
    TableBody, TableCell,
    TableContainer, TableHead,
    TableRow, Typography,
    Avatar, Chip, Box,
    Paper, LinearProgress
} from '@mui/material'
import {
    EmojiEvents,
    WorkspacePremium,
    Star,
    TrendingUp
} from '@mui/icons-material';

export default function index() {
    const { theme, mode } = useAuth();
    const tableClassText = mode === 'light' ? style.lightTableText : style.darkTableText;
    const tableGap = mode === 'light' ? style.tableBodyLight : style.tableBodyDark;

    const leaderboardData = [
        { id: 1, name: "Alice Johnson", email: "alice@example.com", points: 95, totalPoints: 100, rank: 1, avatar: "A", trend: "up" },
        { id: 2, name: "Bob Smith", email: "bob@example.com", points: 89, totalPoints: 100, rank: 2, avatar: "B", trend: "up" },
        { id: 3, name: "Carol Davis", email: "carol@example.com", points: 87, totalPoints: 100, rank: 3, avatar: "C", trend: "same" },
        { id: 4, name: "David Wilson", email: "david@example.com", points: 82, totalPoints: 100, rank: 4, avatar: "D", trend: "down" },
        { id: 5, name: "Eva Martinez", email: "eva@example.com", points: 78, totalPoints: 100, rank: 5, avatar: "E", trend: "up" },
        { id: 6, name: "Frank Brown", email: "frank@example.com", points: 75, totalPoints: 100, rank: 6, avatar: "F", trend: "up" },
        { id: 7, name: "Grace Lee", email: "grace@example.com", points: 71, totalPoints: 100, rank: 7, avatar: "G", trend: "down" },
        { id: 8, name: "Henry Taylor", email: "henry@example.com", points: 68, totalPoints: 100, rank: 8, avatar: "H", trend: "same" },
    ];

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1:
                return <EmojiEvents sx={{ color: '#FFD700', fontSize: 24 }} />;
            case 2:
                return <WorkspacePremium sx={{ color: '#C0C0C0', fontSize: 24 }} />;
            case 3:
                return <Star sx={{ color: '#CD7F32', fontSize: 24 }} />;
            default:
                return (
                    <Box
                        sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: '#f5f5f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#666'
                        }}
                    >
                        {rank}
                    </Box>
                );
        }
    };

    const getRankColor = (rank) => {
        switch (rank) {
            case 1: return '#FFD700';
            case 2: return '#C0C0C0';
            case 3: return '#CD7F32';
            default: return theme.palette.primary.main;
        }
    };

    const getTrendIcon = (trend) => {
        const color = trend === 'up' ? '#4caf50' : trend === 'down' ? '#f44336' : '#9e9e9e';
        return <TrendingUp sx={{ color, fontSize: 16, transform: trend === 'down' ? 'rotate(180deg)' : 'none' }} />;
    };

    return (
        <Stack variant="div" spacing={3}>
            {/* Header */}
            <Paper elevation={2} sx={{ p: 3, backgroundColor: theme.palette.background.paper }}>
                <Stack direction="row" alignItems="center" spacing={2} justifyContent="center">
                    <EmojiEvents sx={{ fontSize: 32, color: '#FFD700' }} />
                    <Typography variant="h4" fontWeight="bold" color={theme.palette.text.primary}>
                        Leaderboard
                    </Typography>
                </Stack>
                <Typography variant="subtitle1" textAlign="center" color="text.secondary" sx={{ mt: 1 }}>
                    Top performers this month
                </Typography>
            </Paper>

            {/* Leaderboard Table */}
            <TableContainer component={Paper} elevation={3}>
                {leaderboardData?.length > 0 ? (
                    <Table sx={{
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        overflow: 'visible',
                        borderRadius: '0.6rem'
                    }}>
                        <TableHead>
                            <TableRow className={style.tableRowHead} sx={{ backgroundColor: '#f8f9fa' }}>
                                <TableCell align="left" variant="h6" className={tableClassText} sx={{ fontWeight: 'bold', fontSize: '16px' }}>
                                    Rank
                                </TableCell>
                                <TableCell variant="h6" className={tableClassText} sx={{ fontWeight: 'bold', fontSize: '16px' }}>
                                    User
                                </TableCell>
                                <TableCell align="left" variant="h6" className={tableClassText} sx={{ fontWeight: 'bold', fontSize: '16px' }}>
                                    Points
                                </TableCell>
                                <TableCell align="center" variant="h6" className={tableClassText} sx={{ fontWeight: 'bold', fontSize: '16px' }}>
                                    Progress
                                </TableCell>
                                <TableCell align="center" variant="h6" className={tableClassText} sx={{ fontWeight: 'bold', fontSize: '16px' }}>
                                    Trend
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody className={tableGap}>
                            {leaderboardData?.map((user, index) => {
                                const isTopThree = user.rank <= 3;
                                return (
                                    <TableRow
                                        key={user.id}
                                        className={style.tableRowBody}
                                        sx={{
                                            '&:hover': { backgroundColor: '#f5f5f5' },
                                            backgroundColor: isTopThree ? '#fafafa' : 'inherit',
                                            borderLeft: isTopThree ? `4px solid ${getRankColor(user.rank)}` : 'none'
                                        }}
                                    >
                                        <TableCell component="th" scope="row">
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                {getRankIcon(user.rank)}
                                                <Typography fontWeight="bold" color={getRankColor(user.rank)}>
                                                    #{user.rank}
                                                </Typography>
                                            </Stack>
                                        </TableCell>

                                        <TableCell component="th" scope="row">
                                            <Stack direction="row" alignItems="center" spacing={2}>
                                                <Avatar
                                                    sx={{
                                                        bgcolor: getRankColor(user.rank),
                                                        width: 40,
                                                        height: 40,
                                                        fontSize: '16px',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {user.avatar}
                                                </Avatar>
                                                <Stack>
                                                    <Typography fontWeight="600" fontSize="16px">
                                                        {user.name}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ color: '#AD86FC' }}
                                                    >
                                                        {user.email}
                                                    </Typography>
                                                </Stack>
                                            </Stack>
                                        </TableCell>

                                        <TableCell align="left">
                                            <Stack spacing={1}>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Typography
                                                        fontWeight="bold"
                                                        fontSize="18px"
                                                        color={getRankColor(user.rank)}
                                                    >
                                                        {user.points}
                                                    </Typography>
                                                    <Typography className={style.textGreyInfo}>
                                                        /{user.totalPoints}
                                                    </Typography>
                                                </Stack>
                                                {isTopThree && (
                                                    <Chip
                                                        label={`Top ${user.rank}`}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: getRankColor(user.rank),
                                                            color: 'white',
                                                            fontWeight: 'bold',
                                                            fontSize: '10px',
                                                            maxWidth: '60px'
                                                        }}
                                                    />
                                                )}
                                            </Stack>
                                        </TableCell>

                                        <TableCell align="center">
                                            <Box sx={{ width: '100%', maxWidth: '120px' }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={user.points}
                                                    sx={{
                                                        height: 8,
                                                        borderRadius: 4,
                                                        backgroundColor: '#e0e0e0',
                                                        '& .MuiLinearProgress-bar': {
                                                            backgroundColor: getRankColor(user.rank),
                                                            borderRadius: 4,
                                                        }
                                                    }}
                                                />
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    {user.points}%
                                                </Typography>
                                            </Box>
                                        </TableCell>

                                        <TableCell align="center">
                                            <Stack alignItems="center" spacing={0.5}>
                                                {getTrendIcon(user.trend)}
                                                <Typography variant="caption" color="text.secondary">
                                                    {user.trend}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                ) : (
                    <Stack sx={{ p: 4, textAlign: 'center' }}>
                        <Typography>No leaderboard data available</Typography>
                    </Stack>
                )}
            </TableContainer>

            {/* Stats Summary */}
            <Paper elevation={2} sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-around" alignItems="center">
                    <Stack alignItems="center" spacing={1}>
                        <Typography variant="h4" fontWeight="bold" color="#FFD700">
                            {leaderboardData[0]?.points || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Highest Score
                        </Typography>
                    </Stack>
                    <Stack alignItems="center" spacing={1}>
                        <Typography variant="h4" fontWeight="bold" color={theme.palette.primary.main}>
                            {Math.round(leaderboardData.reduce((acc, user) => acc + user.points, 0) / leaderboardData.length) || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Average Score
                        </Typography>
                    </Stack>
                    <Stack alignItems="center" spacing={1}>
                        <Typography variant="h4" fontWeight="bold" color="#4caf50">
                            {leaderboardData.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Users
                        </Typography>
                    </Stack>
                </Stack>
            </Paper>
        </Stack>
    );
}