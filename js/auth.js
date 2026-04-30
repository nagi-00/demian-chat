import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { firebaseConfig } from '../firebase-config.js';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export let uid = null;

export function initAuth(onReady) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      uid = user.uid;
      onReady(uid);
    } else {
      signInAnonymously(auth).catch(err => {
        console.error('Auth failed:', err);
      });
    }
  });
}
