// src/DeviceList.jsx
import { useEffect, useState } from "react";
import { auth } from "./firebaseConfig";

function DeviceList({ tenantId, onBack }) {
  const [devices, setDevices] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`https://iot-platform-multitenant-production.up.railway.app/devices/${tenantId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          setDevices(data.devices);
        } else {
          setMessage(`❌ Error: ${data.detail || "No se pudieron obtener los dispositivos."}`);
        }
      } catch (err) {
        setMessage(`⚠️ ${err.message}`);
      }
    };

    fetchDevices();
  }, [tenantId]);

  return (
    <div style={{ marginTop: "2rem" }}>
      <button onClick={onBack}>🔙 Volver</button>
      <h3>📡 Dispositivos Registrados</h3>
      {message && <p>{message}</p>}
      <ul>
        {devices.map((device) => (
          <li key={device.id} style={{ marginBottom: "1rem" }}>
            <strong>{device.name}</strong> ({device.type}) - {device.status === "active" ? "✅ Activo" : "⚠️ Inactivo"} <br />
            🆔 DevEUI: <code>{device.dev_eui || "N/D"}</code> <br />
            📍 Ubicación: {device.location || "No definida"} <br />
            🕒 Creado: {device.created_at ? new Date(device.created_at).toLocaleString() : "N/A"}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DeviceList;
