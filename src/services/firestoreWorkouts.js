import { firestore } from './firebase';
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../db/dexieDB';

function getUserWorkoutsCollection(uid) {
  return collection(firestore, 'users', uid, 'workouts');
}

// Add a workout
export async function addWorkout(uid, workout) {
  try {
    // Sanitize data for Firebase - ensure exercises array is properly formatted
    const sanitizedWorkout = {
      templateId: workout.templateId || 0,
      date: workout.date || new Date().toISOString().slice(0, 10),
      startTime: workout.startTime || Date.now(),
      endTime: workout.endTime || null,
      exercises: Array.isArray(workout.exercises) ? workout.exercises.map(ex => ({
        exerciseId: ex.exerciseId || 0,
        plannedSets: ex.plannedSets || 0,
        loggedSets: Array.isArray(ex.loggedSets) ? ex.loggedSets.map(set => ({
          id: set.id || Date.now(),
          reps: set.reps || 0,
          weight: set.weight || 0,
          notes: set.notes || '',
          parentSetId: set.parentSetId || null,
          timestamp: set.timestamp || Date.now(),
        })) : [],
      })) : [],
      updatedAt: new Date().toISOString(),
    };
    
    const docRef = await addDoc(getUserWorkoutsCollection(uid), sanitizedWorkout);
    return docRef.id;
  } catch (error) {
    console.error('Error adding workout:', error);
    throw error;
  }
}

// Get all workouts
export async function getAllWorkouts(uid) {
  const snapshot = await getDocs(getUserWorkoutsCollection(uid));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Update a workout
export async function updateWorkout(uid, id, data) {
  try {
    console.log('updateWorkout called with:', { uid, id, data });
    console.log('data.exercises:', data.exercises);
    console.log('Array.isArray(data.exercises):', Array.isArray(data.exercises));
    
    const docRef = doc(firestore, 'users', uid, 'workouts', String(id));
    
    // Sanitize data for Firebase - ensure exercises array is properly formatted
    const sanitizedData = {
      templateId: data.templateId || 0,
      date: data.date || new Date().toISOString().slice(0, 10),
      startTime: data.startTime || Date.now(),
      endTime: data.endTime || null,
      exercises: Array.isArray(data.exercises) ? data.exercises.map(ex => {
        console.log('Processing exercise:', ex);
        console.log('ex.loggedSets:', ex.loggedSets);
        console.log('Array.isArray(ex.loggedSets):', Array.isArray(ex.loggedSets));
        
        return {
          exerciseId: ex.exerciseId || 0,
          plannedSets: ex.plannedSets || 0,
          loggedSets: Array.isArray(ex.loggedSets) ? ex.loggedSets.map(set => ({
            id: set.id || Date.now(),
            reps: set.reps || 0,
            weight: set.weight || 0,
            notes: set.notes || '',
            parentSetId: set.parentSetId || null,
            timestamp: set.timestamp || Date.now(),
          })) : [],
        };
      }) : [],
      updatedAt: new Date().toISOString(),
    };
    
    console.log('sanitizedData:', sanitizedData);
    
    // Use setDoc with merge option instead of updateDoc to handle non-existent documents
    await setDoc(docRef, sanitizedData, { merge: true });
  } catch (error) {
    console.error('Error updating workout:', error);
    throw error;
  }
}

// Delete a workout
export async function deleteWorkout(uid, id) {
  const docRef = doc(firestore, 'users', uid, 'workouts', id);
  await deleteDoc(docRef);
}

// Sync helpers (to be called from your sync logic)
export async function syncWorkoutsFromCloud(uid, setLocalWorkouts) {
  try {
    const workouts = await getAllWorkouts(uid);
    
    // Ensure workouts is an array
    const workoutsArray = Array.isArray(workouts) ? workouts : [];
    
    // Clear existing local workout sessions
    await db.workoutSessions.clear();
    
    // Save Firebase data to local database
    for (const workout of workoutsArray) {
      await db.workoutSessions.add(workout);
    }
    
    // Update store
    setLocalWorkouts(workoutsArray);
  } catch (error) {
    console.error('Error syncing workouts from cloud:', error);
    // Set empty array as fallback
    setLocalWorkouts([]);
  }
}

export async function syncWorkoutsToCloud(uid, localWorkouts) {
  try {
    // Ensure localWorkouts is an array
    const workoutsArray = Array.isArray(localWorkouts) ? localWorkouts : [];
    
    // For simplicity, push all local workouts to Firestore (could be optimized)
    for (const workout of workoutsArray) {
      if (!workout.id) {
        await addWorkout(uid, workout);
      } else {
        // Convert numeric ID to string for Firebase
        const firebaseId = String(workout.id);
        await updateWorkout(uid, firebaseId, workout);
      }
    }
  } catch (error) {
    console.error('Error syncing workouts to cloud:', error);
  }
} 