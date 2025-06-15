// src/store/useStore.js
import { create } from 'zustand';
import { EXERCISE_CATEGORIES } from '../utils/exerciseCategories';
import {
    addExerciseToDB,
    getAllExercisesFromDB,
    deleteExerciseFromDB,
    addWorkoutTemplateToDB,
    getAllWorkoutTemplatesFromDB,
    deleteWorkoutTemplateFromDB,
    deleteWorkoutSessionsByTemplateId,
    addWorkoutSessionToDB,
    getWorkoutSessionByIdFromDB,
    updateWorkoutSessionInDB,
    getAllWorkoutSessionsFromDB,
    saveSettingsToDB, // New import for saving settings
    getSettingsFromDB, // New import for getting settings
} from '../db/dexieDB';

const DEFAULT_REST_TIME_SECONDS = 60; // Default rest time

export const useStore = create((set, get) => ({
    workoutTemplates: [],
    exercises: [],
    workoutHistory: [],
    currentWorkoutSession: null,

    // --- Timer States ---
    restTimerSecondsLeft: 0,
    isRestTimerActive: false,
    restTimerIntervalId: null,
    sessionTimerStartTime: null,
    sessionTimerIntervalId: null,

    // --- Settings State ---
    settings: {
        defaultRestTime: DEFAULT_REST_TIME_SECONDS, // Initial default
        // Add more settings here later if needed (e.g., sound preferences)
    },

    // --- Exercise Management ---
    addExercise: async (exercise) => {
        await addExerciseToDB(exercise);
        const exercises = await getAllExercisesFromDB();
        set({ exercises });
    },
    initExercises: async () => {
        const exercises = await getAllExercisesFromDB();
        set({ exercises });
    },
    removeExercise: async (exerciseId) => {
        await deleteExerciseFromDB(exerciseId);
        set((state) => ({
            exercises: state.exercises.filter((ex) => ex.id !== exerciseId),
        }));
        // Optional: Also consider removing this exercise from any existing workout templates
        // or workout sessions if you want to maintain full data integrity.
        // For now, it will simply be removed from the exercises list.
    },
    listExercises: () => get().exercises,
    listExercisesByCategory: (category) =>
        get().exercises.filter((ex) => ex.category === category),

    // --- Workout Template Management ---
    addWorkoutTemplate: async (template) => {
        await addWorkoutTemplateToDB(template);
        const workoutTemplates = await getAllWorkoutTemplatesFromDB();
        set({ workoutTemplates });
    },
    initWorkoutTemplates: async () => {
        const workoutTemplates = await getAllWorkoutTemplatesFromDB();
        set({ workoutTemplates });
    },
    removeWorkoutTemplate: async (templateId) => {
        // 1. Delete the template itself
        await deleteWorkoutTemplateFromDB(templateId);
        // 2. Delete all associated workout sessions
        await deleteWorkoutSessionsByTemplateId(templateId);

        // 3. Update state
        set((state) => ({
            workoutTemplates: state.workoutTemplates.filter((t) => t.id !== templateId),
            // If the deleted template was the active session, clear current session
            currentWorkoutSession: state.currentWorkoutSession?.templateId === templateId
                ? null
                : state.currentWorkoutSession,
            // Also update workout history to remove sessions from this template
            workoutHistory: state.workoutHistory.filter((session) => session.templateId !== templateId),
        }));
    },

    // Get personal exercise history (uses workoutTemplates)
    getPersonalExerciseHistory: () => {
        const usedExerciseIds = new Set();
        get().workoutTemplates.forEach((template) => {
            template.exercises.forEach((ex) => usedExerciseIds.add(ex.exerciseId));
        });
        return get().exercises.filter((ex) => usedExerciseIds.has(ex.id));
    },

    // --- Workout Session Management ---
    startWorkoutSession: async (templateId) => {
        const template = get().workoutTemplates.find(t => t.id === templateId);
        if (!template) {
            console.error('Template not found:', templateId);
            return;
        }

        get().resetRestTimer();
        get().stopSessionTimer();

        const newSession = {
            id: Date.now(),
            templateId,
            date: new Date().toISOString().slice(0, 10),
            startTime: Date.now(), // Workout session timer starts immediately
            endTime: null,
            exercises: template.exercises.map(ex => ({
                exerciseId: ex.exerciseId,
                loggedSets: [],
                plannedSets: ex.plannedSets,
            })),
        };
        await addWorkoutSessionToDB(newSession);
        set({ currentWorkoutSession: newSession });

        get().startSessionTimer(); // Start the session timer explicitly here
    },

    logSet: async (exerciseId, reps, weight, notes, parentSetId = null) => {
        const session = get().currentWorkoutSession;
        if (!session) {
            console.error('No active workout session to log set to.');
            return;
        }

        const newSet = {
            id: Date.now() + Math.random(),
            reps: Number(reps),
            weight: Number(weight),
            notes: notes,
            parentSetId: parentSetId,
            timestamp: Date.now(),
        };

        const updatedExercises = session.exercises.map(ex =>
            ex.exerciseId === exerciseId
                ? { ...ex, loggedSets: [...ex.loggedSets, newSet] }
                : ex
        );

        const updatedSession = { ...session, exercises: updatedExercises };
        await updateWorkoutSessionInDB(session.id, { exercises: updatedExercises });
        set({ currentWorkoutSession: updatedSession });

        // --- Rest Timer Logic ---
        if (parentSetId === null) { // Only start/reset rest timer if it's a main set completion
            get().startRestTimer();
        }

        // Check if this is the very last planned set of the entire workout
        const allPlannedMainSetsCount = session.exercises.reduce((total, ex) => total + ex.plannedSets, 0);
        const allLoggedMainSetsCount = updatedSession.exercises.reduce((total, ex) =>
            total + ex.loggedSets.filter(s => !s.parentSetId).length, 0
        );

        if (allLoggedMainSetsCount >= allPlannedMainSetsCount) {
            get().resetRestTimer(); // Stop the rest timer if all main sets are logged
        }
    },

    endWorkoutSession: async () => {
        const session = get().currentWorkoutSession;
        if (!session) return;

        const updatedSession = { ...session, endTime: Date.now() };
        await updateWorkoutSessionInDB(session.id, { endTime: updatedSession.endTime });
        set((state) => ({
            currentWorkoutSession: null,
            workoutHistory: [...state.workoutHistory, updatedSession],
        }));

        get().resetRestTimer();
        get().stopSessionTimer();
    },

    initWorkoutHistory: async () => {
        const history = await getAllWorkoutSessionsFromDB();
        set({ workoutHistory: history });
    },

    // --- Rest Timer Actions ---
    startRestTimer: () => {
        get().resetRestTimer(); // Always reset before starting
        // Use the defaultRestTime from settings
        const restTime = get().settings.defaultRestTime || DEFAULT_REST_TIME_SECONDS;

        const intervalId = setInterval(() => {
            set((state) => {
                if (state.restTimerSecondsLeft <= 1) {
                    clearInterval(state.restTimerIntervalId);
                    if (get().currentWorkoutSession) { // Check if a session is active
                        // playSound('/path/to/your/rest_timer_end_sound.mp3');
                        // vibrate();
                        console.log("Rest timer ended!");
                    }
                    return { restTimerSecondsLeft: 0, isRestTimerActive: false, restTimerIntervalId: null };
                }
                return { restTimerSecondsLeft: state.restTimerSecondsLeft - 1 };
            });
        }, 1000);
        set({
            restTimerSecondsLeft: restTime, // Use setting here
            isRestTimerActive: true,
            restTimerIntervalId: intervalId,
        });
    },

    resetRestTimer: () => {
        const currentIntervalId = get().restTimerIntervalId;
        if (currentIntervalId) {
            clearInterval(currentIntervalId);
        }
        set({ restTimerSecondsLeft: 0, isRestTimerActive: false, restTimerIntervalId: null });
    },

    // --- Session Timer Actions ---
    startSessionTimer: () => {
        if (!get().sessionTimerStartTime) {
            set({ sessionTimerStartTime: Date.now() });
            const intervalId = setInterval(() => {
                // Interval is just to trigger re-renders in UI if needed, actual time from startTime
            }, 1000);
            set({ sessionTimerIntervalId: intervalId });
        }
    },

    stopSessionTimer: () => {
        const currentIntervalId = get().sessionTimerIntervalId;
        if (currentIntervalId) {
            clearInterval(currentIntervalId);
        }
        set({ sessionTimerStartTime: null, sessionTimerIntervalId: null });
    },

    // --- Settings Actions ---
    setSetting: async (key, value) => {
        set((state) => {
            const updatedSettings = { ...state.settings, [key]: value };
            saveSettingsToDB(updatedSettings); // Persist immediately to IndexedDB
            return { settings: updatedSettings };
        });
    },
    initSettings: async () => {
        const storedSettings = await getSettingsFromDB();
        if (storedSettings) {
            // Apply stored settings, merging with defaults to ensure all keys exist
            set((state) => ({
                settings: { ...state.settings, ...storedSettings }
            }));
        }
    },
}));