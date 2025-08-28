// src/pages/RegisterDevice.jsx
import { useEffect, useState } from "react";

export default function RegisterDevice({ tenantId, token, onBack, onError }) {
  const [devEui, setDevEui] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("gateway");
  const [status, setStatus] = useState("active");
  const [location, setLocation] = useState("");

  const [gateways, setGateways] = useState([]);
  const [gatewayId, setGatewayId] = useState("");
  const [loadingGateways, setLoadingGateways] = useState(false);

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isValidDevEui = (eui) => /^[0-9a-fA-F]{16}$/.test(eui?.trim() || "");

  // Cargar gateways cuando se elige "panic_button"
  useEffect(() => {
    if (type !== "panic_button" || !tenantId) return;
    const ctrl = new AbortController();

    (async () => {
      setLoadingGateways(true);
      setMessage("");
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/gateways?tenant_id=${tenantId}`,
          {
            method: "GET",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            signal: ctrl.signal,
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
           const detail = data?.detail || `Error ${res.status}`;
           throw new Error(detail);
        }
        const list = Array.isArray(data) ? data : (data.gateways || []);
        setGateways(list);
      } catch (e) {
        if (e.name === "AbortError") return;
        console.error(e);
        setGateways([]);
        const friendly = e.message || "No se pudieron cargar los gateways.";
        setMessage(`⚠️ ${friendly}`);
        onError?.(friendly);
      } finally {
        setLoadingGateways(false);
      }
    })();

    return () => ctrl.abort();
  }, [type, tenantId, token, onError]);

  const handleSubmit = async () => {
    const cleanDevEui = devEui.trim().toUpperCase();
    const cleanName = name.trim();
    const cleanLocation = location.trim();

    

    if (!cleanDevEui || !cleanName || !cleanLocation) {
      const msg = "⚠️ Todos los campos son obligatorios.";
      setMessage(msg);
      onError?.(msg);
      return;
    }

    if (!isValidDevEui(cleanDevEui)) {
      const msg = "⚠️ El DevEUI debe tener exactamente 16 caracteres hexadecimales (0-9, a-f).";
      setMessage(msg);
      onError?.(msg);
      return;
    }

    if (type === "panic_button" && !gatewayId) {
      const msg = "⚠️ Debes seleccionar un gateway para crear un sensor.";
      setMessage(msg);
      onError?.(msg);
      return;
    }

    const payload = {
      tenant_id: tenantId,
      dev_eui: cleanDevEui,
      name: cleanName,
      type,
      status,
      location: cleanLocation,
      ...(type === "panic_button" ? { gateway_id: gatewayId } : {}),
    };
    
    // NUEVO: routing por tipo
    const url =
      type === "gateway"
        ? `${import.meta.env.VITE_API_URL}/gateways`
        : `${import.meta.env.VITE_API_URL}/devices`;

    const body =
      type === "gateway"
        ? {
           tenant_id: tenantId,
           gateway_id: cleanDevEui, // backend espera gateway_id
           name: cleanName,
           description: "",
           tags: { model: "MG6" }, // opcional
           location: cleanLocation,
          }
        : payload;

    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch(url, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           ...(token ? { Authorization: `Bearer ${token}` } : {}),
         },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
         const detail = data?.detail || `Error ${res.status}`;
         throw new Error(detail);
       }

      setMessage("✅ Dispositivo registrado correctamente.");
      onError?.(""); // limpia banner si lo usas arriba
      
      // limpiar formulario
      setDevEui("");
      setName("");
      setLocation("");
      setGatewayId("");

      // volver al menú
      setTimeout(() => onBack?.(), 800);
    } catch (e) {
      console.error(e);
      const friendly = e.message || "No se pudo registrar el dispositivo.";
      setMessage(`❌ ${friendly}`);
      onError?.(friendly);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <button onClick={() => { setMessage(""); onBack?.(); }}>🔙 Volver</button>
      <h3>➕ Registrar nuevo dispositivo</h3>

      <input
        type="text"
        placeholder="DevEUI (16 hex, ej. ac233fff12abcd34)"
        value={devEui}
        onChange={(e) => { setDevEui(e.target.value); setMessage(""); }}
        style={{ width: "100%", marginBottom: "0.5rem" }}
      />

      <input
        type="text"
        placeholder="Nombre del dispositivo"
        value={name}
        onChange={(e) => { setName(e.target.value); setMessage(""); }}
        style={{ width: "100%", marginBottom: "0.5rem" }}
      />

      <select
        value={type}
        onChange={(e) => { setType(e.target.value); setMessage(""); }}
        style={{ width: "100%", marginBottom: "0.5rem" }}
      >
        <option value="gateway">Gateway</option>
        <option value="panic_button">Botón de Pánico</option>
      </select>

      {type === "panic_button" && (
        loadingGateways ? (
          <p>Cargando gateways…</p>
        ) : gateways.length > 0 ? (
          <select
            value={gatewayId}
            onChange={(e) => { setGatewayId(e.target.value); setMessage(""); }}
            style={{ width: "100%", marginBottom: "0.5rem" }}
          >
            <option value="">Selecciona un gateway…</option>
            {gateways.map((gw) => {
              const id = gw._id || gw.id || gw.gateway_id; // soporta ambos
              const nm = gw.name || gw.nombre || "Gateway";
              return <option key={id} value={id}>{nm}</option>;
            })}
          </select>
        ) : (
          <p style={{ color: "red" }}>⚠️ No hay gateways disponibles. Registra uno primero.</p>
        )
      )}

      <select
        value={status}
        onChange={(e) => { setStatus(e.target.value); setMessage(""); }}
        style={{ width: "100%", marginBottom: "0.5rem" }}
      >
        <option value="active">Activo</option>
        <option value="inactive">Inactivo</option>
      </select>

      <input
        type="text"
        placeholder="Ubicación (ej. Calle 123 #45-67)"
        value={location}
        onChange={(e) => { setLocation(e.target.value); setMessage(""); }}
        style={{ width: "100%", marginBottom: "1rem" }}
      />

      <button onClick={handleSubmit} disabled={submitting} style={{ padding: "0.5rem 1rem" }}>
        {submitting ? "Registrando..." : "Registrar"}
      </button>

      {message && <p style={{ marginTop: "1rem", color: message.startsWith("✅") ? "green" : "#b00020" }}>{message}</p>}
    </div>
  );
}