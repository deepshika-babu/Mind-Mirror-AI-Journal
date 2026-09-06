import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  Firestore,
} from 'firebase/firestore';
import type { JournalEntry, UserProfile, ReflectionInsight, MemoryThread, WeeklyReflection } from '../types.ts';
import firebaseConfigRaw from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) || firebaseConfigRaw.apiKey,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) || firebaseConfigRaw.authDomain,
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) || firebaseConfigRaw.projectId,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) || firebaseConfigRaw.storageBucket,
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined) || firebaseConfigRaw.messagingSenderId,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined) || firebaseConfigRaw.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

const rawDbId = (import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string | undefined) || firebaseConfigRaw.firestoreDatabaseId;
const databaseId = rawDbId && rawDbId !== '(default)'
  ? rawDbId
  : undefined;

export const db: Firestore = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sanitizes an object to remove undefined values, ensuring Firestore write safety.
 */
export function cleanPayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (value === undefined ? null : value))
  );
}

/**
 * Authenticate with Google popup (with redirect fallback for restricted environments)
 */
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.warn('Popup sign in failed, trying redirect if applicable');
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') {
      await signInWithRedirect(auth, googleProvider);
      throw new Error('Redirecting to Google sign in...');
    }
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Maps Firebase user to UserProfile
 */
export function mapFirebaseUser(user: User | null): UserProfile | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'Reflective Writer',
    photoURL: user.photoURL,
  };
}

/**
 * Firestore data operations strictly isolated to the authenticated user's subcollection:
 * Path: users/{userId}/entries/{entryId}
 */

export async function fetchUserEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) throw new Error('User ID is required to fetch isolated entries.');
  const userEntriesRef = collection(db, 'users', userId, 'entries');
  const q = query(userEntriesRef, orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);

  const entries: JournalEntry[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as JournalEntry;
    entries.push({
      ...data,
      id: docSnap.id,
      turns: Array.isArray(data.turns) ? data.turns : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
    });
  });
  return entries;
}

export async function saveUserEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId) throw new Error('User ID is required to persist entry.');
  if (!entry.id) throw new Error('Entry ID is required.');

  const entryRef = doc(db, 'users', userId, 'entries', entry.id);
  const payload = cleanPayload({
    ...entry,
    userId,
    updatedAt: Date.now(),
  });

  await setDoc(entryRef, payload, { merge: true });
}

export async function deleteUserEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) throw new Error('User ID and Entry ID are required.');
  const batch = writeBatch(db);
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  const insightRef = doc(db, 'users', userId, 'insights', `insight_${entryId}`);
  batch.delete(entryRef);
  batch.delete(insightRef);
  await batch.commit();
}

/**
 * Fetch existing stored insight for a given entry
 */
export async function fetchUserInsight(userId: string, entryId: string): Promise<ReflectionInsight | null> {
  if (!userId || !entryId) return null;
  try {
    const insightRef = doc(db, 'users', userId, 'insights', `insight_${entryId}`);
    const snap = await getDoc(insightRef);
    if (!snap.exists()) return null;
    return snap.data() as ReflectionInsight;
  } catch {
    console.warn(`Could not load insight for ${entryId}`);
    return null;
  }
}

/**
 * Save insight directly to user-isolated Firestore subcollection
 */
export async function saveUserInsight(userId: string, insight: ReflectionInsight): Promise<void> {
  if (!userId || !insight || !insight.entryId) return;
  try {
    const insightDocId = insight.id || `insight_${insight.entryId}`;
    const insightRef = doc(db, 'users', userId, 'insights', insightDocId);
    await setDoc(insightRef, cleanPayload(insight), { merge: true });
  } catch (err) {
    console.warn('Could not persist insight to Firestore from client:', err);
  }
}

/**
 * Fetch all stored insights for a user
 */
export async function fetchUserInsights(userId: string): Promise<ReflectionInsight[]> {
  if (!userId) return [];
  try {
    const insightsRef = collection(db, 'users', userId, 'insights');
    const snap = await getDocs(insightsRef);
    const insights: ReflectionInsight[] = [];
    snap.forEach((docSnap) => {
      insights.push(docSnap.data() as ReflectionInsight);
    });
    return insights;
  } catch (err) {
    console.warn('Could not load user insights:', err);
    return [];
  }
}

