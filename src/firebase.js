// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 🔥 Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCHKQSy41QIKsMpLGNXt8LGYFSMNHYUCe8",
  authDomain: "maxtradeai-c3b5f.firebaseapp.com",
  projectId: "maxtradeai-c3b5f",
  storageBucket: "maxtradeai-c3b5f.appspot.com",
  messagingSenderId: "32108341072",
  appId: "1:32108341072:web:da318e349a53520d6e55",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore database
export const db = getFirestore(app);
