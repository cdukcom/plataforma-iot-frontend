// src/LogoutButton.jsx
import { auth } from "./firebaseConfig";

function LogoutButton() {
  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.href = "/"; // o puedes usar React Router si lo estás usando
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <button onClick={handleLogout} style={{ marginTop: "1rem", backgroundColor: "#f44336", color: "white", padding: "0.5rem", borderRadius: "5px", border: "none" }}>
      🔓 Cerrar sesión
    </button>
  );
}

export default LogoutButton;
