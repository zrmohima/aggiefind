const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

function readDb() { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
function writeDb(db) { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function dateKey(d) { return new Date(d).toISOString().split('T')[0]; }
function toMinutes(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function coinToss(p) { return Math.random().toFixed(1) < p; }

function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

const TEACHING_BUILDINGS = [
    'ScienceHall', 'WaldenHall', 'BiologyAnnex', 'AstronomyBuilding',
    'FosterHall', 'YoungHall', 'PeteDomenici', 'HardmanJacobs', 'MiltonHall',
];

const TIME_SLOTS = [
    { start: '07:30', end: '08:20' }, { start: '08:30', end: '09:20' },
    { start: '09:30', end: '10:45' }, { start: '11:00', end: '11:50' },
    { start: '13:00', end: '13:50' }, { start: '14:00', end: '15:15' },
    { start: '15:30', end: '16:20' }, { start: '16:30', end: '17:45' },
    { start: '18:00', end: '18:50' }, { start: '19:00', end: '20:15' },
];

const DAYS_OF_WEEK = [1, 2, 3, 4, 5];

function generateStudentWeeklySchedule(studentId) {
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

// Generate attendance records for a student for a specific date
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

function findPathBetween(start, end, graph) {
    if (start === end) return [start];
    function dfs(node, path, visited) {
        if (node === end) return path;
        for (const neighbor of Object.keys(graph[node] ?? {})) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                const result = dfs(neighbor, [...path, neighbor], visited);
                if (result) return result;
            }
        }
        return null;
    }
    return dfs(start, [start], new Set([start]));
}

function updateHeuristicScores(scores, confirmedBuilding, alpha = 0.1) {
    const updated = { ...scores };
    updated[confirmedBuilding] = (1 - alpha) * updated[confirmedBuilding] + alpha * 1.0;
    return updated;
}

function simulate() {
    const db = readDb();
    const { graph, facilities, locationIds } = db.campusConfig;
    const allLocations = Object.values(locationIds);
    const facilityKeys = Object.values(locationIds);

    let hScores = { ...db.heuristicScores };

    // Generate 50 simulated students
    const students = [];
    for (let i = 1; i <= 50; i++) {
        const id = `s${String(i).padStart(3, '0')}`;
        students.push({
            id,
            name: `Student ${i}`,
            schedule: generateStudentWeeklySchedule(id),
        });
    }

    // Generate attendance records for the past 30 days
    const DAYS_BACK = 30;
    const now = new Date();
    const attendance = [];
    const existingDates = new Set();

    for (let d = 0; d <= DAYS_BACK; d++) {
        const date = new Date(now);
        date.setDate(date.getDate() - d);
        const key = dateKey(date);
        if (!existingDates.has(key)) {
            for (const student of students) {
                attendance.push(...generateAttendanceForDate(student, key));
            }
            existingDates.add(key);
        }
    }

    const NUM_ITEMS = 1000;
    const RECOVERY_PROBABILITY = 1;

    let recovered = 0, notRecovered = 0, noPath = 0;

    console.log(`\nSimulating ${NUM_ITEMS} lost items over the past ${DAYS_BACK} days...`);
    console.log(`Students: 50  |  Recovery probability: ${RECOVERY_PROBABILITY * 100}%\n`);

    for (let i = 0; i < NUM_ITEMS; i++) {
        const lostDate = new Date(now);
        lostDate.setDate(lostDate.getDate() - randomInt(0, DAYS_BACK));
        lostDate.setHours(randomInt(8, 18), randomInt(0, 59), 0, 0);

        const startLocation = randomChoice(allLocations);
        const lostDay = dateKey(lostDate);
        const lostMins = lostDate.getHours() * 60 + lostDate.getMinutes();
        const winStart = Math.max(0, lostMins - 120);

        // Get students who were present in the lost building during the window
        const presentIds = new Set(
            attendance.filter(r =>
                r.date === lostDay &&
                r.building === startLocation &&
                r.likelyPresent &&
                toMinutes(r.endTime) >= winStart &&
                toMinutes(r.startTime) <= lostMins
            ).map(r => r.studentId)
        );

        if (presentIds.size === 0) {
            notRecovered++;
            continue;
        }

        if (!coinToss(RECOVERY_PROBABILITY)) {
            notRecovered++;
            if ((i + 1) % 10 === 0) {
                console.log(`  ${i + 1} out of ${NUM_ITEMS} from ${startLocation} NOT recovered (coin toss)`);
            }
            continue;
        }

        const foundLocation = randomChoice(facilityKeys);
        const path = findPathBetween(startLocation, foundLocation, graph);

        if (!path || path.length < 2) {
            noPath++;
            continue;
        }

        recovered++;
        hScores = updateHeuristicScores(hScores, foundLocation);

        if ((i + 1) % 10 === 0) {
            console.log(`  ${i + 1} out of ${NUM_ITEMS} from ${startLocation.padEnd(20)} found at ${foundLocation.padEnd(15)} | students in window: ${presentIds.size} | path: ${path.join(' -> ')}`);
        }
    }

    db.heuristicScores = hScores;
    db.students = students;
    db.attendance = attendance;
    writeDb(db);

    console.log(`\nSimulation complete`);
    console.log(`   Items simulated   : ${NUM_ITEMS}`);
    console.log(`   Recovered         : ${recovered}`);
    console.log(`   Not recovered     : ${notRecovered}`);
    console.log(`   No path found     : ${noPath}`);
    console.log(`   Students generated: ${students.length}`);
    console.log(`   Attendance rows   : ${attendance.length}`);
    console.log(`\nFinal heuristic scores after ${recovered} recoveries:`);

    Object.entries(hScores)
        .sort((a, b) => b[1] - a[1])
        .forEach(([b, s]) => {
            console.log(`  ${b} ${s.toFixed(4)}`);
        });
    console.log('\ndb.json updated.');
}

simulate();