import { axiosInstance } from './axiosInstance';

// Check if user can take screenshot (timer status check)
export const canTakeScreenshot = async () => {
    try {
        const { data } = await axiosInstance.get('/user/can-capture');
        return data.data;
    } catch (error) {
        console.error('Error checking screenshot capability:', error);
        throw error;
    }
};

// Upload screenshot (used by Electron)
export const uploadScreenshot = async (file) => {
    try {
        const formData = new FormData();
        formData.append('screenshot', file);

        const { data } = await axiosInstance.post('/user/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return data.data;
    } catch (error) {
        console.error('Error uploading screenshot:', error);
        throw error;
    }
};

// Get user's own screenshots for a project
export const getUserScreenshots = async (projectId, filters = {}) => {
    try {
        const { limit = 20, page = 1 } = filters;

        let url = `/user/my-screenshots?limit=${limit}&page=${page}`;

        // Add projectId if provided
        if (projectId) {
            url += `&projectId=${projectId}`;
        }

        const { data } = await axiosInstance.get(url);
        return data.data.screenshots; // Return the screenshots array directly
    } catch (error) {
        console.error('Error fetching user screenshots:', error);
        throw error;
    }
};

// Get project screenshots (Company/QC Admin only)
export const getProjectScreenshots = async (projectId, filters = {}) => {
    try {
        const { userId, startDate, endDate, limit = 50, page = 1 } = filters;

        let url = `/user/project-screenshots?projectId=${projectId}&limit=${limit}&page=${page}`;

        if (userId) url += `&userId=${userId}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;

        const { data } = await axiosInstance.get(url);

        // Group screenshots by user for the frontend
        const groupedByUser = {};
        data.data.screenshots.forEach(screenshot => {
            const userId = screenshot.userId._id;
            if (!groupedByUser[userId]) {
                groupedByUser[userId] = {
                    user: screenshot.userId,
                    screenshots: []
                };
            }
            groupedByUser[userId].screenshots.push(screenshot);
        });

        return {
            screenshots: data.data.screenshots,
            groupedByUser: Object.values(groupedByUser),
            pagination: data.data.pagination
        };
    } catch (error) {
        console.error('Error fetching project screenshots:', error);
        throw error;
    }
};

// Get screenshot statistics (Company/QC Admin only)
export const getScreenshotStats = async (filters = {}) => {
    try {
        const { projectId, startDate, endDate } = filters;

        let url = '/user/stats';
        const params = new URLSearchParams();

        if (projectId) params.append('projectId', projectId);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const { data } = await axiosInstance.get(url);
        return data.data; // Return the stats array directly
    } catch (error) {
        console.error('Error fetching screenshot stats:', error);
        throw error;
    }
};

// Get User Tracker Status (for backward compatibility with existing tracker endpoint)
export const getUserTrackerStatus = async () => {
    try {
        // First try the screenshot endpoint for timer status
        const { data } = await axiosInstance.get('/user/can-capture');

        // Transform the response to match expected format
        return {
            isRunning: data.data.canTakeScreenshot,
            isCheckedOut: !data.data.isTimerActive,
            projectTitle: data.data.currentProject?.title || null,
            checkIn: data.data.checkInTime
        };
    } catch (error) {
        console.error('Error fetching user tracker status:', error);
        // Fallback to original endpoint if available
        try {
            const { data } = await axiosInstance.get('/user/check-status');
            return data.data;
        } catch (fallbackError) {
            console.error('Fallback tracker status error:', fallbackError);
            throw error;
        }
    }
};