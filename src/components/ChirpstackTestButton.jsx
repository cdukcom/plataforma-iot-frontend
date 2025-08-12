// src/ChirpstackTestButton.jsx
import { useState } from "react";

const ChirpstackTestButton = ({ tenantId, token }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const testEndpoint = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(
        `https://iot-platform-multitenant-production.up.railway.app/devices/${tenantId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        setResult(`✅ Dispositivos recibidos: ${data.devices.length}`);
        console.log("Respuesta:", data);
      } else {
        setResult(`❌ Error: ${data.detail || res.status}`);
      }
    } catch (err) {
      console.error(err);
      setResult("❌ Error de red");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <button onClick={testEndpoint} disabled={loading}>
        {loading ? "Probando..." : "Probar conexión API IoTaaS → ChirpStack"}
      </button>
      {result && <p>{result}</p>}
    </div>
  );
};

export default ChirpstackTestButton;
