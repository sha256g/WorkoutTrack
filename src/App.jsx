import './App.css';
import React, { useEffect, useState } from 'react';
import WorkoutTemplatesPage from './pages/WorkoutTemplatesPage.jsx';
import { signOutUser, onUserChanged } from './services/firebaseAuth';
import LoginPage from './pages/LoginPage';
import { useStore } from './store/useStore';
import { syncWorkoutsFromCloud } from './services/firestoreWorkouts';
import { syncExercisesFromCloud } from './services/firestoreExercises';
import { syncTemplatesFromCloud } from './services/firestoreTemplates';
import { clearAllTables } from './db/dexieDB';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onUserChanged(setUser);
        return () => unsubscribe();
    }, []);

    // Sync user data on login
    useEffect(() => {
        if (user) {
            setLoading(true);
            useStore.getState().clearAll();
            clearAllTables().then(() => {
                Promise.all([
                    syncWorkoutsFromCloud(user.uid, (data) => {
                        useStore.getState().setWorkoutHistory(data);
                    }),
                    syncExercisesFromCloud(user.uid, (data) => {
                        useStore.getState().setExercises(data);
                    }),
                    syncTemplatesFromCloud(user.uid, (data) => {
                        useStore.getState().setWorkoutTemplates(data);
                    }),
                ]).then(() => {
                    setLoading(false);
                }).catch((error) => {
                    console.error('Error syncing from Firebase:', error);
                    setLoading(false);
                });
            });
        } else {
            setLoading(false);
        }
    }, [user]);

    if (!user) {
        return <LoginPage />;
    }
    if (loading) return <div className="text-center mt-10 text-lg">Loading your data...</div>;

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
            <header className="bg-gray-900 text-white p-6 shadow-2xl border-b border-gray-800">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                            FitNotes
                        </h1>
                        <p className="text-gray-400 text-sm">Track your fitness journey</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full" />
                        <span>{user.displayName}</span>
                        <button
                            onClick={signOutUser}
                            className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-1 px-3 rounded"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </header>
            <main>
                <WorkoutTemplatesPage user={user} />
            </main>
        </div>
    );
}

export default App;