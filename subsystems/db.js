// Phase 3.1 & 3.2: IndexedDB Initialization and Data Access Object (DAO)
const DB_NAME = 'VentDataStore';
const DB_VERSION = 1;

window.initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('vents')) {
                db.createObjectStore('vents', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
};

// Phase 3.2: Data Access Object (DAO) Methods

// Save a new vent (problem) to the database
window.saveVent = async function(ventData) {
    try {
        const response = await fetch('/api/vent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ventData)
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Server rejected vent");

        // Save the Vent Tracking ID locally so the anonymous ventor keeps a receipt
        let localReceipts = JSON.parse(localStorage.getItem('my_vent_receipts') || '[]');
        localReceipts.push({
            trackingId: result.trackingId,
            date: new Date().toISOString(),
            preview: ventData.content.substring(0, 30) + '...'
        });
        localStorage.setItem('my_vent_receipts', JSON.stringify(localReceipts));

        return result;
    } catch (err) {
        console.error("Database save failed:", err);
        throw err;
    }
};

// Retrieve all vents from the database
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

window.getVents = async function() {
    try {
        const response = await fetch('/api/vents', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        return await response.json();
    } catch (err) {
        console.error("Failed to fetch vents:", err);
        return []; // Return empty array to prevent frontend crashes
    }
};