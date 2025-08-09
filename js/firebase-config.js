// Firebase configuration for client-side
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5BWs2lyeuspgtyMoh0s8GADc1zEVKnfw",
  authDomain: "webcameyetrackerlogin.firebaseapp.com",
  projectId: "webcameyetrackerlogin",
  storageBucket: "webcameyetrackerlogin.firebasestorage.app",
  messagingSenderId: "358735849867",
  appId: "1:358735849867:web:633bd1183121396de8e78e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Connect to emulators in development
if (window.location.hostname === 'localhost') {
  // Connect to Firebase Auth emulator
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  
  // Connect to Firestore emulator
  connectFirestoreEmulator(db, 'localhost', 8080);
}

export default app;
