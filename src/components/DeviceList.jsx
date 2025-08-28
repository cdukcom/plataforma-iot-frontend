// src/components/DeviceList.jsx
import { useEffect, useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;

export default function DeviceList({ tenantId, token, onBack, onError }) {
  const [devices, setDevices] = useState([]);
  const [gatewaysMap, setGatewaysMap] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    const ctrl = new AbortController();

    (async () => {
      try {
        const res = await fetch(`${API_URL}/devices/${tenantId}`, {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: ctrl.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const detail = data?.detail || `Error ${res.status}`;
          throw new Error(detail);
        }

        const list = Array.isArray(data) ? data : (data.devices || []);
        setDevices(list);

        // Mapear gateways por id → nombre
        const gwMap = {};
        list.filter((d) => d.type === "gateway").forEach((gw) => {
          gwMap[(gw.id || gw._id)] = gw.name || gw.nombre || "Gateway";
        });
        setGatewaysMap(gwMap);
        setMessage("");
      } catch (e) {
        if (e.name === "AbortError") return;
        console.error(e);
        const friendly = e.message || "No se pudieron obtener los dispositivos.";
        setMessage(`⚠️ ${friendly}`);
        onError?.(friendly);
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [tenantId, token]);

  const handleDelete = async (device) => {
    const isGateway = (device.type || "").toLowerCase() === "gateway";
    const devEui = (device.dev_eui || "").trim().toUpperCase();
    const deviceId = device.id || device._id;
    
    // Log temporal para validar rama (lo quitamos luego)
    console.log("[DeviceList] delete pressed", { isGateway, devEui, deviceId });
    

    
    if (!deviceId) return setMessage("❌ Dispositivo inválido.");

    const confirm1 = window.confirm(`¿Eliminar "${device.name || device.nombre}"?`);
    if (!confirm1) return;
    const confirm2 = window.confirm("⚠️ Esta acción es irreversible. ¿Deseas continuar?");
    if (!confirm2) return;

    try {
      let res;
      if (isGateway) {
        // BORRADO GATEWAY (ChirpStack + Mongo)
        if (!devEui || devEui.length !== 16 || /[^0-9A-F]/.test(devEui)) {
          throw new Error("DevEUI inválido para gateway.");
        }
        res = await fetch(
          `${API_URL}/gateways/${devEui}?tenant_id=${tenantId}&confirm=true`,
          { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
      } else {
        // BORRADO SENSOR (solo Mongo)
        res = await fetch(
          `${API_URL}/devices/${deviceId}?confirm=true`,
          { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
      }

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = result?.detail || `Error ${res.status}`;
        throw new Error(detail);
      }
      setDevices((prev) => prev.filter((d) => (d.id || d._id) !== deviceId));
      setMessage("✅ Dispositivo eliminado correctamente.");
      onError?.(""); // limpiar banner arriba si lo usas como tal
    } catch (e) {
      console.error(e);
      const friendly = e.message || "No se pudo eliminar el dispositivo.";
      setMessage(`❌ ${friendly}`);
      onError?.(friendly);
    }
  };

  if (loading) {
    return (
      <div style={{ marginTop: "2rem" }}>
        <button onClick={onBack}>🔙 Volver</button>
        <p>Cargando dispositivos…</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "2rem" }}>
      <button onClick={() => { setMessage(""); onBack?.(); }}>🔙 Volver</button>
      <h3>📡 Dispositivos Registrados</h3>
      {message && <p style={{ color: message.startsWith("✅") ? "green" : "#b00020" }}>{message}</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {devices.map((device) => {
          const id = device.id || device._id;
          const isGateway = device.type === "gateway";
          const name = device.name || device.nombre || "Dispositivo";
          const createdAt = device.created_at || device.createdAt;

          const children = devices.filter((d) => (d.gateway_id || d.gatewayId) === id);
          const hasChildren = children.length > 0;

          return (
            <li key={`device-${id}`} style={{ marginBottom: "1rem", borderBottom: "1px solid #eee", paddingBottom: "0.75rem" }}>
              <strong>{isGateway ? "🖧 " : "📣 "}{name}</strong>{" "}
              ({isGateway ? "Gateway" : "Botón de Pánico"})<br />
              {device.dev_eui && <>🆔 DevEUI: <code>{device.dev_eui}</code><br /></>}
              ✅ Estado: {device.status || "N/A"}<br />
              📍 Ubicación: {device.location || "No definida"}<br />
              📅 Creado: {createdAt ? new Date(createdAt).toLocaleString() : "N/A"}<br />
              {!isGateway && (
                <span>
                  Gateway asociado: <strong>{gatewaysMap[device.gateway_id || device.gatewayId] || "No encontrado"}</strong>
                </span>
              )}

              {/* Eliminar si no tiene hijos o no es gateway */}
              {(!isGateway || !hasChildren) && (
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => handleDelete(device)} style={{ color: "red" }}>
                    🗑️ Eliminar
                  </button>
                </div>
              )}

              {/* Mensaje si gateway tiene sensores */}
              {isGateway && hasChildren && (
                <p style={{ color: "gray", fontStyle: "italic", marginTop: 6 }}>
                  ⚠️ Este gateway tiene sensores asociados. Elimínalos primero.
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {devices.length === 0 && <p>No hay dispositivos registrados.</p>}
    </div>
  );
}