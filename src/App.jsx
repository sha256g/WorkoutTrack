import './App.css';
import React from 'react';
import WorkoutTemplatesPage from './pages/WorkoutTemplatesPage.jsx';

// CONFIRM CHANGE: App component updated for layout and PWA icon (Latest Attempt)
function App() {
    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
            <header className="bg-gray-900 text-white p-6 shadow-2xl border-b border-gray-800">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-extrabold tracking-tight text-center text-white">
                        FitNotes
                    </h1>
                    <p className="text-center mt-2 text-gray-400 text-sm">
                        Track your fitness journey
                    </p>
                </div>
            </header>
            <main className="container mx-auto px-4 py-8 max-w-full sm:max-w-6xl">
                <div className="bg-gray-800 rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl border border-gray-700">
                    <WorkoutTemplatesPage />
                </div>
            </main>
        </div>
    );
}

export default App;