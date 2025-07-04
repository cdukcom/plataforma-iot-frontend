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
        {devices.map((device) => {
          const isGateway = device.type === "gateway";
          const children = devices.filter((d) => d.gateway_id === device.id);
          const hasChildren = children.length > 0;

          return (
            <li key={`device-${device.id}`} style={{ marginBottom: "1rem" }}>
              <strong>
                {isGateway ? "🖧 " : "📣 "}
                {device.name}
              </strong>{" "}
              ({isGateway ? "Gateway" : "Botón de Pánico"})<br />
              🆔 DevEUI: <code>{device.dev_eui}</code><br />
              ✅ Estado: {device.status}<br />
              📍 Ubicación: {device.location || "No definida"}<br />
              📅 Creado: {device.created_at ? new Date(device.created_at).toLocaleString() : "N/A"}<br />
              {!isGateway && (
                <span>
                  Gateway asociado:{" "}
                  <strong>{gatewaysMap[device.gateway_id] || "No encontrado"}</strong>
               </span>
              )}

              {/* Eliminar si no tiene hijos o no es gateway */}
              {(!isGateway || !hasChildren) && (
                <button
                  onClick={async () => {
                    const confirm1 = window.confirm(
                      `¿Estás seguro de que deseas eliminar el dispositivo "${device.name}"?`
                    );
                    if (!confirm1) return;

                    const confirm2 = window.confirm(
                      "⚠️ Esta acción es irreversible. ¿Deseas continuar?"
                    );
                    if (!confirm2) return;

                    try {
                      const token = await auth.currentUser.getIdToken();
                      const res = await fetch(
                        `https://iot-platform-multitenant-production.up.railway.app/devices/${device.id}?confirm=true`,
                        {
                          method: "DELETE",
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        }
                      );
                      const result = await res.json();
                      if (res.ok) {
                        alert("✅ Dispositivo eliminado correctamente");
                        setDevices((prev) => prev.filter((d) => d.id !== device.id));
                      } else {
                        alert(`❌ Error: ${result.detail || "No se pudo eliminar el dispositivo."}`);
                      }
                    } catch (err) {
                      alert(`⚠️ Error inesperado: ${err.message}`);
                    }
                  }}
                  style={{ marginTop: "0.5rem", color: "red" }}
                >
                  🗑️ Eliminar
                </button>
              )}

              {/* Mensaje si gateway tiene sensores */}
              {isGateway && hasChildren && (
                <p style={{ color: "gray", fontStyle: "italic" }}>
                  ⚠️ Este gateway tiene sensores asociados. Elimínalos primero.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default DeviceList;
