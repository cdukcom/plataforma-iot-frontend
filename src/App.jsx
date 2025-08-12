// src/App.jsx
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import Verified from "./pages/Verified";

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true); // Para evitar parpadeos

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try { await user.reload(); } catch (_) {}
      }
      setIsAuth(!!user);
      setIsVerified(!!user?.emailVerified);
      setLoading(false);
    });
    return () => unsub(); // Cleanup
  }, []);
  
  if (loading) return <p style={{ padding: 24 }}>Cargando…</p>;

  return (
    <Router>
      <div style={{ padding: "2rem", fontFamily: "Arial" }}>
        <h1>Facil IoT - IoT para todos</h1>
        <Routes>
          {/* Públicas (redirigen si ya estás logueado) */}
          <Route
            path="/login"
            element={
              <PublicOnly isAuth={isAuth} isVerified={isVerified}>
                <Login />
              </PublicOnly>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnly isAuth={isAuth} isVerified={isVerified}>
                <Register />
              </PublicOnly>
            }
          />

          {/* Intermedia: accesible logueado aunque no verificado */}
          <Route
            path="/verified"
            element={
              <RequireAuth allowUnverified isAuth={isAuth} isVerified={isVerified}>
                <Verified />
              </RequireAuth>
            }
          />

          {/* Protegidas: requieren login + verificado */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth isAuth={isAuth} isVerified={isVerified}>
                <Dashboard />
              </RequireAuth>
            }
          />

          {/* Default */}
          <Route path="*" element={<Navigate to={isAuth ? (isVerified ? "/dashboard" : "/verified") : "/login"} />} />
        </Routes>
      </div>
    </Router>   
  );
}

/* --------- Helpers de rutas --------- */

function RequireAuth({ children, isAuth, isVerified, allowUnverified = false }) {
  const location = useLocation();
  if (!isAuth) {
    // Guarda hacia dónde quería ir
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!allowUnverified && !isVerified) {
    return <Navigate to="/verified" replace state={{ from: location }} />;
  }
  return children;
}

function PublicOnly({ children, isAuth, isVerified }) {
  if (isAuth) {
    return <Navigate to={isVerified ? "/dashboard" : "/verified"} replace />;
  }
  return children;
}


export default App;

