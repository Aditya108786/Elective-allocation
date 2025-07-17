import { createContext, useContext, useState } from "react";

const AdminAuthContext = createContext({
  isloggedin: false,
  login: () => {},
  logout: () => {},
  setisloggedin: () => {},
});

export const AdminAuthProvider = ({ children }) => {
  const [isloggedin, setisloggedin] = useState(() => {
    const stored = sessionStorage.getItem("adminlogin");
    return stored === "true";
  });

  const login = () => {
    setisloggedin(true);
    sessionStorage.setItem("adminlogin", "true");
  };

  const logout = () => {
    setisloggedin(false);
    sessionStorage.removeItem("adminlogin");
  };

  return (
    <AdminAuthContext.Provider value={{ isloggedin, login, logout, setisloggedin }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);