// src/ListTenants.jsx
import { useEffect, useState } from "react";
import { auth } from "./firebaseConfig";

function ListTenants({ onSelect }) {
  const [tenants, setTenants] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch("https://iot-platform-multitenant-production.up.railway.app/tenants", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          setTenants(data.tenants);
        } else {
          setMessage(`❌ Error: ${data.detail || "No se pudieron obtener las comunidades."}`);
        }
      } catch (err) {
        setMessage(`⚠️ ${err.message}`);
      }
    };

    fetchTenants();
  }, []);

  return (
    <div style={{ marginTop: "2rem" }}>
      <h3>🏘️ Mis Comunidades</h3>
      {message && <p>{message}</p>}
      <ul>
        {tenants.map((tenant) => (
          <li key={tenant.id} style={{ marginBottom: "1rem" }}>
            <strong>{tenant.name}</strong> <br />
            Plan: {tenant.plan} <br />
            Creado: {tenant.created_at ? new Date(tenant.created_at).toLocaleString() : "N/A"} <br />
            <button onClick={() => onSelect(tenant)}>🔍 Ver detalles</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ListTenants;
     
