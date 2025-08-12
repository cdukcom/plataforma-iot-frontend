// src/components/LogoutButton.jsx
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // Limpiar cualquier dato local
      localStorage.clear();
      sessionStorage.clear();

      // Redirigir al login
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        width: "100%",
        height: 40,
        marginTop: 8,
        backgroundColor: "#f44336",
        color: "white",
        borderRadius: 5,
        border: "none",
        cursor: "pointer",
      }}
    >
      🔓 Cerrar sesión
    </button>
  );
}