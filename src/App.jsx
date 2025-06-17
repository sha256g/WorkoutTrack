import './App.css';
import React from 'react';
import WorkoutTemplatesPage from './pages/WorkoutTemplatesPage.jsx';

function App() {
    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
            <header className="bg-gray-900 text-white p-6 shadow-2xl border-b border-gray-800">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center text-white">
                    FitNotes
                </h1>
                <p className="text-center mt-2 text-gray-400 text-sm">
                    Track your fitness journey
                </p>
            </header>
            <main>
                <div>
                    <WorkoutTemplatesPage />
                </div>
            </main>
        </div>
    );
}

export default App;