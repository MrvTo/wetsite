// Firebase configuration for client-side
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5BWs2lyeuspgtyMoh0s8GADc1zEVKnfw",
  authDomain: "webcameyetrackerlogin.firebaseapp.com",
  projectId: "webcameyetrackerlogin",
  storageBucket: "webcameyetrackerlogin.appspot.com", // ✅ düzeltildi (.app yerine .com)
  messagingSenderId: "358735849867",
  appId: "1:358735849867:web:633bd1183121396de8e78e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
