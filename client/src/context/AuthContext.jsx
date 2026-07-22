import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("tf_token");
    const cachedUser = localStorage.getItem("tf_user");
    if (token && cachedUser) {
      setUser(JSON.parse(cachedUser));
      api
        .get("/auth/me")
        .then((res) => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem("tf_token");
          localStorage.removeItem("tf_user");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function persist(token, user) {
    localStorage.setItem("tf_token", token);
    localStorage.setItem("tf_user", JSON.stringify(user));
    setUser(user);
  }

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    if (res.data.twoFactorRequired) {
      // Caller (Login.jsx) needs to collect a TOTP code and call
      // verifyTwoFactor(twoFactorToken, code) to actually finish logging in.
      return { twoFactorRequired: true, twoFactorToken: res.data.twoFactorToken };
    }
    persist(res.data.token, res.data.user);
    return res.data.user;
  }

  async function verifyTwoFactor(twoFactorToken, code) {
    const res = await api.post("/auth/2fa/verify-login", { twoFactorToken, code });
    persist(res.data.token, res.data.user);
    return res.data.user;
  }

  async function signup(payload) {
    const res = await api.post("/auth/register", payload);
    persist(res.data.token, res.data.user);
    return res.data.user;
  }

  function logout() {
    api.post("/auth/logout").catch(() => {}); // revoke the refresh token + clear its cookie server-side; fire-and-forget
    localStorage.removeItem("tf_token");
    localStorage.removeItem("tf_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyTwoFactor, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
