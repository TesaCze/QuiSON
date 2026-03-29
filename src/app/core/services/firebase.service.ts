import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  setDoc,
  doc,
  query,
  where,
  Firestore,
  DocumentData,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBYrsRhvQjzMESsUOFrtojyOW_bnsmlZdw',
  authDomain: 'quison-5a879.firebaseapp.com',
  projectId: 'quison-5a879',
  storageBucket: 'quison-5a879.firebasestorage.app',
  messagingSenderId: '375307370240',
  appId: '1:375307370240:web:9a25fab07bc4291bac3de5',
};

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private app = initializeApp(firebaseConfig);
  private auth: Auth = getAuth(this.app);
  private firestore: Firestore = getFirestore(this.app);

  currentUser: User | null = null;

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
    });
  }

  signUp(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  signIn(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider);
  }

  signOut() {
    return signOut(this.auth);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async saveQuestions(questions: unknown[]) {
    if (!this.currentUser) throw new Error('User not authenticated');
    const questionsCol = collection(this.firestore, 'userQuestions');
    const batch = questions.map((q) => addDoc(questionsCol, { ...q as DocumentData, uid: this.currentUser!.uid }));
    return Promise.all(batch);
  }

  async loadQuestions() {
    if (!this.currentUser) throw new Error('User not authenticated');
    const questionsCol = collection(this.firestore, 'userQuestions');
    const q = query(questionsCol, where('uid', '==', this.currentUser.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  }

  async saveQuizConfig(name: string, config: any) {
    console.log('🔐 Firebase saveQuizConfig called');
    if (!this.currentUser) {
      console.error('❌ Not authenticated');
      throw new Error('User not authenticated');
    }
    
    console.log('👤 Current user:', this.currentUser.email, this.currentUser.uid);
    
    const sanitizedName = name.replace(/[^\w\s-]/g, '').trim();
    const configId = `${this.currentUser.uid}_${sanitizedName}_${Date.now()}`;
    const configDoc = doc(this.firestore, 'userQuizConfigs', configId);
    
    const payload: any = {
      id: configId,
      uid: this.currentUser.uid,
      name: name,
      questions: Array.isArray(config.questions) ? config.questions : [],
      count: typeof config.count === 'number' ? config.count : 0,
      shuffle: Boolean(config.shuffle),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('📦 Payload to save:', {
      ...payload,
      questions: `[${payload.questions.length} questions]`
    });
    
    try {
      const result = await setDoc(configDoc, payload);
      console.log('✅ Quiz config saved successfully with ID:', configId);
      return result;
    } catch (error: any) {
      console.error('❌ Firebase setDoc error:', error.code, error.message);
      throw error;
    }
  }

  async loadQuizConfigs() {
    if (!this.currentUser) throw new Error('User not authenticated');
    const configsCol = collection(this.firestore, 'userQuizConfigs');
    const q = query(configsCol, where('uid', '==', this.currentUser.uid));
    const snapshot = await getDocs(q);
    console.log('Loaded configs:', snapshot.size);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: data['id'] || docSnap.id,
        name: data['name'] || 'Untitled Quiz',
        questions: Array.isArray(data['questions']) ? data['questions'] : [],
        count: data['count'] || 0,
        shuffle: data['shuffle'] === true,
        createdAt: data['createdAt'],
        updatedAt: data['updatedAt']
      };
    });
  }

  async deleteQuizConfig(configId: string) {
    if (!this.currentUser) throw new Error('User not authenticated');
    const configDoc = doc(this.firestore, 'userQuizConfigs', configId);
    return deleteDoc(configDoc);
  }

  async saveUserHistory(history: unknown[]) {
    if (!this.currentUser) throw new Error('User not authenticated');
    const historyDoc = doc(this.firestore, 'userHistory', this.currentUser.uid);
    return setDoc(historyDoc, { 
      history: history as DocumentData[],
      uid: this.currentUser.uid,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  }

  async loadUserHistory() {
    if (!this.currentUser) throw new Error('User not authenticated');
    const historyDoc = doc(this.firestore, 'userHistory', this.currentUser.uid);
    const docSnap = await getDocs(query(collection(this.firestore, 'userHistory'), where('uid', '==', this.currentUser.uid)));
    if (docSnap.empty) return [];
    const data = docSnap.docs[0].data();
    return Array.isArray(data['history']) ? data['history'] : [];
  }

  async saveUserQuiz(userId: string, data: unknown) {
    const userDoc = doc(this.firestore, 'userQuizzes', userId);
    return setDoc(userDoc, data as DocumentData, { merge: true });
  }

  async getUserQuiz(userId: string) {
    const q = query(collection(this.firestore, 'userQuizzes'), where('uid', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}
