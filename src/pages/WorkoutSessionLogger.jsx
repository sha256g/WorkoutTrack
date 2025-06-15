import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore.js';
import { formatTime, playSound, vibrate } from '../utils/timerUtils.js';

export default function WorkoutSessionLogger({ templateId, onClose }) {
    // --- ALL HOOKS MUST BE DECLARED AT THE TOP LEVEL, UNCONDITIONALLY ---
    const currentWorkoutSession = useStore((state) => state.currentWorkoutSession);
    const workoutTemplates = useStore((state) => state.workoutTemplates);
    const exercises = useStore((state) => state.exercises);
    const startWorkoutSession = useStore((state) => state.startWorkoutSession);
    const logSet = useStore((state) => state.logSet);
    const endWorkoutSession = useStore((state) => state.endWorkoutSession);

    // Timer states from Zustand
    const restTimerSecondsLeft = useStore((state) => state.restTimerSecondsLeft);
    const isRestTimerActive = useStore((state) => state.isRestTimerActive);
    const sessionTimerStartTime = useStore((state) => state.sessionTimerStartTime);

    // Local state for session duration display (to force re-renders every second)
    const [sessionDurationSeconds, setSessionDurationSeconds] = useState(0);

    // State to hold input values for planned sets BEFORE they are logged
    const [tempPlannedSetInputs, setTempPlannedSetInputs] = useState({});

    // State to manage inline sub-set input: { exerciseId, parentSetId }
    const [addingSubSetFor, setAddingSubSetFor] = useState(null);
    const [newSubSetReps, setNewSubSetReps] = useState('');
    const [newSubSetWeight, setNewSubSetWeight] = useState('');
    const [newSubSetNotes, setNewSubSetNotes] = useState('');


    // Effect to start the session if not already active
    useEffect(() => {
        if (!currentWorkoutSession || currentWorkoutSession.templateId !== templateId) {
            startWorkoutSession(templateId);
        }
    }, [templateId, currentWorkoutSession, startWorkoutSession]);

    // Effect for Workout Session Timer: updates local state every second for display
    useEffect(() => {
        let intervalId;
        if (sessionTimerStartTime) {
            intervalId = setInterval(() => {
                setSessionDurationSeconds(Math.floor((Date.now() - sessionTimerStartTime) / 1000));
            }, 1000);
        } else {
            setSessionDurationSeconds(0); // Reset if timer is not active (e.g., session ended)
        }
        return () => clearInterval(intervalId); // Cleanup
    }, [sessionTimerStartTime]);

    // Effect for Rest Timer completion notifications (sound/vibrate)
    useEffect(() => {
        // This effect runs whenever isRestTimerActive or restTimerSecondsLeft changes.
        // If timer just became inactive AND seconds left is 0 (or very low), it means it finished.
        // Add a flag or check if it was previously active to prevent immediate trigger on mount.
        // For now, simple check:
        if (restTimerSecondsLeft === 0 && !isRestTimerActive) {
            // Add sound and vibrate only if the timer was previously active and just hit zero.
            // This logic is a bit tricky with just `isRestTimerActive`.
            // The `useStore`'s `startRestTimer` and `resetRestTimer` ensure the correct state.
            // The `logSet` in store triggers the start. When secondsLeft reaches 0 inside the store,
            // it sets isRestTimerActive to false.
            // So, this effect will run when that transition happens.
            if (currentWorkoutSession) { // Ensure a session context
                // playSound('/path/to/your/rest_timer_end_sound.mp3'); // TODO: Add your sound file path here
                // vibrate();
                console.log("Rest timer ended! (from UI effect)");
            }
        }
    }, [restTimerSecondsLeft, isRestTimerActive, currentWorkoutSession]);


    // Handle input changes for the temporary planned set inputs
    const handleInputChange = useCallback((exerciseId, plannedSetIdx, field, value) => {
        setTempPlannedSetInputs(prev => ({
            ...prev,
            [exerciseId]: {
                ...(prev[exerciseId] || {}),
                [plannedSetIdx]: {
                    ...(prev[exerciseId]?.[plannedSetIdx] || { reps: '', weight: '', notes: '' }),
                    [field]: value,
                },
            },
        }));
    }, []);

    // Handle marking a planned set as complete (logging it)
    const handleSetCompletion = useCallback(async (exerciseId, plannedSetIdx) => {
        const inputs = tempPlannedSetInputs[exerciseId]?.[plannedSetIdx] || { reps: '', weight: '', notes: '' };
        const reps = inputs.reps;
        const weight = inputs.weight;
        const notes = inputs.notes;

        if (!reps || !weight) {
            alert('Please enter reps and weight before completing a set.');
            return;
        }

        // Log the main set (parentSetId = null) - this will trigger rest timer in store
        await logSet(exerciseId, reps, weight, notes, null);

        // After logging, clear the inputs for this specific planned set from temp state
        setTempPlannedSetInputs(prev => {
            const newExInputs = { ...(prev[exerciseId] || {}) };
            delete newExInputs[plannedSetIdx];
            return { ...prev, [exerciseId]: newExInputs };
        });

    }, [tempPlannedSetInputs, logSet]);

    // Handler for opening the inline sub-set form
    const handleStartAddSubSet = useCallback((exerciseId, parentSetId) => {
        setAddingSubSetFor({ exerciseId, parentSetId });
        setNewSubSetReps('');
        setNewSubSetWeight('');
        setNewSubSetNotes('');
    }, []);

    // Handler for logging the inline sub-set (now triggered by checkbox)
    const handleLogSubSetInline = useCallback(async () => {
        if (!addingSubSetFor) return;

        const { exerciseId, parentSetId } = addingSubSetFor;
        const reps = newSubSetReps;
        const weight = newSubSetWeight;
        const notes = newSubSetNotes;

        if (!reps || !weight) {
            alert('Reps and Weight are required for sub-set!');
            return;
        }

        // Log the sub-set - this will trigger rest timer in store
        await logSet(exerciseId, reps, weight, notes, parentSetId);

        // Clear sub-set input state and close the inline form
        setAddingSubSetFor(null);
        setNewSubSetReps('');
        setNewSubSetWeight('');
        setNewSubSetNotes('');

    }, [addingSubSetFor, newSubSetReps, newSubSetWeight, newSubSetNotes, logSet]);

    // Helper to get formatted logged sets, including sub-sets correctly grouped and labeled
    const getGroupedLoggedSets = useCallback((sessionEx) => {
        const mainLoggedSets = sessionEx.loggedSets
            .filter(s => !s.parentSetId)
            .sort((a, b) => a.timestamp - b.timestamp); // Ensure main sets are ordered by log time

        const grouped = mainLoggedSets.map((mainSet, mainIdx) => {
            const subSets = sessionEx.loggedSets
                .filter(s => s.parentSetId === mainSet.id)
                .sort((a, b) => a.timestamp - b.timestamp) // Sort sub-sets by time
                .map((subSet, subIdx) => ({
                    ...subSet,
                    // Alphanumeric label: 1.a, 1.b, etc.
                    label: `${mainIdx + 1}.${String.fromCharCode(97 + subIdx)}`,
                }));
            return {
                ...mainSet,
                label: `Set ${mainIdx + 1}`,
                subSets,
            };
        });
        return grouped;
    }, []);


    // --- CONDITIONAL RENDERING STARTS AFTER ALL HOOKS ---

    // Derive template details
    const template = workoutTemplates.find((t) => t.id === templateId);

    // Initial loading checks and error display
    if (!template) {
        return <div className="p-4 text-red-500">Error: Workout template not found.</div>;
    }
    if (!currentWorkoutSession || currentWorkoutSession.templateId !== templateId) {
        return <div className="p-4 text-gray-400">Starting workout session...</div>;
    }

    // Map session exercises to include full exercise details for rendering
    const sessionExercisesWithDetails = currentWorkoutSession.exercises.map(sessionEx => {
        const fullExercise = exercises.find(ex => ex.id === sessionEx.exerciseId);
        return {
            ...sessionEx,
            name: fullExercise ? fullExercise.name : 'Unknown Exercise',
            category: fullExercise ? fullExercise.category : '',
        };
    });


    return (
        <div className="p-4 bg-gray-800 rounded-lg shadow-xl max-w-4xl mx-auto my-8 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">{template.name}</h2>
                <button
                    className="btn btn-secondary bg-red-600 hover:bg-red-700 shadow-red-500/20 border-red-500/20"
                    onClick={() => {
                        endWorkoutSession();
                        onClose(); // Close the modal/component after ending session
                    }}
                >
                    End Workout
                </button>
            </div>

            {/* Workout Session Timer Display */}
            <div className="mb-6 bg-gray-700 p-3 rounded-lg text-center text-lg font-semibold text-gray-100 border border-gray-600">
                Workout Time: {formatTime(sessionDurationSeconds)}
            </div>

            <div className="space-y-8">
                {sessionExercisesWithDetails.map((sessionEx) => {
                    const groupedLoggedSets = getGroupedLoggedSets(sessionEx);

                    return (
                        <div key={sessionEx.exerciseId} className="bg-gray-700 rounded-lg p-5 border border-gray-600 shadow-md">
                            <h3 className="text-2xl font-semibold text-indigo-400 mb-3">
                                {sessionEx.name} <span className="text-base text-gray-400">({sessionEx.category})</span>
                                {/* Rest Timer Display - now under exercise name and conditional */}
                                {isRestTimerActive && ( // Only show if rest timer is active
                                    <span className="ml-4 bg-yellow-600 text-white text-sm px-2 py-1 rounded-full">
                    Rest: {formatTime(restTimerSecondsLeft)}
                  </span>
                                )}
                            </h3>

                            <h4 className="text-lg font-medium text-gray-100 mb-3">
                                Planned Sets: {sessionEx.plannedSets}
                            </h4>
                            <ul className="space-y-3 mb-6">
                                {Array.from({ length: sessionEx.plannedSets }).map((_, plannedSetIdx) => {
                                    const currentLoggedSet = groupedLoggedSets[plannedSetIdx]; // Get the corresponding logged set
                                    const isLogged = !!currentLoggedSet; // Check if this planned set has been logged (by its index)
                                    const isNextSetToLog = plannedSetIdx === groupedLoggedSets.length; // Is this the very next set to log?
                                    const inputs = tempPlannedSetInputs[sessionEx.exerciseId]?.[plannedSetIdx] || { reps: '', weight: '', notes: '' };

                                    return (
                                        <React.Fragment key={plannedSetIdx}>
                                            <li className="bg-gray-800 p-4 rounded-md shadow-sm border border-gray-700">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    {/* Checkbox / Completion Indicator */}
                                                    {isLogged ? (
                                                        <span className="text-green-500 font-bold text-xl flex-shrink-0">&#10003;</span> // Checkmark
                                                    ) : (
                                                        <input
                                                            type="checkbox"
                                                            className="form-checkbox h-5 w-5 text-indigo-500 flex-shrink-0 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
                                                            checked={false} // This input only triggers logging
                                                            onChange={() => handleSetCompletion(sessionEx.exerciseId, plannedSetIdx)}
                                                            disabled={!isNextSetToLog} // Only enable for the next set to log
                                                        />
                                                    )}

                                                    {/* Set Labels */}
                                                    <span className="font-semibold text-white mr-2">Set {plannedSetIdx + 1}</span>

                                                    {/* Reps Input */}
                                                    <input
                                                        type="number"
                                                        placeholder="Reps"
                                                        className="input w-24 bg-gray-600 border-gray-500 text-gray-100 placeholder-gray-400 focus:ring-blue-500/50"
                                                        value={inputs.reps}
                                                        onChange={(e) => handleInputChange(sessionEx.exerciseId, plannedSetIdx, 'reps', e.target.value)}
                                                        disabled={isLogged || !isNextSetToLog}
                                                    />

                                                    {/* Weight Input */}
                                                    <input
                                                        type="number"
                                                        placeholder="Weight"
                                                        className="input w-28 bg-gray-600 border-gray-500 text-gray-100 placeholder-gray-400 focus:ring-blue-500/50"
                                                        value={inputs.weight}
                                                        onChange={(e) => handleInputChange(sessionEx.exerciseId, plannedSetIdx, 'weight', e.target.value)}
                                                        disabled={isLogged || !isNextSetToLog}
                                                    />

                                                    {/* Notes Input */}
                                                    <input
                                                        type="text"
                                                        placeholder="Notes (optional)"
                                                        className="input flex-grow bg-gray-600 border-gray-500 text-gray-100 placeholder-gray-400 focus:ring-blue-500/50"
                                                        value={inputs.notes}
                                                        onChange={(e) => handleInputChange(sessionEx.exerciseId, plannedSetIdx, 'notes', e.target.value)}
                                                        disabled={isLogged || !isNextSetToLog}
                                                    />

                                                    {/* Logged set details - only visible if logged */}
                                                    {isLogged && (
                                                        <div className="text-gray-400 text-sm italic ml-auto">
                                                            Logged: {currentLoggedSet.reps} reps @ {currentLoggedSet.weight} kg
                                                            {currentLoggedSet.notes && ` (${currentLoggedSet.notes})`}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Display Logged Sub-Sets (if any) */}
                                                {currentLoggedSet && currentLoggedSet.subSets && currentLoggedSet.subSets.length > 0 && (
                                                    <div className="ml-8 mt-3 pt-3 border-t border-gray-700">
                                                        <p className="font-semibold text-gray-300 mb-2">Sub-Sets:</p>
                                                        <ul className="space-y-2">
                                                            {currentLoggedSet.subSets.map((subSet) => (
                                                                <li key={subSet.id} className="text-sm text-gray-400">
                                                                    <span className="font-medium text-gray-300">{subSet.label}:</span> {subSet.reps} reps @ {subSet.weight} kg
                                                                    {subSet.notes && ` (${subSet.notes})`}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Add Sub-Set Button (if this is the last logged main set and not already adding) */}
                                                {isLogged && plannedSetIdx === groupedLoggedSets.length - 1 &&
                                                    (!addingSubSetFor || addingSubSetFor.parentSetId !== currentLoggedSet.id) && (
                                                        <button
                                                            className="btn btn-secondary mt-3 px-3 py-1.5 text-xs"
                                                            onClick={() => handleStartAddSubSet(sessionEx.exerciseId, currentLoggedSet.id)}
                                                        >
                                                            + Add Sub-Set
                                                        </button>
                                                    )}

                                                {/* Inline Sub-Set Input Form */}
                                                {addingSubSetFor && addingSubSetFor.parentSetId === currentLoggedSet?.id && (
                                                    <div className="mt-4 p-4 bg-gray-700 rounded-md border border-gray-600">
                                                        <h5 className="font-semibold text-white mb-2">Add Sub-Set to {currentLoggedSet.label}</h5>
                                                        <div className="flex flex-wrap items-center gap-3 mb-3">
                                                            <input
                                                                type="number"
                                                                placeholder="Reps"
                                                                className="input w-24 bg-gray-600 border-gray-500 text-gray-100 placeholder-gray-400 focus:ring-blue-500/50"
                                                                value={newSubSetReps}
                                                                onChange={(e) => setNewSubSetReps(e.target.value)}
                                                            />
                                                            <input
                                                                type="number"
                                                                placeholder="Weight"
                                                                className="input w-28 bg-gray-600 border-gray-500 text-gray-100 placeholder-gray-400 focus:ring-blue-500/50"
                                                                value={newSubSetWeight}
                                                                onChange={(e) => setNewSubSetWeight(e.target.value)}
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Notes (optional)"
                                                                className="input flex-grow bg-gray-600 border-gray-500 text-gray-100 placeholder-gray-400 focus:ring-blue-500/50"
                                                                value={newSubSetNotes}
                                                                onChange={(e) => setNewSubSetNotes(e.target.value)}
                                                            />
                                                        </div>
                                                        <button
                                                            className="btn btn-primary px-4 py-2 text-sm"
                                                            onClick={handleLogSubSetInline}
                                                        >
                                                            Log Sub-Set
                                                        </button>
                                                        <button
                                                            className="btn btn-secondary ml-2 px-4 py-2 text-sm"
                                                            onClick={() => setAddingSubSetFor(null)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}
                                            </li>
                                        </React.Fragment>
                                    );
                                })}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}