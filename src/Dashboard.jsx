// src/Dashboard.jsx
import { useEffect, useState } from "react";
import { auth } from "./firebaseConfig";
import CreateTenant from "./CreateTenant";
import ListTenants from "./ListTenants";
import LogoutButton from "./LogoutButton";

function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsub(); // Cleanup
  }, []);

  if (!user) {
    return <p>🔐 Acceso restringido. Por favor inicia sesión.</p>;
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h2>🌐 Bienvenido al Dashboard</h2>
      <p>Usuario autenticado: <strong>{user.email}</strong></p>
      <p>UID: <code>{user.uid}</code></p>

      {/* Aquí puedes ir agregando componentes: 
          - Lista de dispositivos
          - Crear comunidad
          - Ver logs
          - Registro de alertas
      */}

      <LogoutButton />  {/* 🔓 Aquí agregamos el botón de cerrar sesión */}

      <CreateTenant />
      <ListTenants />

    </div>
  );
}

export default Dashboard;
