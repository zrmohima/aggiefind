const BASE_URL = `http://localhost:${process.env.PORT || 4000}`;

function authHeader() {
    try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
            const t = window.sessionStorage.getItem('aggiefind_token');
            if (t) return { 'Authorization': `Bearer ${t}` };
        }
    } catch (e) { }
    return {};
}

async function get(field) {
    const res = await fetch(`${BASE_URL}/api/ai/${field}`, { headers: authHeader() });
    if (!res.ok) throw new Error(`db.get(${field}) failed: ${res.status}`);
    return res.json();
}

async function put(field, data) {
    const res = await fetch(`${BASE_URL}/api/ai/${field}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`db.put(${field}) failed: ${res.status}`);
}

export const db = {
    getCampusConfig: () => get('campusConfig'),
    getHeuristicScores: () => get('heuristicScores'),
    saveHeuristicScores: (d) => put('heuristicScores', d),
    getProbabilityScores: () => get('probabilityScores'),
    saveProbabilityScores: (d) => put('probabilityScores', d),
    getSchedule: () => get('schedule'),
    saveSchedule: (d) => put('schedule', d),
    appendSchedule: async (newRows) => {
        if (!newRows.length) return;
        const res = await fetch(`${BASE_URL}/api/ai/schedule/append`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeader() },
            body: JSON.stringify({ rows: newRows }),
        });
        if (!res.ok) throw new Error(`appendSchedule failed: ${res.status}`);
    },
};