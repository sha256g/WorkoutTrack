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
    saveSettingsToDB,
    getSettingsFromDB,
} from '../db/dexieDB';

const DEFAULT_REST_TIME_SECONDS = 60;

export const useStore = create((set, get) => ({
    workoutTemplates: [],
    exercises: [],
    workoutHistory: [],
    currentWorkoutSession: null,
    restTimerSecondsLeft: 0,
    isRestTimerActive: false,
    restTimerIntervalId: null,
    sessionTimerStartTime: null,
    sessionTimerIntervalId: null,
    settings: {
        defaultRestTime: DEFAULT_REST_TIME_SECONDS,
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
        await deleteWorkoutTemplateFromDB(templateId);
        await deleteWorkoutSessionsByTemplateId(templateId);

        set((state) => ({
            workoutTemplates: state.workoutTemplates.filter((t) => t.id !== templateId),
            currentWorkoutSession: state.currentWorkoutSession?.templateId === templateId
                ? null
                : state.currentWorkoutSession,
            workoutHistory: state.workoutHistory.filter((session) => session.templateId !== templateId),
        }));
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
            startTime: Date.now(),
            endTime: null,
            exercises: template.exercises.map(ex => ({
                exerciseId: ex.exerciseId,
                loggedSets: [],
                plannedSets: ex.plannedSets,
            })),
        };

        await addWorkoutSessionToDB(newSession);
        set({ currentWorkoutSession: newSession });
        get().startSessionTimer();
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

        if (parentSetId === null) {
            get().startRestTimer();
        }

        const allPlannedMainSetsCount = session.exercises.reduce((total, ex) => total + ex.plannedSets, 0);
        const allLoggedMainSetsCount = updatedSession.exercises.reduce((total, ex) =>
            total + ex.loggedSets.filter(s => !s.parentSetId).length, 0
        );

        if (allLoggedMainSetsCount >= allPlannedMainSetsCount) {
            get().resetRestTimer();
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
        get().resetRestTimer();
        const restTime = get().settings.defaultRestTime || DEFAULT_REST_TIME_SECONDS;

        const intervalId = setInterval(() => {
            set((state) => {
                if (state.restTimerSecondsLeft <= 1) {
                    clearInterval(state.restTimerIntervalId);
                    if (get().currentWorkoutSession) {
                        console.log("Rest timer ended!");
                    }
                    return { restTimerSecondsLeft: 0, isRestTimerActive: false, restTimerIntervalId: null };
                }
                return { restTimerSecondsLeft: state.restTimerSecondsLeft - 1 };
            });
        }, 1000);
        set({
            restTimerSecondsLeft: restTime,
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
                // Interval is just to trigger re-renders in UI if needed
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
            saveSettingsToDB(updatedSettings);
            return { settings: updatedSettings };
        });
    },
    initSettings: async () => {
        const storedSettings = await getSettingsFromDB();
        if (storedSettings) {
            set((state) => ({
                settings: { ...state.settings, ...storedSettings }
            }));
        }
    },
}));