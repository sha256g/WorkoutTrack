import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Initialize Firebase using the global firebase object from CDN scripts
// Replace the config object below with your actual Firebase project config

const firebaseConfig = {
  apiKey: "AIzaSyCGd8HJq-kmJ-droAWLb8LTe3B234pB7Xo",
  authDomain: "project---workouttracker.firebaseapp.com",
  projectId: "project---workouttracker",
  storageBucket: "project---workouttracker.appspot.com",
  messagingSenderId: "660111544538",
  appId: "1:660111544538:web:f0fd512ec5b5ce520195e3",
  measurementId: "G-JJBGKND974"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export { app as firebaseApp, firestore }; 