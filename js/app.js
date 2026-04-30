import { initAuth } from './auth.js';

initAuth((uid) => {
  console.log('Authenticated:', uid);
});
