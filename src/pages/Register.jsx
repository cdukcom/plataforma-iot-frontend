// src/pages/Register.jsx
import { useState, useMemo } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { Link, useNavigate } from "react-router-dom";

// --- Render helpers ---
  const Input = (props) => (
    <input {...props} style={{ width: "100%", marginBottom: 6, ...(props.style || {}) }} />
  );
  
  const FieldError = ({ text }) => (
    <div style={{ color: "#b00020", fontSize: 13, minHeight: 16, marginBottom: 8 }}>
      {text || ""}
    </div>
  );

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

function Register() {
  const navigate = useNavigate();

  // --- Estado del formulario ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [plan, setPlan] = useState("trial");

  // --- Estado de UI ---
  const [message, setMessage] = useState(""); // Mensaje general (arriba/abajo)
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);      // Ojito contraseña
  const [showConfirm, setShowConfirm] = useState(false); // Ojito confirmación
  
  // --- Validadores ---
  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const validatePassword = (pwd) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(pwd);

  // --- Errores por campo (reactivos) ---
  const { emailError, passwordError, confirmError, formInvalid } = useMemo(() => {
    const e = email.trim();
    const emailError = e === "" ? "El correo es obligatorio." : (!validateEmail(e) ? "Ingresa un correo válido." : "");
    const passwordError =
      password === ""
        ? "La contraseña es obligatoria."
        : (!validatePassword(password)
            ? "Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo."
            : "");
    const confirmError =
      confirmPassword === ""
        ? "Confirma tu contraseña."
        : (password !== confirmPassword ? "Las contraseñas no coinciden." : "");
    const formInvalid = !!(emailError || passwordError || confirmError);
    return { emailError, passwordError, confirmError, formInvalid };
  }, [email, password, confirmPassword]);

  // --- Submit handler ---
  const handleRegister = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // Mensaje claro si hay errores visibles
    if (formInvalid) {
      const firstErr = emailError || passwordError || confirmError;
      setMessage(`❌ ${firstErr}`);
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const cleanEmail = email.trim().toLowerCase();
      localStorage.setItem("selectedPlan", normalizePlan(plan));

      // 1) Crear cuenta en Firebase
      const { user } = await createUserWithEmailAndPassword(auth, cleanEmail, password);

      // 2) Enviar verificación
      const actionCodeSettings = {
        url: `https://app.duke-villa.com/verified?plan=${encodeURIComponent(plan)}`,
        handleCodeInApp: true,
      };
      await sendEmailVerification(user, actionCodeSettings);

      // 3) Cerrar sesión para evitar sesión no verificada
      try { await signOut(auth); } catch {}

      // 4) Avisar y redirigir
      setMessage("📩 Te enviamos un correo de verificación. Puede tardar algunos minutos. Revisa SPAM.");
      setTimeout(() => navigate("/login", { state: { justRegistered: true } }), 1200);

    } catch (err) {
      console.error(err);
      const map = {
        "auth/email-already-in-use": "Este correo ya está registrado. Intenta iniciar sesión.",
        "auth/invalid-email": "Correo inválido.",
        "auth/operation-not-allowed": "El registro por email está deshabilitado.",
        "auth/weak-password": "La contraseña es demasiado débil.",
        "auth/network-request-failed": "Problema de red. Verifica tu conexión.",
      };
      const friendly = map[err?.code] || err.message || "Error inesperado.";
      setMessage(`❌ ${friendly}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Registro de Usuario</h2>

      <p style={{ marginTop: 8, marginBottom: 12, minHeight: 20 }}>{message}</p>
      <form onSubmit={handleRegister} noValidate>
        {/* Email */}
        <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>Correo electrónico</label>
        <Input
          type="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setMessage(""); }}
          autoComplete="email"
          required
        />
        <FieldError text={emailError} />

        {/* Password con ojito */}
        <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>Contraseña</label>
        <div style={{ position: "relative", marginBottom: 6 }}>
          <Input
            type={showPwd ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {setPassword(e.target.value); setMessage(""); }}
            autoComplete="new-password"
            style={{ paddingRight: 46 }}
            required
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
            title={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
            style={{
              position: "absolute",
              right: 6,
              top: 4,
              height: 32,
              border: "1px solid #ccc",
              padding: "0 8px",
              background: "white",
              cursor: "pointer"
            }}
          >
            {showPwd ? "🙈" : "👁️"}
          </button>
        </div>
        <FieldError text={passwordError} />

        {/* Confirm Password con ojito */}
        <label style={{ display: "block", fontSize: 14, marginBottom: 4 }}>Confirmar contraseña</label>
        <div style={{ position: "relative", marginBottom: 6 }}>
          <Input
            type={showConfirm ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => {setConfirmPassword(e.target.value); setMessage(""); }}
            autoComplete="new-password"
            style={{ paddingRight: 46 }}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? "Ocultar confirmación" : "Mostrar confirmación"}
            title={showConfirm ? "Ocultar confirmación" : "Mostrar confirmación"}
            style={{
              position: "absolute",
              right: 6,
              top: 4,
              height: 32,
              border: "1px solid #ccc",
              padding: "0 8px",
              background: "white",
              cursor: "pointer"
            }}
          >
            {showConfirm ? "🙈" : "👁️"}
          </button>
        </div>
        <FieldError text={confirmError} />

        {/* Plan */}
        <label style={{ display: "block", fontSize: 14, margin: "8px 0 4px" }}>Plan</label>
        <select
          value={plan}
          onChange={(e) => {setPlan(e.target.value); setMessage(""); }}
          style={{ width: "100%", marginBottom: 12, height: 36 }}
        >
          <option value="trial">Prueba 30 días</option>
          <option value="basic">Básico</option>
          <option value="pro">PRO</option>
          <option value="corporate">Corporativo</option>
        </select>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || formInvalid}
          style={{ width: "100%", height: 40, cursor: submitting || formInvalid ? "not-allowed" : "pointer" }}
        >
          {submitting ? "Registrando..." : "Registrarse"}
        </button>
      </form>

      <p style={{ marginTop: 12 }}>
        ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link>
      </p>
    </div>
  );
}

export default Register;