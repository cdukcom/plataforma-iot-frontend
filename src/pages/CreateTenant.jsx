// src/pages/CreateTenant.jsx
import { useState } from "react";

export default function CreateTenant({ token, onCreated, onError }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) {
      setMessage("❌ El nombre es obligatorio.");
      onError?.("El nombre es obligatorio.");
      return;
    }
    if (!token) {
      setMessage("❌ Sesión inválida. Inicia sesión nuevamente.");
      onError?.("Sesión inválida. Inicia sesión nuevamente.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tenants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: clean }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = data?.detail || `Error ${res.status}`;
        throw new Error(detail);
      }

      setMessage(`✅ Comunidad creada correctamente.`);
      setName("");
      onCreated?.(); // Dashboard refresca el listado (tenantsVersion++)
    } catch (err) {
      console.error(err);
      const friendly = err?.message || "No se pudo crear la comunidad.";
      setMessage(`❌ ${friendly}`);
      onError?.(friendly);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h3>➕ Crear nueva comunidad</h3>
      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Nombre de la comunidad"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setMessage("");
          }}
          style={{ marginRight: 8, height: 32 }}
        />
        <button type="submit" disabled={submitting} style={{ height: 36 }}>
          {submitting ? "Creando..." : "Crear"}
        </button>
      </form>
      {message && <p style={{ marginTop: 8 }}>{message}</p>}
    </div>
  );
}