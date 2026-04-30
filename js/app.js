import { initAuth } from './auth.js';
import { loadSettings } from './settings.js';

loadSettings();

initAuth((uid) => {
  console.log('Authenticated:', uid);
});
