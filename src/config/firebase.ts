// src/config/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// グローバル変数をTypeScriptに認識させる
declare const __firebase_config: string;
declare const __app_id: string;

const firebaseConfig = typeof __firebase_config !== 'undefined' && __firebase_config
  ? JSON.parse(__firebase_config)
  : {
      apiKey: "AIzaSyC2cXYVr2KMWjAm3kuOV7cNV-O51nlBNkA",
      authDomain: "dashboard-app-e7278.firebaseapp.com",
      projectId: "dashboard-app-e7278",
      storageBucket: "dashboard-app-e7278.appspot.com",
      messagingSenderId: "649253642945",
      appId: "1:649253642945:web:1d8d7b9f2777a64a4daa40",
      measurementId: "G-WEFD2JNYZG"
    };

export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

if (!firebaseConfig.apiKey) {
    console.error("Firebase config is missing or invalid.");
}

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 匿名認証
signInAnonymously(auth).catch(error => {
    console.error("Firebase anonymous sign-in failed: ", error);
});


export { auth, db };