import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Auth Helpers
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

// Firestore Helpers
export const getUserProfile = async (uid: string) => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

export const createUserProfile = async (user: FirebaseUser) => {
  const docRef = doc(db, 'users', user.uid);
  const profile = {
    uid: user.uid,
    displayName: user.displayName || 'Student',
    email: user.email,
    photoURL: user.photoURL,
    level: 1,
    xp: 0,
    rank: 'Novice Scholar',
    badges: [],
    createdAt: new Date().toISOString()
  };
  await setDoc(docRef, profile, { merge: true });
  return profile;
};

export const updateXP = async (uid: string, xpToAdd: number) => {
  const docRef = doc(db, 'users', uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    const newXP = (data.xp || 0) + xpToAdd;
    const newLevel = Math.floor(newXP / 1000) + 1;
    
    const ranks = [
      'Novice Scholar',
      'Apprentice Researcher',
      'Dedicated Student',
      'Academic Explorer',
      'Knowledge Seeker',
      'Insightful Analyst',
      'Master Learner',
      'Distinguished Scholar',
      'Academic Luminary',
      'Grand Sage'
    ];
    const newRank = ranks[Math.min(newLevel - 1, ranks.length - 1)];

    await updateDoc(docRef, { 
      xp: newXP, 
      level: newLevel,
      rank: newRank
    });
  }
};

// Projects Helpers
export const createProject = async (uid: string, title: string, deadline: string) => {
  const docRef = await addDoc(collection(db, 'projects'), {
    uid,
    title,
    deadline,
    status: 'In Progress',
    tasks: [],
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const updateProjectStatus = async (projectId: string, status: string) => {
  const docRef = doc(db, 'projects', projectId);
  await updateDoc(docRef, { status });
};

export const deleteProject = async (projectId: string) => {
  const docRef = doc(db, 'projects', projectId);
  await deleteDoc(docRef);
};

// Marks Helpers
export const updateMark = async (uid: string, subject: string, value: number) => {
  const q = query(collection(db, 'marks'), where('uid', '==', uid), where('subject', '==', subject));
  const snap = await getDocs(q);
  if (snap.empty) {
    await addDoc(collection(db, 'marks'), {
      uid,
      subject,
      value,
      date: new Date().toISOString().split('T')[0]
    });
  } else {
    const docRef = doc(db, 'marks', snap.docs[0].id);
    await updateDoc(docRef, { value, date: new Date().toISOString().split('T')[0] });
  }
};
