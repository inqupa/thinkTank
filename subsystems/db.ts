// subsystems/db.ts
// Phase 2: Local IndexedDB Initialization and Storage

interface LocalVent {
    id?: number;
    content?: string;
    trackingId?: string;
}

const DB_NAME = 'VentDataStore';
const DB_VERSION = 1;

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const db = (event.target as IDBOpenDBRequest).result;
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

        request.onsuccess = (event: Event) => resolve((event.target as IDBOpenDBRequest).result);
        request.onerror = (event: Event) => reject((event.target as IDBOpenDBRequest).error);
    });
};

export const getAllVents = async (): Promise<LocalVent[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['vents'], 'readonly');
        const store = transaction.objectStore('vents');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result as LocalVent[]);
        request.onerror = () => reject(request.error);
    });
};

// Ensure functions remain accessible globally on the window object
(window as any).initDB = initDB;
(window as any).getAllVents = getAllVents;