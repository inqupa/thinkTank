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
