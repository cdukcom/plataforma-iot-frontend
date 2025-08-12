//src/pages/Login.jsx
import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import axios from "axios";
import logo from "../assets/faciliotlogo.png";

// Normaliza el plan a los códigos que espera el backend
const normalizePlan = (p) => {
  if (!p) return "trial";
  const s = String(p).toLowerCase().trim();
  if (["trial","basic","pro","corporate"].includes(s)) return s;
  // soporta etiquetas antiguas guardadas en localStorage
  if (s.includes("prueba")) return "trial";
  if (s.includes("básico") || s.includes("basico")) return "basic";
  if (s === "pro") return "pro";
  if (s.includes("corporativo")) return "corporate";
  return "trial";
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(
    location.state?.justRegistered
      ? "📩 Te enviamos un correo de verificación. Revisa tu bandeja de entrada o SPAM (puede tardar)."
      : ""
  );
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
      
      // Refrescar estado y validar verificación
      await user.reload();

      if (!user.emailVerified) {
        setNeedsVerification(true);
        setMessage("⚠️ Tu correo aún no está verificado. Revisa tu correo o reenvía la verificación.");
        setLoading(false);
        return;
      } 
      
      // ✅ Ya verificado: obtener token y registrar en Mongo si falta
      const idToken = await user.getIdToken(true);
      const plan = normalizePlan(localStorage.getItem("selectedPlan"));
      // opcional: migra a código para futuras sesiones
      localStorage.setItem("selectedPlan", plan);
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/usuarios`,
          { email: user.email, plan },
          { headers: { Authorization: `Bearer ${idToken}` } }
        );
      } catch (err) {
        if (err.response && (err.response.status === 409 || err.response.status === 400)) {
          console.warn("Usuario ya existía en Mongo, continuamos");
        } else {
          throw err;
        }   
      }

      setMessage("✅ Bienvenido. Redirigiendo al panel…");
      setNeedsVerification(false);
      setTimeout(() => navigate("/dashboard"), 600);
    } catch (err) {
      console.error(err);
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    // Debe estar logueado para reenviar
    if (!auth.currentUser) {
      setMessage("🔐 Primero ingresa tu correo y contraseña y presiona Ingresar.");
      return;
    }
    if (email.trim() && auth.currentUser.email && auth.currentUser.email !== email.trim()) {
      setMessage(`⚠️ Estás logueado como ${auth.currentUser.email}. Cierra sesión para reenviar a ${email.trim()}.`);
      return;
    }

    try {
      setResending(true);
      await sendEmailVerification(auth.currentUser, { url: "https://app.duke-villa.com/verified" });
      setMessage("📨 Te reenviamos el correo de verificación, revisa tu carpeta de SPAM o no-deseados. Puede tardar algunos minutos.");
    } catch (err) {
      console.error(err);
      setMessage(`❌ No se pudo reenviar el correo: ${err.message}`);
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setNeedsVerification(false);
    setMessage("Sesión cerrada. Puedes iniciar con otro correo.");
  };

return (
    <div>
      <div style={{ maxWidth: 420, margin: "auto", padding: 20 }}>
      <img src={logo} alt="Fácil IoT" style={{ width: "150px", marginBottom: "1rem" }} />
      <h2>Iniciar Sesión</h2>


      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />
        <button type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}

      {/* Acciones si el correo no está verificado */}
        {needsVerification && (
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            <button onClick={resendVerification} disabled={resending} style={{ width: "100%" }}>
              {resending ? "Reenviando..." : "Reenviar correo de verificación"}
            </button>
            <button onClick={handleSignOut} style={{ width: "100%" }}>
              Cerrar sesión / Cambiar correo
            </button>
          </div>
        )}

        <p style={{ marginTop: 10 }}>
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;