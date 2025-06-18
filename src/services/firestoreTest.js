import { firestore } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

// Add a test document
export async function addTestDoc() {
  try {
    const docRef = await addDoc(
      collection(firestore, 'testCollection'),
      {
        message: 'Hello from FitNotes!',
        timestamp: new Date()
      }
    );
    console.log('Document written with ID: ', docRef.id);
    return docRef.id;
  } catch (e) {
    console.error('Error adding document: ', e);
  }
}

// Read all test documents
export async function getTestDocs() {
  try {
    const snapshot = await getDocs(collection(firestore, 'testCollection'));
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Fetched docs:', docs);
    return docs;
  } catch (e) {
    console.error('Error fetching documents: ', e);
  }
} 