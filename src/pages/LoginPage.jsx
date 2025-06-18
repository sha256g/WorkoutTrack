import React from "react";
import { signInWithGoogle } from "../services/firebaseAuth";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white">
      <h1 className="text-4xl font-bold mb-6">FitNotes</h1>
      <button
        onClick={signInWithGoogle}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow"
      >
        Sign in with Google
      </button>
    </div>
  );
} 