// src/Dashboard.jsx
import { useEffect, useState } from "react";
import ChirpstackTestButton from "./ChirpstackTestButton";
import { auth } from "./firebaseConfig";
import CreateTenant from "./CreateTenant";
import ListTenants from "./ListTenants";
import LogoutButton from "./LogoutButton";
import RegisterDevice from "./RegisterDevice";
import DeviceList from "./DeviceList";



function Dashboard() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("menu");
  const [selectedTenant, setSelectedTenant] = useState(null);

  useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
    if (currentUser) {
      const token = await currentUser.getIdToken();
      currentUser.accessToken = token;
      setUser(currentUser);
    } else {
      setUser(null);
    }
  });
  return () => unsubscribe();
}, []);

  if (!user) {
    return <p>🔐 Acceso restringido. Por favor inicia sesión.</p>;
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h2>🌐 Bienvenido a Facil IoT - IoT para todos</h2>
      {selectedTenant && user?.accessToken && (
        <ChirpstackTestButton
        tenantId={selectedTenant.id}
        token={user.accessToken}
       />
      )}
      <p>Usuario autenticado: <strong>{user.email}</strong></p>
      <p>UID: <code>{user.uid}</code></p>

    {view === "register" && selectedTenant ? (
      <RegisterDevice tenantId={selectedTenant.id} onBack={() => setView("menu")} />
    ) : view === "devices" && selectedTenant ? (
      <DeviceList tenantId={selectedTenant.id} onBack={() => setView("menu")} />
    ) : view === "menu" && selectedTenant ? (
      <>
        <h3>📋 Opciones para la comunidad: <strong>{selectedTenant.name}</strong></h3>
        <button onClick={() => setView("register")}>➕ Registrar Dispositivo</button>
        <button onClick={() => setView("devices")}>📡 Ver Dispositivos</button>
        <button onClick={() => setSelectedTenant(null)}>🔙 Cambiar comunidad</button>
      </>
    ) : (
      <>
        <h3>🏘️ Selecciona una comunidad</h3>
        <ListTenants onSelect={(tenant) => {
          setSelectedTenant(tenant);
          setView("menu");
        }} />
     </>
    )}

      <hr style={{ margin: "2rem 0" }} />
      <CreateTenant />
      <LogoutButton />
    </div>
  );
    
}

export default Dashboard;