import { firestore } from './firebase';
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../db/dexieDB';

function getUserExercisesCollection(uid) {
  return collection(firestore, 'users', uid, 'exercises');
}

// Add an exercise
export async function addExercise(uid, exercise) {
  try {
    // Sanitize data for Firebase - only include basic fields
    const sanitizedExercise = {
      name: exercise.name || '',
      category: exercise.category || '',
      updatedAt: new Date().toISOString(),
    };
    
    const docRef = await addDoc(getUserExercisesCollection(uid), sanitizedExercise);
    return docRef.id;
  } catch (error) {
    console.error('Error adding exercise:', error);
    throw error;
  }
}

// Get all exercises
export async function getAllExercises(uid) {
  const snapshot = await getDocs(getUserExercisesCollection(uid));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Update an exercise
export async function updateExercise(uid, id, data) {
  try {
    const docRef = doc(firestore, 'users', uid, 'exercises', id);
    
    // Sanitize data for Firebase - only include basic fields
    const sanitizedData = {
      name: data.name || '',
      category: data.category || '',
      updatedAt: new Date().toISOString(),
    };
    
    // Use setDoc with merge option instead of updateDoc to handle non-existent documents
    await setDoc(docRef, sanitizedData, { merge: true });
  } catch (error) {
    console.error('Error updating exercise:', error);
    throw error;
  }
}

// Delete an exercise
export async function deleteExercise(uid, id) {
  const docRef = doc(firestore, 'users', uid, 'exercises', id);
  await deleteDoc(docRef);
}

// Sync helpers
export async function syncExercisesFromCloud(uid, setLocalExercises) {
  try {
    const exercises = await getAllExercises(uid);
    
    // Ensure exercises is an array
    const exercisesArray = Array.isArray(exercises) ? exercises : [];
    
    // Clear existing local exercises
    await db.exercises.clear();
    
    // Save Firebase data to local database
    for (const exercise of exercisesArray) {
      await db.exercises.add(exercise);
    }
    
    // Update store
    setLocalExercises(exercisesArray);
  } catch (error) {
    console.error('Error syncing exercises from cloud:', error);
    // Set empty array as fallback
    setLocalExercises([]);
  }
}

export async function syncExercisesToCloud(uid, localExercises) {
  try {
    // Ensure localExercises is an array
    const exercisesArray = Array.isArray(localExercises) ? localExercises : [];
    
    for (const exercise of exercisesArray) {
      if (!exercise.id) {
        await addExercise(uid, exercise);
      } else {
        // Convert numeric ID to string for Firebase
        const firebaseId = String(exercise.id);
        await updateExercise(uid, firebaseId, exercise);
      }
    }
  } catch (error) {
    console.error('Error syncing exercises to cloud:', error);
  }
} 