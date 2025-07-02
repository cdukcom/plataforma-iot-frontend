// src/DeviceList.jsx
import { useEffect, useState } from "react";
import { auth } from "./firebaseConfig";

function DeviceList({ tenantId, onBack }) {
  const [devices, setDevices] = useState([]);
  const [gatewaysMap, setGatewaysMap] = useState({});
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
          console.log("📦 Devices obtenidos:", data.devices);
          console.log("📦 Dispositivos detallados:");
          data.devices.forEach((d, i) => {
          console.log(`Dispositivo ${i + 1}:`, d);
          });
          // Crear mapa { gateway_id: name }
          const gwMap = {};
          data.devices
            .filter((d) => d.type === "gateway")
            .forEach((gw) => {
              gwMap[gw.id] = gw.name;
            });
          setGatewaysMap(gwMap);
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
          <li key={`device-${device.id}`} style={{ marginBottom: "1rem" }}>
            <strong>
              {device.type === "gateway" ? "🖧 " : "📣 "}
              {device.name}
            </strong> ({device.type === "gateway" ? "Gateway" : "Botón de Pánico"})<br />
            🆔 DevEUI: <code>{device.dev_eui}</code><br />
            ✅ Estado: {device.status}<br />
            📍 Ubicación: {device.location || "No definida"} <br />
            📅 Creado: {device.created_at ? new Date(device.created_at).toLocaleString() : "N/A"}<br />
            {device.type === "panic_button" && (
              <span>Gateway asociado: <strong>{gatewaysMap[device.gateway_id] || "No encontrado"}</strong></span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DeviceList;
