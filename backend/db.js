const BASE_URL = `http://localhost:${process.env.PORT || 4000}/api`;


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
    const res = await fetch(`${BASE_URL}/ai/${field}`, { headers: authHeader() });
    if (!res.ok) throw new Error(`db.get(${field}) failed: ${res.status}`);
    return res.json();
}

async function put(field, data) {
    const res = await fetch(`${BASE_URL}/ai/${field}`, {
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
    getStudents: () => get('students'),
    saveStudents: (d) => put('students', d),
    getAttendance: () => get('attendance'),
    appendAttendance: async (newRows) => {
        const res = await fetch(`${BASE_URL}/ai/attendance/append`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeader() },
            body: JSON.stringify({ rows: newRows }),
        });
        if (!res.ok) throw new Error(`appendAttendance failed: ${res.status}`);
    },
    saveAttendance: (d) => put('attendance', d),
};