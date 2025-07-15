// src/RegisterDevice.jsx
import { useEffect, useState } from "react";
import { auth } from "./firebaseConfig";

function RegisterDevice({ tenantId, onBack }) {
  const [devEui, setDevEui] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("gateway");
  const [status, setStatus] = useState("active");
  const [location, setLocation] = useState("");
  const [gatewayId, setGatewayId] = useState("");
  const [gateways, setGateways] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchGateways = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`https://iot-platform-multitenant-production.up.railway.app/devices/${tenantId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          const filtered = data.devices.filter((d) => d.type === "gateway");
          console.log("📡 Gateways cargados:", filtered);
          setGateways(filtered);
        }
      } catch (err) {
        console.error("Error al obtener gateways:", err.message);
      }
    };

    if (type === "panic_button") {
      fetchGateways();
    }
  }, [type, tenantId]);

  const isValidDevEui = (eui) => /^[0-9a-fA-F]{16}$/.test(eui);
  const handleSubmit = async () => {
    if (!devEui.trim() || !name.trim() || !location.trim()) {
       setMessage("⚠️ Todos los campos son obligatorios.");
       return;
    }

    if (!isValidDevEui(devEui.trim())) {
       setMessage("⚠️ El DevEUI debe tener exactamente 16 caracteres hexadecimales (0-9, a-f).");
       return;
    }
    
    if (type === "panic_button" && !gatewayId) {
      setMessage("⚠️ Debes seleccionar un gateway para crear un sensor.");
      return;
    }

    const payload = {
      tenant_id: tenantId,
      dev_eui: devEui.trim(),
      name: name.trim(),
      type,
      status,
      location: location.trim(),
      gateway_id: type === "panic_button" ? gatewayId : undefined,
    };

    console.log("🚀 Payload enviado:", payload);

    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("https://iot-platform-multitenant-production.up.railway.app/devices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("📥 Respuesta del backend:", data);

      if (res.ok) {
        setMessage("✅ Dispositivo registrado correctamente.");
        setDevEui("");
        setName("");
        setLocation("");
        setGatewayId("");
        setTimeout(() => {
        onBack();
        }, 1000);

      } else {
        setMessage(`❌ Error: ${data.detail || "No se pudo registrar el dispositivo."}`);
      }
    } catch (err) {
      setMessage(`⚠️ Error de red: ${err.message}`);
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <button onClick={onBack}>🔙 Volver</button>
      <h3>➕ Registrar nuevo dispositivo</h3>
      
      <input type="text" placeholder="DevEUI (ej. ac233fff12...)" value={devEui} onChange={(e) => setDevEui(e.target.value)} style={{ width: "100%", marginBottom: "0.5rem" }} />
      <input type="text" placeholder="Nombre del dispositivo" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", marginBottom: "0.5rem" }} />
      
      <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "100%", marginBottom: "0.5rem" }}>
        <option value="gateway">Gateway</option>
        <option value="panic_button">Botón de Pánico</option>
      </select>

      {type === "panic_button" && (
        gateways.length > 0 ? (
          <select value={gatewayId} onChange={(e) => {console.log("🎯 Gateway seleccionado (ID):", e.target.value); setGatewayId(e.target.value)}} style={{ width: "100%", marginBottom: "0.5rem" }}>
            <option value="">Selecciona un gateway...</option>
            {gateways.map((gw) => (
               <option key={gw._id} value={gw._id}>{gw.name}</option>
            ))}
          </select>
        ) : (
          <p style={{ color: "red" }}>⚠️ No hay gateways disponibles. Registra uno primero.</p>
        )
      )}

      <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: "100%", marginBottom: "0.5rem" }}>
        <option value="active">Activo</option>
        <option value="inactive">Inactivo</option>
      </select>

      <input type="text" placeholder="Ubicación (ej. Calle 123 #45-67)" value={location} onChange={(e) => setLocation(e.target.value)} style={{ width: "100%", marginBottom: "1rem" }} />

      <button onClick={handleSubmit} style={{ padding: "0.5rem 1rem" }}>Registrar</button>
      {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
    </div>
  );
}

export default RegisterDevice;
