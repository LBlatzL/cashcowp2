
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API = import.meta.env.VITE_API_BASE_URL
    || "http://127.0.0.1:8000";

function decodeToken(token) {
    const payload = token.split(".")[1];

    return JSON.parse(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
}

function getStoredUser() {
    const token = localStorage.getItem("token");
    const refresh = localStorage.getItem("refresh_token");

    if (!token || !refresh) return null;

    try {
        return decodeToken(token);
    } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(getStoredUser);

    useEffect(() => {
        const onLogout = () => setUser(null);

        const onRefresh = () => {
            const token = localStorage.getItem("token");
            if (token) setUser(decodeToken(token));
        };

        window.addEventListener("auth:logout", onLogout);
        window.addEventListener("auth:refresh", onRefresh);

        return () => {
            window.removeEventListener("auth:logout", onLogout);
            window.removeEventListener("auth:refresh", onRefresh);
        };
    }, []);

    async function login(username, password) {
        const formData = new URLSearchParams();

        formData.append("username", username);
        formData.append("password", password);

        const response = await axios.post(`${API}/auth/token`, formData);

        const { access_token, refresh_token } = response.data;

        localStorage.setItem("token", access_token);
        localStorage.setItem("refresh_token", refresh_token);

        setUser(decodeToken(access_token));
    }

    async function logout() {
        const refreshToken = localStorage.getItem("refresh_token");

        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        setUser(null);

        if (refreshToken) {
            try {
                await axios.post(`${API}/auth/logout`, {
                    refresh_token: refreshToken
                });
            } catch (error) {
                console.error("Logout request failed", error);
            }
        }
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
