import { createContext, useContext, useEffect, useState } from "react";

import { loginUser, getCurrentUser } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (username, password) => {
    const data = await loginUser(username, password);

    localStorage.setItem("access_token", data.token);

    const currentUser = await getCurrentUser();

    setUser(currentUser);

    return currentUser;
  };

  const logout = () => {
    localStorage.removeItem("access_token");

    setUser(null);
  };

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();

        setUser(currentUser);
      } catch (error) {
        localStorage.removeItem("access_token");
        console.log(error)
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
