import { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, getIdToken } from "firebase/auth";
import { auth } from "../firebaseConfig";
import axios from "axios";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState("Prueba 30 días");
  const [message, setMessage] = useState("");

  const handleRegister = async () => {
    try {
      // 1. Registro en Firebase
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(user);
      setMessage("📩 Verifica tu correo electrónico antes de continuar.");

      // 2. Espera hasta que el usuario verifique su email
      await auth.currentUser.reload();
      if (!auth.currentUser.emailVerified) return;

      // 3. Obtiene el token de Firebase
      const idToken = await getIdToken(auth.currentUser);

      // 4. Envia al backend
      const payload = {
        email: email.trim(),
        plan: plan,
      };

      await axios.post(`${import.meta.env.VITE_API_URL}/usuarios`, payload, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      setMessage("✅ Registro exitoso. Ya puedes iniciar sesión.");
    } catch (error) {
      console.error("❌ Error en el registro:", error.message);
      setMessage(`❌ ${error.message}`);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Registro de Usuario</h2>
      <input
        type="email"
        placeholder="Correo electrónico"
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
      <select
        value={plan}
        onChange={(e) => setPlan(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      >
        <option>Prueba 30 días</option>
        <option>Básico</option>
        <option>PRO</option>
        <option>Corporativo</option>
      </select>
      <button onClick={handleRegister} style={{ width: "100%" }}>
        Registrarse
      </button>
      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  );
}

export default Register;
