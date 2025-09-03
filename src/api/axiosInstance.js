import axios from "axios";

export const axiosInstance = axios.create({
    // baseURL: "http://localhost:6007",
    baseURL: "https://project-managment-sage.vercel.app",
    withCredentials: true,
});
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
    refreshSubscribers.push(cb);
}

function onRefreshed(newToken) {
    refreshSubscribers.forEach(cb => cb(newToken));
    refreshSubscribers = [];
}

function getTokens() {
    const isAdmin = !!localStorage.getItem("accessAdminToken");
    return {
        accessToken: isAdmin
            ? localStorage.getItem("accessAdminToken")
            : localStorage.getItem("userToken"),
        refreshToken: isAdmin
            ? localStorage.getItem("refreshAdminToken")
            : localStorage.getItem("userRefreshToken"),
        isAdmin
    };
}

axiosInstance.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // If a refresh is already in progress, wait for it to finish
            if (isRefreshing) {
                return new Promise(resolve => {
                    subscribeTokenRefresh((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(axiosInstance(originalRequest));
                    });
                });
            }

            isRefreshing = true;

            try {
                const { refreshToken, isAdmin } = getTokens();

                if (!refreshToken) {
                    throw new Error("No refresh token available");
                }

                const refreshEndpoint = isAdmin
                    ? "/admin/refresh-token"
                    : "/user/refresh-token";

                const refreshBody = isAdmin
                    ? { refreshAdminToken: refreshToken }
                    : { refreshToken };

                const { data } = await axios.post(
                    `${axiosInstance.defaults.baseURL}${refreshEndpoint}`,
                    refreshBody,
                    { withCredentials: true }
                );

                const newAccessToken = isAdmin ? data.data.accessAdminToken : data.data.accessToken;
                const newRefreshToken = isAdmin ? data.data.refreshAdminToken : data.data.refreshToken;

                if (isAdmin) {
                    localStorage.setItem("accessAdminToken", newAccessToken);
                    localStorage.setItem("refreshAdminToken", newRefreshToken);
                } else {
                    localStorage.setItem("userToken", newAccessToken);
                    localStorage.setItem("userRefreshToken", newRefreshToken);
                }

                // Set flag false and notify all subscribers
                isRefreshing = false;
                onRefreshed(newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axiosInstance(originalRequest);
            } catch (err) {
                isRefreshing = false;
                refreshSubscribers = [];
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);
