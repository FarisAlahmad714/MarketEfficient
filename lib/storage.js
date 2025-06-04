// lib/storage.js
import storageCompat from './storageCompat';

// Directly export the storageCompat instance, which is already configured
// to use secureStorage and handles its own errors and logging.
export default storageCompat;