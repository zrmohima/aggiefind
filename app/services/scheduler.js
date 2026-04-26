import { db } from '../../backend/db';

const TEACHING_BUILDINGS = [
    'ScienceHall', 'WaldenHall', 'BiologyAnnex', 'AstronomyBuilding',
    'FosterHall', 'YoungHall', 'PeteDomenici', 'HardmanJacobs', 'MiltonHall',
];

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

const DAYS_OF_WEEK = [1, 2, 3, 4, 5];

function toMinutes(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function dateKey(d) {
    return new Date(d).toISOString().split('T')[0];
}

function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

export function generateStudentWeeklySchedule(studentId) {
    const seed = parseInt(studentId.replace('s', ''), 10);
    const count = seededRandom(seed) < 0.5 ? 2 : 3;
    const slots = [];
    const usedDays = new Set();

    for (let i = 0; i < count; i++) {
        const buildingIdx = Math.floor(seededRandom(seed + i * 7) * TEACHING_BUILDINGS.length);
        const slotIdx = Math.floor(seededRandom(seed + i * 13) * TIME_SLOTS.length);
        let dayIdx = Math.floor(seededRandom(seed + i * 17) * DAYS_OF_WEEK.length);

        let attempts = 0;
        while (usedDays.has(DAYS_OF_WEEK[dayIdx]) && attempts < 5) {
            dayIdx = (dayIdx + 1) % DAYS_OF_WEEK.length;
            attempts++;
        }
        usedDays.add(DAYS_OF_WEEK[dayIdx]);

        slots.push({
            building: TEACHING_BUILDINGS[buildingIdx],
            dayOfWeek: DAYS_OF_WEEK[dayIdx],
            startTime: TIME_SLOTS[slotIdx].start,
            endTime: TIME_SLOTS[slotIdx].end,
        });
    }
    return slots;
}

const SEMESTER_START = '2026-01-13';

function weeksElapsed(dateStr) {
    const start = new Date(SEMESTER_START);
    const date = new Date(dateStr);
    return Math.max(1, Math.floor((date - start) / (7 * 24 * 60 * 60 * 1000)));
}

function generateAttendanceForDate(student, dateStr) {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const rows = [];

    for (const slot of student.schedule) {
        if (slot.dayOfWeek !== dayOfWeek) continue;
        const seed = parseInt(student.id.replace('s', ''), 10);
        const attendanceRate = Math.round((0.5 + seededRandom(seed + toMinutes(slot.startTime)) * 0.45) * 100) / 100;
        const totalClassesTillDate = weeksElapsed(dateStr);
        const classesAttended = Math.round(attendanceRate * totalClassesTillDate);

        rows.push({
            date: dateStr,
            studentId: student.id,
            building: slot.building,
            startTime: slot.startTime,
            endTime: slot.endTime,
            attendanceRate,
            classesAttended,
            totalClassesTillDate,
            likelyPresent: attendanceRate >= 0.70,
        });
    }
    return rows;
}

export async function ensureStudentSchedules(lostDateStr) {
    const dbData = await db.getStudents();
    let students = dbData ?? [];

    // If no students exist yet, create 50 simulated students
    if (students.length === 0) {
        for (let i = 1; i <= 50; i++) {
            const id = `s${String(i).padStart(3, '0')}`;
            students.push({
                id,
                name: `Student ${i}`,
                schedule: generateStudentWeeklySchedule(id),
            });
        }
        await db.saveStudents(students);
    }

    // Ensure attendance records exist week by week from lostDate to today
    const savedAttendance = await db.getAttendance();
    const existingDates = new Set(savedAttendance.map(r => r.date));
    const newRows = [];

    const cursor = new Date(lostDateStr);
    const today = new Date();
    cursor.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    while (cursor <= today) {
        const key = dateKey(cursor);
        if (!existingDates.has(key)) {
            for (const student of students) {
                newRows.push(...generateAttendanceForDate(student, key));
            }
            existingDates.add(key);
        }
        cursor.setDate(cursor.getDate() + 1);
    }

    if (newRows.length > 0) {
        const updated = [...savedAttendance, ...newRows];
        await db.saveAttendance(updated);
        return { students, attendance: updated };
    }

    return { students, attendance: savedAttendance };
}
export function getStudentsInWindow(attendance, students, lostBuilding, lostDateStr) {
    const lostDate = new Date(lostDateStr);
    const lostDay = dateKey(lostDate);
    const lostMins = lostDate.getHours() * 60 + lostDate.getMinutes();
    const winStart = Math.max(0, lostMins - 120);

    const presentIds = new Set(
        attendance
            .filter(r => {
                if (r.date !== lostDay) return false;
                if (r.building !== lostBuilding) return false;
                if (!r.likelyPresent) return false;
                const end = toMinutes(r.endTime);
                const start = toMinutes(r.startTime);
                return end >= winStart && start <= lostMins;
            })
            .map(r => r.studentId)
    );

    return students.filter(s => presentIds.has(s.id));
}

export function buildTrafficFromStudents(students, attendance, lostDateStr, currentDateStr) {
    const lostDate = new Date(lostDateStr);
    const currentDate = new Date(currentDateStr);
    const lostDay = dateKey(lostDate);
    const currentDay = dateKey(currentDate);
    const lostMins = lostDate.getHours() * 60 + lostDate.getMinutes();

    const trafficRaw = {};

    for (const student of students) {
        // Get all attendance rows for this student from lostTime to now
        const rows = attendance.filter(r => {
            if (r.studentId !== student.id) return false;
            if (r.date < lostDay || r.date > currentDay) return false;
            // On the lost day, only count classes AFTER the lost time
            if (r.date === lostDay && toMinutes(r.startTime) <= lostMins) return false;
            return r.likelyPresent;
        });

        // Count this student toward every building they visited after loss
        for (const row of rows) {
            trafficRaw[row.building] = (trafficRaw[row.building] ?? 0) + 1;
        }
    }

    const max = Math.max(...Object.values(trafficRaw), 1);
    const normalized = {};
    for (const [b, count] of Object.entries(trafficRaw)) {
        normalized[b] = count / max;
    }
    return normalized;
}