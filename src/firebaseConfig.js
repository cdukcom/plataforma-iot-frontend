import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAadBhE3K4QNodwhSriavgitb_pJG2wF7Q",
  authDomain: "plataforma-iot-a3c52.firebaseapp.com",
  projectId: "plataforma-iot-a3c52",
  storageBucket: "plataforma-iot-a3c52.appspot.com",
  messagingSenderId: "417994515846",
  appId: "1:417994515846:web:4276f8e173d124ad77b807"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
