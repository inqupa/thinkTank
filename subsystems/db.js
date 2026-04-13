// Phase 3.1: Initialize IndexedDB for Scalable Storage
const DB_NAME = 'VentDataStore';
const DB_VERSION = 1;

window.initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // Create a store for 'vents' (problems/posts)
            if (!db.objectStoreNames.contains('vents')) {
                db.createObjectStore('vents', { keyPath: 'id', autoIncrement: true });
            }
            // Create a store for 'userSettings'
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }
            console.log("Phase 3.1: Database Stores Created");
        };

        request.onsuccess = (event) => {
            console.log("Phase 3.1: IndexedDB Initialized Successfully");
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error("Phase 3.1: Database Error", event.target.error);
            reject(event.target.error);
        };
    });
};