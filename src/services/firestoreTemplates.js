import { firestore } from './firebase';
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../db/dexieDB';

function getUserTemplatesCollection(uid) {
  return collection(firestore, 'users', uid, 'templates');
}

// Add a template
export async function addTemplate(uid, template) {
  try {
    // Sanitize data for Firebase - ensure exercises array is properly formatted
    const sanitizedTemplate = {
      name: template.name || '',
      date: template.date || new Date().toISOString().slice(0, 10),
      exercises: Array.isArray(template.exercises) ? template.exercises.map(ex => ({
        exerciseId: ex.exerciseId || 0,
        plannedSets: ex.plannedSets || 0,
      })) : [],
      updatedAt: new Date().toISOString(),
    };
    
    const docRef = await addDoc(getUserTemplatesCollection(uid), sanitizedTemplate);
    return docRef.id;
  } catch (error) {
    console.error('Error adding template:', error);
    throw error;
  }
}

// Get all templates
export async function getAllTemplates(uid) {
  const snapshot = await getDocs(getUserTemplatesCollection(uid));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Update a template
export async function updateTemplate(uid, id, data) {
  try {
    const docRef = doc(firestore, 'users', uid, 'templates', id);
    
    // Sanitize data for Firebase - ensure exercises array is properly formatted
    const sanitizedData = {
      name: data.name || '',
      date: data.date || new Date().toISOString().slice(0, 10),
      exercises: Array.isArray(data.exercises) ? data.exercises.map(ex => ({
        exerciseId: ex.exerciseId || 0,
        plannedSets: ex.plannedSets || 0,
      })) : [],
      updatedAt: new Date().toISOString(),
    };
    
    // Use setDoc with merge option instead of updateDoc to handle non-existent documents
    await setDoc(docRef, sanitizedData, { merge: true });
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
}

// Delete a template
export async function deleteTemplate(uid, id) {
  const docRef = doc(firestore, 'users', uid, 'templates', id);
  await deleteDoc(docRef);
}

// Sync helpers
export async function syncTemplatesFromCloud(uid, setLocalTemplates) {
  try {
    const templates = await getAllTemplates(uid);
    
    // Ensure templates is an array
    const templatesArray = Array.isArray(templates) ? templates : [];
    
    // Clear existing local templates
    await db.workoutTemplates.clear();
    
    // Save Firebase data to local database
    for (const template of templatesArray) {
      await db.workoutTemplates.add(template);
    }
    
    // Update store
    setLocalTemplates(templatesArray);
  } catch (error) {
    console.error('Error syncing templates from cloud:', error);
    // Set empty array as fallback
    setLocalTemplates([]);
  }
}

export async function syncTemplatesToCloud(uid, localTemplates) {
  try {
    // Ensure localTemplates is an array
    const templatesArray = Array.isArray(localTemplates) ? localTemplates : [];
    
    for (const template of templatesArray) {
      if (!template.id) {
        await addTemplate(uid, template);
      } else {
        // Convert numeric ID to string for Firebase
        const firebaseId = String(template.id);
        await updateTemplate(uid, firebaseId, template);
      }
    }
  } catch (error) {
    console.error('Error syncing templates to cloud:', error);
  }
} 