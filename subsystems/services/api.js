/**
 * @typedef {Object} VentData
 * @property {string} content - The text content of the vent to be saved.
 */

/**
 * Saves a new vent to the database and keeps a local receipt in localStorage.
 * * @param {VentData} ventData - The data for the vent being created.
 * @returns {Promise<{ trackingId: string, [key: string]: any }>} The server response containing the tracking ID.
 * @throws {Error} Throws an error if the server rejects the vent or the fetch fails.
 */
window.saveVent = async function (ventData) {
    try {
        const response = await fetch('/api/vent', {
            credentials: 'include',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ventData)
        });

        const result = await response.json();
        if (!response.ok)
            throw new Error(result.error || 'Server rejected vent');

        // Save the Vent Tracking ID locally so the anonymous ventor keeps a receipt
        let localReceipts = JSON.parse(
            localStorage.getItem('my_vent_receipts') || '[]'
        );
        localReceipts.push({
            trackingId: result.trackingId,
            date: new Date().toISOString(),
            preview: ventData.content.substring(0, 30) + '...'
        });
        localStorage.setItem('my_vent_receipts', JSON.stringify(localReceipts));

        return result;
    } catch (err) {
        console.error('Database save failed:', err);
        throw err;
    }
};

/**
 * Fetches the list of available vents from the server.
 * * @returns {Promise<Array<Object>>} A promise that resolves to an array of vent objects, or an empty array if the fetch fails.
 */
window.getVents = async function () {
    try {
        const response = await fetch('/api/vents', {
            credentials: 'include',
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        return await response.json();
    } catch (err) {
        console.error('Failed to fetch vents:', err);
        return [];
    }
};

/**
 * Deletes a specific vent from the server, handling CSRF token retrieval if missing.
 * * @param {string|number} ventId - The unique identifier of the vent to delete.
 * @returns {Promise<{ success?: boolean, error?: string, [key: string]: any }>} A promise that resolves to the server's response object.
 */
window.deleteVent = async function (ventId) {
    let tokenMatch = document.cookie.match(/csrf_token=([^;]+)/);
    let csrfToken = tokenMatch ? tokenMatch[1] : null;

    if (!csrfToken) {
        const res = await fetch('/api/csrf-token');
        const data = await res.json();
        csrfToken = data.csrfToken;
    }

    try {
        const response = await fetch(`/api/vent/${ventId}`, {
            credentials: 'include',
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            }
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        return result;
    } catch (err) {
        console.error('Delete failed:', err.message);
        return { success: false, error: err.message };
    }
};