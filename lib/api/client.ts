import axios, { type AxiosInstance } from 'axios';

const apiClient: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add token
apiClient.interceptors.request.use(
    (config) => {
        // Token will be added from store in individual API functions
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle 401 and refresh token
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Get refresh token
            const refreshToken = localStorage.getItem('refreshToken');

            // Only try to refresh if we have a refresh token
            // Don't try to refresh on initial login failures
            if (!refreshToken) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            try {
                // Try to refresh the access token
                const { data } = await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}/admin/auth/refresh`,
                    { refreshToken }
                );

                // Update tokens in localStorage
                localStorage.setItem('accessToken', data.accessToken);
                if (data.refreshToken) {
                    localStorage.setItem('refreshToken', data.refreshToken);
                }

                // Retry the original request with new token
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear tokens and redirect to login
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('admin-storage'); // Keep this if it's still needed

                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
