import Dexie from 'dexie';

export const db = new Dexie('FitNotesDB');

// Increment the version for schema changes
db.version(4).stores({
    workoutTemplates: '++id, date, name, exercises', // 'exercises' here will contain exerciseId and plannedSets
    exercises: '++id, name, category',
    workoutSessions: '++id,templateId, date, startTime, endTime',
    settings: 'id',
}).upgrade(tx => {
});


// Add a workout template
export async function addWorkoutTemplateToDB(template) {
    return await db.workoutTemplates.add(template);
}

// Get all workout templates
export async function getAllWorkoutTemplatesFromDB() {
    return await db.workoutTemplates.toArray();
}

// Delete a workout template
export async function deleteWorkoutTemplateFromDB(id) {
    return await db.workoutTemplates.delete(id);
}

// Delete all workout sessions associated with a template
export async function deleteWorkoutSessionsByTemplateId(templateId) {
    return await db.workoutSessions.where('templateId').equals(templateId).delete();
}

// Add an exercise
export async function addExerciseToDB(exercise) {
    return await db.exercises.add(exercise);
}

// Get all exercises
export async function getAllExercisesFromDB() {
    return await db.exercises.toArray();
}

// Delete an exercise
export async function deleteExerciseFromDB(id) {
    return await db.exercises.delete(id);
}

/workouts/;
// Add a workout
export async function addWorkoutToDB(workout) {
    return await db.workouts.add(workout);
}

// Get all workouts
export async function getAllWorkoutsFromDB() {
    return await db.workouts.toArray();
}

/sets/;
// Add a set
export async function addSetToDB(set) {
    return await db.sets.add(set);
}

// Get all sets for a workout
export async function getSetsByWorkoutFromDB(workoutId) {
    return await db.sets.where('workoutId').equals(workoutId).toArray();
}

// Get all sets for an exercise in a workout
export async function getSetsByExerciseFromDB(workoutId, exerciseId) {
    return await db.sets
        .where({ workoutId, exerciseId })
        .toArray();
}

// Add a new workout session
export async function addWorkoutSessionToDB(session) {
    return await db.workoutSessions.add(session);
}

// Get a specific workout session by ID
export async function getWorkoutSessionByIdFromDB(id) {
    return await db.workoutSessions.get(id);
}

// Update a workout session (e.g., add logged sets, end time)
export async function updateWorkoutSessionInDB(id, changes) {
    return await db.workoutSessions.update(id, changes);
}

// Get all workout sessions (for history)
export async function getAllWorkoutSessionsFromDB() {
    return await db.workoutSessions.toArray();
}

// --- Settings Functions ---
const SETTINGS_ID = 'user_settings'; // A fixed ID for our single settings object

export async function saveSettingsToDB(settings) {
    // Use put to insert or update the single settings object
    return await db.settings.put({ id: SETTINGS_ID, ...settings });
}

export async function getSettingsFromDB() {
    return await db.settings.get(SETTINGS_ID);
}

// Clear all tables (for user switch)
export async function clearAllTables() {
    await Promise.all([
        db.workoutTemplates.clear(),
        db.exercises.clear(),
        db.workoutSessions.clear(),
        db.settings.clear(),
        db.workouts?.clear?.(), // in case workouts table exists
        db.sets?.clear?.(),     // in case sets table exists
    ]);
}

export default db;