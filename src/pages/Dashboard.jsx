// src/Dashboard.jsx
import { useEffect, useState } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import ChirpstackTestButton from "../components/ChirpstackTestButton";
import CreateTenant from "./CreateTenant";
import ListTenants from "../components/ListTenants";
import LogoutButton from "../components/LogoutButton";
import RegisterDevice from "./RegisterDevice";
import DeviceList from "../components/DeviceList";

function Dashboard() {
  const [authUser, setAuthUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [view, setView] = useState("menu");
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantsVersion, setTenantsVersion] = useState(0);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Mantener user + token siempre actualizados
  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (u) => { 
      setAuthUser(u);
      if (u) {
        try {
          const t = await u.getIdToken(); // token fresco auto-rotado
          setIdToken(t);
        } catch (e) {
          console.error("No se pudo obtener idToken:", e);
          setIdToken(null);
        }
      } else {
        setIdToken(null);
      }
      setLoadingUser(false);
    });
    return () => unsub();
  }, []);

  const handleDeleteCommunity = async (tenantId) => {
    if (!authUser || !idToken) {
      setErrorMsg("Sesión inválida. Inicia sesión nuevamente.");
      return;
    }
    const confirmDelete = window.confirm("¿Estás seguro de que quieres eliminar esta comunidad?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tenants/${tenantId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.detail || "No se pudo eliminar la comunidad.");
      
      // éxito
      setErrorMsg(""); // limpia error

      // Si justo estás parado en ese tenant, vuelve al listado
      if (selectedTenant && (selectedTenant.id === tenantId || selectedTenant._id === tenantId)) {
        setSelectedTenant(null);
        setView("menu");
      }
      // Fuerza al ListTenants a recargar datos
      setTenantsVersion((v) => v + 1);
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || "Error al eliminar la comunidad");
    }
  };
  if (loadingUser) return <p style={{ padding: 16 }}>Cargando usuario…</p>;
  if (!authUser) return <p>🔐 Acceso restringido. Por favor inicia sesión.</p>;

  // Helper para obtener id del tenant (id o _id)
  const tenantId = selectedTenant ? (selectedTenant.id || selectedTenant._id) : null;
  const tenantName = selectedTenant?.name || selectedTenant?.nombre || "Comunidad";

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h2>🌐 Bienvenido a Facil IoT - IoT para todos</h2>
      
      {errorMsg && <p style={{ color: "#b00020" }}>{errorMsg}</p>}

      {/* Info de usuario */}
      <p>Usuario autenticado: <strong>{authUser.email}</strong></p>
      <p>UID: <code>{authUser.uid}</code></p>
   
      {/* Botón de prueba ChirpStack solo si hay tenant seleccionado y token */}
      {tenantId && idToken && (
        <ChirpstackTestButton tenantId={tenantId} token={idToken} />
      )}

    {/* Vistas según selección */}
    {view === "register" && tenantId ? (
        <RegisterDevice tenantId={tenantId} token={idToken} onBack={() => setView("menu")} />
    ) : view === "devices" && tenantId ? (
        <DeviceList tenantId={tenantId} token={idToken} onBack={() => setView("menu")} />
    ) : view === "menu" && tenantId ? (
      <>
        <h3>📋 Opciones para la comunidad: <strong>{tenantName}</strong></h3>
        <button onClick={() => setView("register")}>➕ Registrar Dispositivo</button>
        <button onClick={() => setView("devices")}>📡 Ver Dispositivos</button>
        <button onClick={() => setSelectedTenant(null)}>🔙 Cambiar comunidad</button>
      </>
    ) : (
      <>
        <h3>🏘️ Selecciona una comunidad</h3>
        <ListTenants
            key={tenantsVersion} // fuerza refetch cuando cambia
            token={idToken} // pasa el token
            onSelect={(tenant) => {
              setSelectedTenant(tenant);
              setView("menu");
              setErrorMsg("");
            }}
            onDelete={(tenant) => {
              const id = tenant?.id || tenant?._id;
              if (!id) return setErrorMsg("Tenant inválido.");
              handleDeleteCommunity(id);
            }}
            onError={(msg) => setErrorMsg(msg)}
        />
        
       {/* Crear nueva comunidad debajo del listado */}
          <div style={{ marginTop: 16 }}>
            <CreateTenant 
              token={idToken} 
              onCreated={() => {
                setTenantsVersion(v => v + 1);
                setErrorMsg("");
              }} 
              onError={(m)=>setErrorMsg(m)} 
            />
          </div>
        </>
      )}

      <hr style={{ margin: "2rem 0" }} />
      <LogoutButton />
    </div>
  );
    
}

export default Dashboard;