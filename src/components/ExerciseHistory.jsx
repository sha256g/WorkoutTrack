import React from 'react';
import { useStore } from '../store/useStore';

export default function ExerciseHistory({ exerciseId }) {
    // Get exercises and workout history from store
    const exercises = useStore((state) => state.exercises);
    const workoutHistory = useStore((state) => state.workoutHistory);

    // Find the exercise details
    const exercise = exercises.find(ex => ex.id === exerciseId);

    if (!exercise) {
        return (
            <div className="text-center text-gray-400">
                <h2 className="text-2xl font-bold mb-4">Exercise History</h2>
                <p>Exercise not found.</p>
            </div>
        );
    }

    // Filter workout sessions that contain this exercise
    const exerciseHistory = workoutHistory.filter(session => 
        session.exercises.some(ex => ex.exerciseId === exerciseId)
    );

    return (
        <div className="text-white">
            <h2 className="text-2xl font-bold mb-4 text-indigo-400">
                Exercise History: {exercise.name}
            </h2>

            <div className="mb-4 text-gray-300">
                <p><strong>Category:</strong> {exercise.category}</p>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <h3 className="text-lg font-semibold mb-3 text-gray-200">Historical Performance</h3>

                {exerciseHistory.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">
                        <p className="text-lg mb-2">📊 No workout history found for this exercise</p>
                        <p className="text-sm">Complete some workouts with this exercise to see your progress!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-400 mb-3">
                            Found {exerciseHistory.length} workout session(s) with this exercise
                        </p>
                        
                        {exerciseHistory.map((session, sessionIndex) => {
                            const exerciseData = session.exercises.find(ex => ex.exerciseId === exerciseId);
                            if (!exerciseData || exerciseData.loggedSets.length === 0) return null;

                            return (
                                <div key={session.id} className="bg-gray-800 p-3 rounded border border-gray-600">
                                    <h4 className="font-semibold text-gray-200 mb-2">
                                        Session {sessionIndex + 1} - {new Date(session.date).toLocaleDateString()}
                                    </h4>
                                    <div className="space-y-1">
                                        {exerciseData.loggedSets
                                            .filter(set => !set.parentSetId) // Only show main sets
                                            .map((set, setIndex) => (
                                                <div key={set.id} className="text-sm text-gray-400">
                                                    Set {setIndex + 1}: {set.reps} reps @ {set.weight} kg
                                                    {set.notes && ` (${set.notes})`}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="mt-4 text-xs text-gray-500">
                Exercise ID: {exerciseId}
            </div>
        </div>
    );
}