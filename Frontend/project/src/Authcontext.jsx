import { createContext, useState, useContext } from "react";

const AuthContext = createContext({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  login: () => {},
  logout: () => {}
});

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const stored = sessionStorage.getItem("studentlogin");
    return stored === 'true';
  });

  const login = (rollNo) => {
    setIsLoggedIn(true);
    sessionStorage.setItem("studentlogin", "true");
    sessionStorage.setItem("rollNo", rollNo);
  };

  const logout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem("studentlogin");
    sessionStorage.removeItem("rollNo");
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, logout, login }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);