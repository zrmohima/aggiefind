import { db } from '../../backend/db';

const TIME_SLOTS = [
    { start: '07:30', end: '08:20' },
    { start: '08:30', end: '09:20' },
    { start: '09:30', end: '10:45' },
    { start: '11:00', end: '11:50' },
    { start: '13:00', end: '13:50' },
    { start: '14:00', end: '15:15' },
    { start: '15:30', end: '16:20' },
    { start: '16:30', end: '17:45' },
    { start: '18:00', end: '18:50' },
    { start: '19:00', end: '20:15' },
];

const DEPARTMENTS = {
    ScienceHall: ['CHEM', 'PHYS'],
    WaldenHall: ['HIST', 'ENGL'],
    BiologyAnnex: ['BIOL'],
    AstronomyBuilding: ['ASTR', 'PHYS'],
    BransonLibrary: [],
    FosterHall: ['ARTS', 'THTR'],
    YoungHall: ['GOVT', 'SOCI'],
    PeteDomenici: ['MGMT', 'ECON'],
    HardmanJacobs: ['CS', 'ECE'],
    MiltonHall: ['MATH', 'STAT'],
    FrencerFoodCourt: [],
    ZuhlLibrary: [],
    AggieHealth: [],
    HadleyHall: [],
};

function toMinutes(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function dateKey(d) {
    return new Date(d).toISOString().split('T')[0];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function generateDaySchedule(dateStr) {
    const rows = [];
    for (const building of Object.keys(DEPARTMENTS)) {
        const depts = DEPARTMENTS[building];
        if (!depts.length) continue;
        const usedSlots = [];
        for (const slot of TIME_SLOTS) {
            const slotStart = toMinutes(slot.start);
            const slotEnd = toMinutes(slot.end);
            const overlaps = usedSlots.some(u => slotStart < u.end + 10 && slotEnd > u.start - 10);
            if (overlaps || Math.random() < 0.35) continue;
            rows.push({
                date: dateStr,
                building,
                department: randomChoice(depts),
                course: `${randomChoice(depts)} ${randomInt(100, 599)}`,
                startTime: slot.start,
                endTime: slot.end,
                enrollment: randomInt(15, 50),
                attendanceRate: Math.round((0.5 + Math.random() * 0.45) * 100) / 100,
            });
            usedSlots.push({ start: slotStart, end: slotEnd });
        }
    }
    return rows;
}

export async function ensureScheduleForRange(lostDateStr) {
    const saved = await db.getSchedule();
    const existingDates = new Set(saved.map(r => r.date));
    const newRows = [];

    const cursor = new Date(lostDateStr);
    const today = new Date();
    cursor.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    while (cursor <= today) {
        const key = dateKey(cursor);
        if (!existingDates.has(key)) newRows.push(...generateDaySchedule(key));
        cursor.setDate(cursor.getDate() + 1);
    }

    if (newRows.length > 0) {
        await db.appendSchedule(newRows);
        return [...saved, ...newRows];
    }
    return saved;
}

export function getScheduleForWindow(schedule, lostDateStr, currentDateStr) {
    const lostDate = new Date(lostDateStr);
    const currentDate = new Date(currentDateStr);
    const lostDay = dateKey(lostDate);
    const currentDay = dateKey(currentDate);
    const lostMins = lostDate.getHours() * 60 + lostDate.getMinutes();

    return schedule.filter(row => {
        if (row.date < lostDay || row.date > currentDay) return false;
        if (row.date === lostDay) {
            const windowStart = Math.max(0, lostMins - 120);
            return toMinutes(row.endTime) >= windowStart && toMinutes(row.startTime) <= lostMins;
        }
        return true;
    });
}