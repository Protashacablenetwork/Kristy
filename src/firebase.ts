import { initializeApp } from 'firebase/app';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import config from '../firebase-applet-config.json';

// Silence verbose internal Firestore backoff error messages
try {
  setLogLevel('silent');
} catch {}

const app = initializeApp({
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
  measurementId: config.measurementId
});

let dbInstance;
try {
  dbInstance = getFirestore(app, config.firestoreDatabaseId || undefined);
} catch (e) {
  console.warn('Named Firestore database failed, falling back to default:', e);
  dbInstance = getFirestore(app);
}

export const db = dbInstance;
export default app;
