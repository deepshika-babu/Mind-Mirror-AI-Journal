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
import type { JournalEntry, UserProfile, ReflectionInsight } from '../types.ts';
import firebaseConfigRaw from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigRaw.apiKey,
  authDomain: firebaseConfigRaw.authDomain,
  projectId: firebaseConfigRaw.projectId,
  storageBucket: firebaseConfigRaw.storageBucket,
  messagingSenderId: firebaseConfigRaw.messagingSenderId,
  appId: firebaseConfigRaw.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

const databaseId = firebaseConfigRaw.firestoreDatabaseId && firebaseConfigRaw.firestoreDatabaseId !== '(default)'
  ? firebaseConfigRaw.firestoreDatabaseId
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
export async function fetchUserInsight(userId: string, entryId: string) {
  if (!userId || !entryId) return null;
  try {
    const insightRef = doc(db, 'users', userId, 'insights', `insight_${entryId}`);
    const snap = await getDoc(insightRef);
    if (!snap.exists()) return null;
    return snap.data();
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