/**
 * Fetch stored Memory Threads for a user
 */
export async function fetchUserThreads(userId: string): Promise<MemoryThread[]> {
  if (!userId) return [];
  try {
    const threadsRef = collection(db, 'users', userId, 'threads');
    const snap = await getDocs(threadsRef);
    const threads: MemoryThread[] = [];
    snap.forEach((docSnap) => {
      threads.push({
        ...(docSnap.data() as MemoryThread),
        id: docSnap.id,
      });
    });
    // Sort client-side by generatedAt descending
    return threads.sort((a, b) => (b.generatedAt || 0) - (a.generatedAt || 0));
  } catch (err) {
    console.warn('Could not load memory threads:', err);
    return [];
  }
}

/**
 * Save Memory Threads to Firestore with payload hygiene
 */
export async function saveUserThreads(userId: string, threads: MemoryThread[]): Promise<void> {
  if (!userId || !Array.isArray(threads)) return;
  try {
    const batch = writeBatch(db);
    for (const thread of threads) {
      const threadRef = doc(db, 'users', userId, 'threads', thread.id);
      batch.set(threadRef, cleanPayload(thread), { merge: true });
    }
    await batch.commit();
  } catch (err) {
    console.warn('Could not persist memory threads to Firestore:', err);
    throw err;
  }
}

/**
 * Delete a single Memory Thread
 */
export async function deleteUserThread(userId: string, threadId: string): Promise<void> {
  if (!userId || !threadId) return;
  try {
    const threadRef = doc(db, 'users', userId, 'threads', threadId);
    await deleteDoc(threadRef);
  } catch (err) {
    console.warn(`Could not delete memory thread ${threadId}:`, err);
    throw err;
  }
}

/**
 * Fetch all stored Weekly Reflections for a user
 */
export async function fetchUserWeeklyReflections(userId: string): Promise<WeeklyReflection[]> {
  if (!userId) return [];
  try {
    const weeklyRef = collection(db, 'users', userId, 'weeklyReflections');
    const snap = await getDocs(weeklyRef);
    const reflections: WeeklyReflection[] = [];
    snap.forEach((docSnap) => {
      reflections.push({
        ...(docSnap.data() as WeeklyReflection),
        id: docSnap.id,
      });
    });
    return reflections.sort((a, b) => (b.startDate || 0) - (a.startDate || 0));
  } catch (err) {
    console.warn('Could not load weekly reflections from Firestore:', err);
    return [];
  }
}

/**
 * Fetch a single cached Weekly Reflection by weekKey
 */
export async function fetchUserWeeklyReflection(
  userId: string,
  weekKey: string
): Promise<WeeklyReflection | null> {
  if (!userId || !weekKey) return null;
  try {
    const docRef = doc(db, 'users', userId, 'weeklyReflections', `weekly_${weekKey}`);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as WeeklyReflection;
  } catch (err) {
    console.warn(`Could not fetch weekly reflection for ${weekKey}:`, err);
    return null;
  }
}

/**
 * Save a Weekly Reflection with strict undefined stripping
 */
export async function saveUserWeeklyReflection(
  userId: string,
  reflection: WeeklyReflection
): Promise<void> {
  if (!userId || !reflection || !reflection.weekKey) return;
  try {
    const docId = reflection.id || `weekly_${reflection.weekKey}`;
    const docRef = doc(db, 'users', userId, 'weeklyReflections', docId);
    await setDoc(docRef, cleanPayload(reflection), { merge: true });
  } catch (err) {
    console.warn(`Could not persist weekly reflection ${reflection.weekKey}:`, err);
    throw err;
  }
}

/**
 * Delete a single Weekly Reflection
 */
export async function deleteUserWeeklyReflection(
  userId: string,
  docIdOrWeekKey: string
): Promise<void> {
  if (!userId || !docIdOrWeekKey) return;
  try {
    const docId = docIdOrWeekKey.startsWith('weekly_') ? docIdOrWeekKey : `weekly_${docIdOrWeekKey}`;
    const docRef = doc(db, 'users', userId, 'weeklyReflections', docId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn(`Could not delete weekly reflection ${docIdOrWeekKey}:`, err);
    throw err;
  }
}


