
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL
    || "http://127.0.0.1:8000";

const apiClient = axios.create({ baseURL });

let refreshPromise = null;

function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    window.dispatchEvent(new Event("auth:logout"));
}

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        if (
            error.response?.status !== 401 ||
            !original ||
            original._retry ||
            original.url?.includes("/auth/")
        ) {
            return Promise.reject(error);
        }

        original._retry = true;

        const refreshToken = localStorage.getItem("refresh_token");

        if (!refreshToken) {
            clearSession();
            return Promise.reject(error);
        }

        if (!refreshPromise) {
            refreshPromise = axios.post(
                `${baseURL}/auth/refresh`,
                { refresh_token: refreshToken }
            ).then(({ data }) => {
                localStorage.setItem("token", data.access_token);
                localStorage.setItem("refresh_token", data.refresh_token);
                window.dispatchEvent(new Event("auth:refresh"));
                return data.access_token;
            }).catch((err) => {
                clearSession();
                throw err;
            }).finally(() => {
                refreshPromise = null;
            });
        }

        try {
            const newToken = await refreshPromise;
            original.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(original);
        } catch (err) {
            return Promise.reject(err);
        }
    }
);

export default apiClient;
