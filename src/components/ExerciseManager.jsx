import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { EXERCISE_CATEGORIES } from '../utils/exerciseCategories';

export default function ExerciseManager() {
    const [name, setName] = useState('');
    const [category, setCategory] = useState(EXERCISE_CATEGORIES[0]);
    const exercises = useStore((state) => state.exercises);
    const addExercise = useStore((state) => state.addExercise);
    const initExercises = useStore((state) => state.initExercises);
    const removeExercise = useStore((state) => state.removeExercise);

    useEffect(() => {
        initExercises();
    }, [initExercises]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!name) return;
        await addExercise({
            id: Date.now(), // simple unique id for demo
            name,
            category,
        });
        setName('');
    };

    const handleDeleteExercise = async (exerciseId, exerciseName) => {
        if (window.confirm(`Are you sure you want to delete the exercise "${exerciseName}"?`)) {
            await removeExercise(exerciseId);
        }
    };

    return (
        <div className="p-4 bg-gray-800 rounded-lg shadow-md border border-gray-700 mt-6">
            <h2 className="text-xl font-bold text-white mb-4">Add New Exercise</h2>
            <form onSubmit={handleAdd} className="mb-6 flex flex-wrap items-center gap-3">
                <input
                    className="input flex-grow min-w-[150px]"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Exercise name"
                    aria-label="Exercise name"
                />
                <select
                    className="input min-w-[120px]"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    aria-label="Exercise category"
                >
                    {EXERCISE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <button className="btn btn-primary flex-shrink-0" type="submit">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Exercise
                </button>
            </form>

            <h3 className="font-bold text-white mb-3">Your Existing Exercises</h3>
            {exercises.length === 0 ? (
                <p className="text-gray-400">No exercises added yet.</p>
            ) : (
                <ul className="space-y-3">
                    {exercises.map((ex) => (
                        <li key={ex.id} className="bg-gray-700 p-3 rounded-lg shadow-sm flex justify-between items-center border border-gray-600">
                            <span className="text-gray-100 font-medium">{ex.name} <span className="text-gray-400 text-sm">({ex.category})</span></span>
                            <button
                                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-gray-800"
                                onClick={() => handleDeleteExercise(ex.id, ex.name)}
                                aria-label={`Delete ${ex.name}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm6 3a1 1 0 100 2h-2a1 1 0 100 2h2a1 1 0 100 2H8a1 1 0 01-1-1v-4a1 1 0 011-1h5z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}