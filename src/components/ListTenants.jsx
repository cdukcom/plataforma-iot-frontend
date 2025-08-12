// src/components/ListTenants.jsx
import { useEffect, useState } from "react";

export default function ListTenants({ token, onSelect, onDelete, onError }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/tenants`, {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: ctrl.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const detail = data?.detail || `Error ${res.status}`;
          throw new Error(detail);
        }
        // Soporta {tenants: [...] } o array directo
        const list = Array.isArray(data) ? data : (data.tenants || []);
        setItems(list);
        setMsg("");
      } catch (e) {
        if (e.name === "AbortError") return;
        console.error(e);
        const friendly = e.message || "No se pudo cargar el listado de comunidades.";
        setMsg(`⚠️ ${friendly}`);
        onError?.("No se pudo cargar el listado de comunidades.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [token]);

  if (loading) return <p>Cargando comunidades…</p>;

  return (
    <div style={{ marginTop: "2rem" }}>
      <h3>🏘️ Mis Comunidades</h3>
      {msg && <p style={{ color: "#b00020" }}>{msg}</p>}

      {items.length === 0 ? (
        <p>Aún no tienes comunidades.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {items.map((t) => {
            const id = t.id || t._id;
            const name = t.name || t.nombre || "Comunidad";
            const plan = t.plan || t.planNombre || "N/A";
            const createdAt = t.created_at || t.createdAt || t.fechaCreacion;

            return (
              <li key={id} style={{ marginBottom: "1rem", borderBottom: "1px solid #eee", paddingBottom: "0.75rem" }}>
                <strong>{name}</strong><br />
                Plan: {plan}<br />
                Creado: {createdAt ? new Date(createdAt).toLocaleString() : "N/A"}<br />
                <div style={{ marginTop: 6 }}>
                  <button onClick={() => onSelect?.(t)}>🔍 Ver detalles</button>{" "}
                  <button onClick={() => onDelete?.(t)} style={{ color: "red" }}>
                    🗑️ Eliminar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}