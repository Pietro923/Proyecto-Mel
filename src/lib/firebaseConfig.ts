// lib/firebaseConfig.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "mel-proyecto.firebaseapp.com",
  projectId: "mel-proyecto",
  storageBucket: "mel-proyecto.firebasestorage.app",
  messagingSenderId: "744878283187",
  appId: "1:744878283187:web:74233697ca236b46c753c6"
};


// Inicializar Firebase si no se ha inicializado previamente
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Configurar la autenticación con persistencia de sesión en el navegador
const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence)
  .catch((error) => {
    console.error("Error setting persistence: ", error);
  });

// Obtener la instancia de Firestore
const db = getFirestore(app);

// Exportar la instancia de autenticación y Firestore
export { auth, db };
export default firebaseConfig;
