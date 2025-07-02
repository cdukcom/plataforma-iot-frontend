// src/CreateTenant.jsx
import { useState } from "react";
import { auth } from "./firebaseConfig";

function CreateTenant() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser.getIdToken();

      const res = await fetch("https://iot-platform-multitenant-production.up.railway.app/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Comunidad creada con ID: ${data.tenant_id}`);
        setTimeout(() => {
          window.location.reload(); // recarga la vista para mostrar la nueva comunidad
        }, 1000);
      } else {
        setMessage(`❌ Error: ${data.detail || "No se pudo crear la comunidad."}`);
      }
    } catch (err) {
      setMessage(`⚠️ ${err.message}`);
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
          onChange={(e) => setName(e.target.value)}
        /><br /><br />
        <button type="submit">Crear</button>
      </form>
      <p>{message}</p>
    </div>
  );
}

export default CreateTenant;
