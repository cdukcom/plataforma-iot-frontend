// src/AlertsList.jsx
import { useEffect, useState } from "react";
import { auth } from "./firebaseConfig";

function AlertsList({ tenantId, onBack }) {
  const [alerts, setAlerts] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`https://iot-platform-multitenant-production.up.railway.app/alerts/${tenantId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          setAlerts(data.alerts);
        } else {
          setMessage(`❌ Error: ${data.detail || "No se pudieron obtener las alertas."}`);
        }
      } catch (err) {
        setMessage(`⚠️ ${err.message}`);
      }
    };

    fetchAlerts();
  }, [tenantId]);

  return (
    <div style={{ marginTop: "2rem" }}>
      <button onClick={onBack}>🔙 Volver</button>
      <h3>🚨 Alertas para esta comunidad</h3>
      {message && <p>{message}</p>}
      <ul>
        {alerts.map((alert) => (
          <li key={alert.id} style={{ marginBottom: "1rem" }}>
            <strong>{alert.status === "open" ? "🟥 Abierta" : "✅ Cerrada"}</strong><br />
            Dispositivo: {alert.device_id} <br />
            Fecha: {new Date(alert.timestamp).toLocaleString()} <br />
            Mensaje: {alert.message || "Sin mensaje"} <br />
            Ubicación: {alert.location ? `${alert.location.lat}, ${alert.location.lng}` : "N/A"}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AlertsList;
