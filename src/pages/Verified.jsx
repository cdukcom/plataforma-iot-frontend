// src/pages/Verified.jsx
import { useEffect, useState } from "react";
import { auth } from "../firebaseConfig";
import { sendEmailVerification } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";

const normalizePlan = (p) => {
    if (!p) return "trial";
    const s = String(p).toLowerCase().trim();
    if (["trial","basic","pro","corporate"].includes(s)) return s;
    if (s.includes("prueba")) return "trial";
    if (s.includes("básico") || s.includes("basico")) return "basic";
    if (s === "pro") return "pro";
    if (s.includes("corporativo")) return "corporate";
    return "trial";
  };

export default function Verified() {
  const [msg, setMsg] = useState("Revisa tu correo y haz clic en el enlace de verificación.");
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  // Si el deep link venía con ?plan=, lo guardamos (por si se limpió el storage)
  useEffect(() => {
    const url = new URL(window.location.href);
    const planFromUrl = url.searchParams.get("plan");
    if (planFromUrl) {
      localStorage.setItem("selectedPlan", normalizePlan(planFromUrl));
    }
  }, []);

  // Mensaje inicial si no hay sesión
  useEffect(() => {
    if (!auth.currentUser) {
      setMsg("🔐 No hay sesión activa. Inicia sesión y vuelve a esta página.");
    }
  }, []);

  // ⬅️ Autoredirect: si ya está verificado, salta a destino
  useEffect(() => {
    const u = auth.currentUser;
    (async () => {
      if (!u) return;
      try { await u.reload(); } catch {}
      if (u.emailVerified) navigate(from, { replace: true });
    })();
  }, [from, navigate]);

  // ⬅️ Temporizador del cooldown
  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleCheck = async () => {
    const u = auth.currentUser;
    if (!u) {
      setMsg("🔐 Inicia sesión para continuar.");
      return;
    }
    setMsg("");
    setChecking(true);
    try {
      await u.reload(); // fuerza refresco de emailVerified
      if (u.emailVerified) {
        // Ya verificado → volvemos a donde iba (Login hará el alta en Mongo si aplica)
        navigate(from, { replace: true });
      } else {
        setMsg("Aún no aparece verificado. Espera 1–2 minutos y vuelve a intentar.");
      }
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    const u = auth.currentUser;
    if (!u) {
      setMsg("🔐 Inicia sesión para reenviar el correo.");
      return;
    }
    if (cooldown > 0) return;
    setMsg("");
    setResending(true);
    try {
      const plan = normalizePlan(localStorage.getItem("selectedPlan"));
      await sendEmailVerification(u, {
       url: `https://app.duke-villa.com/verified?plan=${encodeURIComponent(plan)}`,
        handleCodeInApp: true,
      });
      setMsg("📨 Reenviado. Revisa bandeja de entrada y SPAM (puede tardar).");
      setCooldown(30);
    } catch (e) {
      console.error(e);
      setMsg("❌ No se pudo reenviar el correo. Intenta más tarde.");
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (e) {
      console.error(e);
    }
  };

  const Btn = (p) => (
    <button
      {...p}
      style={{
        width: "100%",
        height: 40,
        marginTop: 8,
        cursor: p.disabled ? "not-allowed" : "pointer",
      }}
    />
  );

  return (
    <div style={{ maxWidth: 420, margin: "auto", padding: 20 }}>
      <h2>Verifica tu correo</h2>
      <p style={{ margin: "8px 0 12px" }}>{msg}</p>

      <Btn onClick={handleCheck} disabled={checking}>
        {checking ? "Comprobando..." : "Ya verifiqué, continuar"}
      </Btn>

      <Btn onClick={handleResend} disabled={resending || cooldown > 0}>
        {resending ? "Reenviando..." : (cooldown > 0 ? `Reenviar (${cooldown}s)` : "Reenviar correo de verificación")}
      </Btn>

      <Btn onClick={handleLogout}>Cambiar correo / Cerrar sesión</Btn>
    </div>
  );
}