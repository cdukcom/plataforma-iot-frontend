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

{alerts.map((alert) => (
  <li key={alert.id} style={{ marginBottom: "1rem" }}>
    <strong>{alert.status === "open" ? "🟥 Abierta" : "✅ Cerrada"}</strong><br />
    Dispositivo: {alert.device_id} <br />
    Fecha: {new Date(alert.timestamp).toLocaleString()} <br />
    Mensaje: {alert.message || "Sin mensaje"} <br />
    Ubicación: {alert.location ? `${alert.location.lat}, ${alert.location.lng}` : "N/A"} <br />

    {alert.status === "open" && (
      <button
        onClick={async () => {
          try {
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(`https://iot-platform-multitenant-production.up.railway.app/alerts/${alert.id}/close`, {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (res.ok) {
              setAlerts((prev) =>
                prev.map((a) =>
                  a.id === alert.id ? { ...a, status: "closed" } : a
                )
              );
            }
          } catch (e) {
            console.error("Error cerrando alerta:", e);
          }
        }}
        style={{ marginTop: "0.5rem", backgroundColor: "#2196f3", color: "white", padding: "0.3rem", border: "none", borderRadius: "4px" }}
      >
        ✅ Cerrar alerta
      </button>
    )}
  </li>
))}

export default AlertsList;
