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
import { addExercise } from '../services/firestoreExercises';
import { addTemplate } from '../services/firestoreTemplates';
import { addWorkout, syncWorkoutsFromCloud } from '../services/firestoreWorkouts';
import { updateWorkout } from '../services/firestoreWorkouts';

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
    addExercise: async (exercise, uid) => {
        await addExerciseToDB(exercise);
        if (uid) {
            await addExercise(uid, exercise);
        }
        const exercises = await getAllExercisesFromDB();
        set({ exercises: Array.isArray(exercises) ? exercises : [] });
    },
    initExercises: async () => {
        const exercises = await getAllExercisesFromDB();
        set({ exercises: Array.isArray(exercises) ? exercises : [] });
    },
    removeExercise: async (exerciseId) => {
        await deleteExerciseFromDB(exerciseId);
        set((state) => ({
            exercises: Array.isArray(state.exercises) ? state.exercises.filter((ex) => ex.id !== exerciseId) : [],
        }));
    },
    listExercises: () => get().exercises || [],
    listExercisesByCategory: (category) => {
        const exercises = get().exercises;
        return Array.isArray(exercises) ? exercises.filter((ex) => ex.category === category) : [];
    },

    // --- Workout Template Management ---
    addWorkoutTemplate: async (template, uid) => {
        await addWorkoutTemplateToDB(template);
        if (uid) await addTemplate(uid, template);
        const workoutTemplates = await getAllWorkoutTemplatesFromDB();
        set({ workoutTemplates: Array.isArray(workoutTemplates) ? workoutTemplates : [] });
    },
    initWorkoutTemplates: async () => {
        const workoutTemplates = await getAllWorkoutTemplatesFromDB();
        set({ workoutTemplates: Array.isArray(workoutTemplates) ? workoutTemplates : [] });
    },
    removeWorkoutTemplate: async (templateId) => {
        await deleteWorkoutTemplateFromDB(templateId);
        await deleteWorkoutSessionsByTemplateId(templateId);

        set((state) => ({
            workoutTemplates: Array.isArray(state.workoutTemplates) ? state.workoutTemplates.filter((t) => t.id !== templateId) : [],
            currentWorkoutSession: state.currentWorkoutSession?.templateId === templateId
                ? null
                : state.currentWorkoutSession,
            workoutHistory: Array.isArray(state.workoutHistory) ? state.workoutHistory.filter((session) => session.templateId !== templateId) : [],
        }));
    },

    // --- Workout Session Management ---
    getMostRecentWorkoutSession: async (templateId) => {
        // Use the store's workoutHistory state instead of reading from Dexie
        const history = get().workoutHistory || [];
        
        // Only consider sessions with at least one main set logged (not just subsets)
        const templateSessions = Array.isArray(history) 
            ? history.filter(session => {
                if (String(session.templateId) !== String(templateId) || !session.endTime) return false;
                // Check if at least one exercise has a main set (parentSetId === null)
                return Array.isArray(session.exercises) && session.exercises.some(ex =>
                    Array.isArray(ex.loggedSets) && ex.loggedSets.some(set => !set.parentSetId)
                );
            })
            : [];
        
        if (templateSessions.length === 0) return null;
        
        // Sort by endTime descending and get the most recent
        return templateSessions.sort((a, b) => b.endTime - a.endTime)[0];
    },

    startWorkoutSession: async (templateId, user = null) => {
        const template = Array.isArray(get().workoutTemplates) ? get().workoutTemplates.find(t => t.id === templateId) : null;
        if (!template) {
            console.error('Template not found:', templateId);
            return;
        }

        get().resetRestTimer();
        get().stopSessionTimer();

        // Get the most recent completed workout session for this template
        const previousSession = await get().getMostRecentWorkoutSession(templateId);

        const newSession = {
            templateId,
            date: new Date().toISOString().slice(0, 10),
            startTime: Date.now(),
            endTime: null,
            exercises: Array.isArray(template.exercises) ? template.exercises.map(ex => ({
                exerciseId: ex.exerciseId,
                loggedSets: [],
                plannedSets: ex.plannedSets,
            })) : [],
        };

        const sessionId = await addWorkoutSessionToDB(newSession);
        const sessionWithId = { ...newSession, id: sessionId };
        
        // Also sync to Firebase if user is provided
        if (user) {
            try {
                await addWorkout(user.uid, sessionWithId);
            } catch (error) {
                console.error('Error syncing workout session to Firebase:', error);
            }
        }
        
        set({ currentWorkoutSession: sessionWithId });
        get().startSessionTimer();

        // Return previous session data for pre-population
        return previousSession;
    },

    logSet: async (exerciseId, reps, weight, notes, parentSetId = null, user = null, isPersonalBest = false) => {
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
            isPersonalBest: !!isPersonalBest,
        };

        const exercises = Array.isArray(session.exercises) ? session.exercises : [];
        const updatedExercises = exercises.map(ex => {
            const loggedSets = Array.isArray(ex.loggedSets) ? ex.loggedSets : [];
            return ex.exerciseId === exerciseId
                ? { ...ex, loggedSets: [...loggedSets, newSet] }
                : ex;
        });

        const updatedSession = { ...session, exercises: updatedExercises };
        await updateWorkoutSessionInDB(session.id, { exercises: updatedExercises });
        
        // Also sync to Firebase if user is provided
        if (user) {
            try {
                await updateWorkout(user.uid, session.id, updatedSession);
            } catch (error) {
                console.error('Error syncing set to Firebase:', error);
            }
        }
        
        set({ currentWorkoutSession: updatedSession });

        if (parentSetId === null) {
            get().startRestTimer();
        }

        const allPlannedMainSetsCount = exercises.reduce((total, ex) => total + (ex.plannedSets || 0), 0);
        const allLoggedMainSetsCount = updatedExercises.reduce((total, ex) => {
            const loggedSets = Array.isArray(ex.loggedSets) ? ex.loggedSets : [];
            return total + loggedSets.filter(s => !s.parentSetId).length;
        }, 0);

        if (allLoggedMainSetsCount >= allPlannedMainSetsCount) {
            get().resetRestTimer();
        }
    },

    endWorkoutSession: async (user = null) => {
        const session = get().currentWorkoutSession;
        if (!session) return;

        const updatedSession = { ...session, endTime: Date.now() };
        await updateWorkoutSessionInDB(session.id, { endTime: updatedSession.endTime });
        
        // Also sync to Firebase if user is provided
        if (user) {
            try {
                await updateWorkout(user.uid, session.id, updatedSession);
            } catch (error) {
                console.error('Error syncing workout end to Firebase:', error);
            }
            // Re-sync from Firebase to get the latest history
            try {
                await syncWorkoutsFromCloud(user.uid, (data) => {
                    set({ workoutHistory: Array.isArray(data) ? data : [] });
                });
            } catch (error) {
                console.error('Error syncing workouts from Firebase after ending session:', error);
            }
        } else {
            // Refresh workout history from database to ensure consistency
            const history = await getAllWorkoutSessionsFromDB();
            set((state) => ({
                currentWorkoutSession: null,
                workoutHistory: Array.isArray(history) ? history : [],
            }));
        }

        set({ currentWorkoutSession: null });
        get().resetRestTimer();
        get().stopSessionTimer();
    },

    initWorkoutHistory: async () => {
        const history = await getAllWorkoutSessionsFromDB();
        set({ workoutHistory: Array.isArray(history) ? history : [] });
    },

    // --- Rest Timer Actions ---
    startRestTimer: () => {
        get().resetRestTimer();
        const restTime = get().settings.defaultRestTime || DEFAULT_REST_TIME_SECONDS;

        const intervalId = setInterval(() => {
            set((state) => {
                if (state.restTimerSecondsLeft <= 1) {
                    clearInterval(state.restTimerIntervalId);
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

    clearAll: () => set({
        workoutTemplates: [],
        exercises: [],
        workoutHistory: [],
        currentWorkoutSession: null,
        // Add any other state you want to clear
    }),
    setWorkoutHistory: (workoutHistory) => set({ workoutHistory: Array.isArray(workoutHistory) ? workoutHistory : [] }),
    setExercises: (exercises) => set({ exercises: Array.isArray(exercises) ? exercises : [] }),
    setWorkoutTemplates: (workoutTemplates) => set({ workoutTemplates: Array.isArray(workoutTemplates) ? workoutTemplates : [] }),

    // --- Workout Session Management ---
    addWorkoutSession: async (session, uid) => {
        await addWorkoutSessionToDB(session);
        if (uid) {
            await addWorkout(uid, session);
        }
        // Optionally update local state here if needed
    },
}));