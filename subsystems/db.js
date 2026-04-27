// subsystems/db.js
// Phase 2: Local IndexedDB Initialization and Storage

/**
 * @typedef {Object} LocalVent
 * @property {number} [id] - The auto-incremented local identifier.
 * @property {string} [content] - The text content of the vent.
 * @property {string} [trackingId] - The server-side tracking ID.
 */

const DB_NAME = 'VentDataStore';
const DB_VERSION = 1;

/**
 * Initializes the local IndexedDB database, creating object stores if they don't exist.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the active database connection.
 */
window.initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('vents')) {
                db.createObjectStore('vents', {
                    keyPath: 'id',
                    autoIncrement: true
                });
            }
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
};

/**
 * Retrieves all locally stored vents from the IndexedDB.
 * @returns {Promise<Array<LocalVent>>} A promise that resolves to an array of stored vent objects.
 */
window.getAllVents = async () => {
    const db = await window.initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['vents'], 'readonly');
        const store = transaction.objectStore('vents');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};