// subsystems/db.js
// Phase 2: Local IndexedDB Initialization and Storage
const DB_NAME = 'VentDataStore';
const DB_VERSION = 1;

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

// Retrieve all vents from the local database
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
