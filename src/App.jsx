// src/App.jsx
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import Login from "./Login";
import Dashboard from "./Dashboard";

function App() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuth(!!user);
    });
    return () => unsub(); // Cleanup
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Facil IoT - IoT para todos</h1>
      {isAuth ? <Dashboard /> : <Login />}
    </div>
  );
}

export default App;
