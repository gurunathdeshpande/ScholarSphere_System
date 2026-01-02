import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const decodeAndSetUser = (token) => {
        try {
            const decoded = jwtDecode(token);
            // Check expiry
            if (decoded.exp * 1000 < Date.now()) {
                localStorage.removeItem('token');
                setUser(null);
                return null;
            }
            // Set partial user from token
            setUser(prev => ({
                ...prev,
                id: decoded.sub,
                role: decoded.role,
                faculty_id: decoded.faculty_id
            }));
            return decoded;
        } catch (e) {
            console.error("Invalid token", e);
            localStorage.removeItem('token');
            setUser(null);
            return null;
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                const decoded = decodeAndSetUser(token);
                if (decoded) {
                    try {
                        const response = await api.get('/auth/me');
                        // Merge full details (username, email) with accurate token claims
                        setUser(prev => ({ ...prev, ...response.data }));
                    } catch (error) {
                        console.error("Failed to fetch user details", error);
                        // If /me fails but token is valid (e.g. network error), we still have partial user.
                        // But if 401, remove token.
                        if (error.response && error.response.status === 401) {
                            localStorage.removeItem('token');
                            setUser(null);
                        }
                    }
                }
            }
            setLoading(false);
        };

        fetchUser();
    }, []);

    const login = async (username, password, role) => {
        try {
            const response = await api.post('/auth/login', { username, password, role });
            if (response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
                // Decode immediately to update state
                decodeAndSetUser(response.data.access_token);
                // Also merge the server response user object which has username
                setUser(prev => ({ ...prev, ...response.data.user }));
                return response.data;
            } else {
                throw new Error("No access token received");
            }
        } catch (error) {
            throw error;
        }
    };

    const register = async (username, email, password, role = 'student') => {
        const response = await api.post('/auth/register', { username, email, password, role });
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
