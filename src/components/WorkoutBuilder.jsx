import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import ExerciseManager from "./ExerciseManager.jsx"; // Ensure this is imported

export default function WorkoutBuilder({ user }) {
    const [templateName, setTemplateName] = useState('');
    const [selectedExercises, setSelectedExercises] = useState([]); // [{exerciseId, name, plannedSets}]
    const [showExerciseManagerModal, setShowExerciseManagerModal] = useState(false);

    // Get exercises and addWorkoutTemplate from the store
    const exercises = useStore((state) => state.exercises);
    const addWorkoutTemplate = useStore((state) => state.addWorkoutTemplate);

    // Function to add an exercise to the workout template
    const handleAddExerciseToTemplate = (exercise) => {
        if (selectedExercises.some((ex) => ex.exerciseId === exercise.id)) {
            alert('Exercise already added to this workout!');
            return;
        }
        setSelectedExercises([
            ...selectedExercises,
            { exerciseId: exercise.id, name: exercise.name, plannedSets: 3 }, // Default to 3 planned sets
        ]);
    };

    // Function to update the number of planned sets for an exercise
    const handlePlannedSetsChange = (exerciseId, value) => {
        setSelectedExercises((prev) =>
            prev.map((ex) =>
                ex.exerciseId === exerciseId ? { ...ex, plannedSets: Number(value) } : ex
            )
        );
    };

    // Function to remove an exercise from the template
    const handleRemoveExercise = (exerciseId) => {
        setSelectedExercises((prev) => prev.filter((ex) => ex.exerciseId !== exerciseId));
    };

    const openExerciseManagerModal = () => {
        setShowExerciseManagerModal(true);
    };

    const closeExerciseManagerModal = () => setShowExerciseManagerModal(false);


    // Function to save the workout template
    const handleSaveWorkoutTemplate = async () => {
        if (!templateName || selectedExercises.length === 0) {
            alert('Please enter a workout name and add exercises.');
            return;
        }

        const newTemplate = {
            id: Date.now(), // Simple unique ID
            name: templateName,
            date: new Date().toISOString().slice(0, 10),
            exercises: selectedExercises.map((ex) => ({
                exerciseId: ex.exerciseId,
                plannedSets: ex.plannedSets,
            })),
        };

        await addWorkoutTemplate(newTemplate, user?.uid);
        setTemplateName('');
        setSelectedExercises([]);
        alert('Workout saved!');
    };

    return (
        <div className="p-4 border rounded mb-4 bg-gray-50">
            <h2 className="text-2xl font-bold mb-4 text-blue-800">Build New Workout</h2>

            {/* Template Name and Save */}
            <div className="mb-4 flex flex-col sm:flex-row gap-3 items-center">
                <input
                    className="border p-2 rounded w-full sm:w-1/2"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Workout Name"
                    required
                />
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full sm:w-auto"
                    onClick={handleSaveWorkoutTemplate}
                    type="button"
                >
                    Save Workout
                </button>
            </div>

            {/* Add Exercises to Template */}
            <div className="mb-6 border-t pt-4">
                <h3 className="text-xl font-semibold mb-3 text-gray-700">Available Exercises</h3>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto border p-2 rounded bg-white">
                    {exercises.length === 0 && <p className="text-gray-500">No exercises found. Add some in the Exercise Manager below!</p>}
                    {exercises.map((ex) => (
                        <button
                            key={ex.id}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-full text-sm"
                            onClick={() => handleAddExerciseToTemplate(ex)}
                            type="button"
                        >
                            Add {ex.name} ({ex.category})
                        </button>
                    ))}
                </div>
            </div>

            {/*exercise manager button*/}
            <div className="mb-4">
                <button
                    className="btn btn-info w-full sm:w-auto"
                    onClick={openExerciseManagerModal}
                >
                    Manage Exercises
                </button>
            </div>

            {/* Selected Exercises in Template */}
            <div>
                <h3 className="text-xl font-semibold mb-3 text-gray-700">Exercises in this workout ({selectedExercises.length})</h3>
                {selectedExercises.length === 0 && <p className="text-gray-500">No exercises added to the workout yet.</p>}
                <ul className="space-y-4">
                    {selectedExercises.map((ex) => (
                        <li key={ex.exerciseId} className="flex flex-col sm:flex-row items-start sm:items-center bg-white p-3 rounded-lg shadow-sm gap-3">
                            <span className="font-medium text-lg text-gray-900 flex-grow">{ex.name}</span>
                            <div className="flex items-center gap-2">
                                <label className="text-gray-600 text-sm" htmlFor={`sets-${ex.exerciseId}`}>Planned Sets:</label>
                                <input
                                    id={`sets-${ex.exerciseId}`}
                                    className="border p-1 rounded w-16 text-center"
                                    type="number"
                                    min="1"
                                    value={ex.plannedSets}
                                    onChange={(e) => handlePlannedSetsChange(ex.exerciseId, e.target.value)}
                                />
                                <button
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                    onClick={() => handleRemoveExercise(ex.exerciseId)}
                                    type="button"
                                >
                                    Remove
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>


            {showExerciseManagerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl border border-gray-700/50">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 text-2xl transition-colors"
                            onClick={closeExerciseManagerModal}
                        >
                            &times;
                        </button>
                        <ExerciseManager user = {user}/>
                    </div>
                </div>
            )}
        </div>
    );
}