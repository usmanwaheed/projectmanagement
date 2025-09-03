import axios from 'axios';

class ElectronAxios {
    constructor() {
        this.instance = axios.create({
            baseURL: 'http://localhost:6007/user',
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        this.currentToken = null;
        this.cookies = null;
        this.setupInterceptors();
    }

    async refreshToken() {
        try {
            // Don't include the expired token in the refresh request
            const config = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            // Temporarily remove the Authorization header
            if (this.instance.defaults.headers.common['Authorization']) {
                delete this.instance.defaults.headers.common['Authorization'];
            }

            const response = await this.instance.post('/refresh-token', {}, config);

            const newToken = response.data.accessToken;
            this.setAuthToken(newToken);
            return newToken;
        } catch (error) {
            console.error('Refresh token failed:', error);
            this.clearAuth();
            return null;
        }
    }

    setupInterceptors() {
        // Request interceptor
        this.instance.interceptors.request.use(
            config => {
                if (this.currentToken) {
                    config.headers.Authorization = `Bearer ${this.currentToken}`;
                }
                return config;
            },
            error => Promise.reject(error)
        );

        // Response interceptor with enhanced error handling
        // Response interceptor with enhanced error handling
        this.instance.interceptors.response.use(
            response => response,
            async error => {
                const originalRequest = error.config;

                // Handle 401 errors
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    // Skip refresh for the refresh-token endpoint to avoid infinite loops
                    if (originalRequest.url.includes('/refresh-token')) {
                        this.clearAuth();
                        return Promise.reject(error);
                    }

                    try {
                        const newToken = await this.refreshToken();
                        if (newToken) {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                            return this.instance(originalRequest);
                        }
                    } catch (refreshError) {
                        console.error('Token refresh failed:', refreshError);
                        this.clearAuth();
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    setAuthToken(token) {
        this.currentToken = token;
        this.instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // setCookies(cookies) {
    //     const cookieString = Object.entries(cookies)
    //         .map(([key, value]) => `${key}=${value}`)
    //         .join('; ');
    //     this.instance.defaults.headers.Cookie = cookieString;
    // }
    setCookies(cookies) {
        this.cookies = cookies;
        const cookieString = Object.entries(cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join('; ');
        this.instance.defaults.headers.Cookie = cookieString;
    }

    clearAuth() {
        this.currentToken = null;
        delete this.instance.defaults.headers.common['Authorization'];
        delete this.instance.defaults.headers.Cookie;
    }
}

const electronAxios = new ElectronAxios();
export default electronAxios;