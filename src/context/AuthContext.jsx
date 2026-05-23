/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const API = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const getStoredUser = () => {
  try {
    const storedUser = window.localStorage.getItem("authUser");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    window.localStorage.removeItem("authUser");
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const saveUser = useCallback((nextUser) => {
    setUser(nextUser);

    if (nextUser) {
      window.localStorage.setItem("authUser", JSON.stringify(nextUser));
    } else {
      window.localStorage.removeItem("authUser");
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await API.get("/auth/me");
      saveUser(data.user);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        saveUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, [saveUser]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const register = async (userName, email, password, passwordConfirm) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await API.post("/auth/register", {
        userName,
        email,
        password,
        passwordConfirm,
      });
      return data;
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await API.post("/auth/login", { email, password });
      saveUser(data.user);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);

    try {
      await API.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      saveUser(null);
      setLoading(false);
    }
  };

  const isAuthenticated = !!user;
  const isVendor = user?.role === "vendor";
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated,
        isVendor,
        isAdmin,
        register,
        login,
        logout,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};

export default AuthContext;
