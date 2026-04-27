// subsystems/services/api.ts

// 1. We define the exact shape of the data using an interface instead of JSDoc
interface VentData {
    content: string;
}

interface ServerResponse {
    trackingId?: string;
    success?: boolean;
    error?: string;
    [key: string]: any;
}

// 2. We apply those types directly to the function parameters and return values
export const saveVent = async function (ventData: VentData): Promise<ServerResponse> {
    try {
        const response = await fetch('/api/vent', {
            credentials: 'include',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ventData)
        });

        const result: ServerResponse = await response.json();
        if (!response.ok) throw new Error(result.error || 'Server rejected vent');

        let localReceipts = JSON.parse(localStorage.getItem('my_vent_receipts') || '[]');
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

export const getVents = async function (): Promise<any[]> {
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

export const deleteVent = async function (ventId: string | number): Promise<ServerResponse> {
    let tokenMatch = document.cookie.match(/csrf_token=([^;]+)/);
    let csrfToken: string | null = tokenMatch ? tokenMatch[1] : null;

    if (!csrfToken) {
        const res = await fetch('/api/csrf-token');
        const data = await res.json();
        csrfToken = data.csrfToken;
    }

    if (!csrfToken) {
        throw new Error("Cannot delete: CSRF token is missing.");
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

        const result: ServerResponse = await response.json();
        if (!response.ok) throw new Error(result.error);

        return result;
    } catch (err: any) {
        console.error('Delete failed:', err.message);
        return { success: false, error: err.message };
    }
};

// Ensure functions are attached to the global window object if needed elsewhere
(window as any).saveVent = saveVent;
(window as any).getVents = getVents;
(window as any).deleteVent = deleteVent;