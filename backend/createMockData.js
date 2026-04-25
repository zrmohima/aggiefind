const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

function readDb() { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
function writeDb(db) { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }

function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function dateKey(d) { return new Date(d).toISOString().split('T')[0]; }
function toMinutes(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function coinToss(probability = 0.7) { return Math.random() < probability; }

const TIME_SLOTS = [
    { start: '07:30', end: '08:20' }, { start: '08:30', end: '09:20' },
    { start: '09:30', end: '10:45' }, { start: '11:00', end: '11:50' },
    { start: '13:00', end: '13:50' }, { start: '14:00', end: '15:15' },
    { start: '15:30', end: '16:20' }, { start: '16:30', end: '17:45' },
    { start: '18:00', end: '18:50' }, { start: '19:00', end: '20:15' },
];

const DEPARTMENTS = {
    ScienceHall: ['CHEM', 'PHYS'], WaldenHall: ['HIST', 'ENGL'],
    BiologyAnnex: ['BIOL'], AstronomyBuilding: ['ASTR', 'PHYS'],
    FosterHall: ['ARTS', 'THTR'], YoungHall: ['GOVT', 'SOCI'],
    PeteDomenici: ['MGMT', 'ECON'], HardmanJacobs: ['CS', 'ECE'],
    MiltonHall: ['MATH', 'STAT'],
};

function generateDaySchedule(dateStr) {
    const rows = [];
    for (const [building, depts] of Object.entries(DEPARTMENTS)) {
        const usedSlots = [];
        for (const slot of TIME_SLOTS) {
            const s = toMinutes(slot.start), e = toMinutes(slot.end);
            if (usedSlots.some(u => s < u.e + 10 && e > u.s - 10) || Math.random() < 0.35) continue;
            rows.push({
                date: dateStr,
                building,
                course: `${randomChoice(depts)} ${randomInt(100, 599)}`,
                startTime: slot.start,
                endTime: slot.end,
                enrollment: randomInt(15, 50),
                attendanceRate: Math.round((0.5 + Math.random() * 0.45) * 100) / 100,
            });
            usedSlots.push({ s, e });
        }
    }
    return rows;
}

function findPathBetween(start, end, graph) {
    if (start === end) return [start];
    const queue = [[start, [start]]];
    const visited = new Set([start]);
    while (queue.length) {
        const [node, path] = queue.shift();
        for (const neighbor of Object.keys(graph[node] ?? {})) {
            if (neighbor === end) return [...path, neighbor];
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push([neighbor, [...path, neighbor]]);
            }
        }
    }
    return null;
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
    const facilityKeys = Object.keys(facilities);
    const nonFacilities = allLocations.filter(l => !facilityKeys.includes(l));

    let hScores = { ...db.heuristicScores };
    let schedule = [...db.schedule];
    const existingDates = new Set(schedule.map(r => r.date));

    const NUM_ITEMS = 100;
    const DAYS_BACK = 10;
    const RECOVERY_PROBABILITY = 0.7;
    const now = new Date();

    let recovered = 0, notRecovered = 0, noPath = 0;
    console.log(`\nSimulating ${NUM_ITEMS} lost items over the past ${DAYS_BACK} days...`);
    console.log(`Recovery probability: ${RECOVERY_PROBABILITY * 100}%\n`);

    for (let i = 0; i < NUM_ITEMS; i++) {
        const lostDate = new Date(now);
        lostDate.setDate(lostDate.getDate() - randomInt(0, DAYS_BACK));
        lostDate.setHours(randomInt(8, 18), randomInt(0, 59), 0, 0);
        const key = dateKey(lostDate);
        if (!existingDates.has(key)) {
            schedule.push(...generateDaySchedule(key));
            existingDates.add(key);
        }

        const startLocation = randomChoice(nonFacilities);
        const wasRecovered = coinToss(RECOVERY_PROBABILITY);
        if (!wasRecovered) {
            notRecovered++;
            if ((i + 1) % 10 === 0) {
                console.log(`  [${i + 1}/${NUM_ITEMS}] item from ${startLocation} → NOT recovered (coin toss)`);
            }
            continue;
        }
        const foundLocation = randomChoice(allLocations);
        const path = findPathBetween(startLocation, foundLocation, graph);

        if (!path || path.length < 2) {
            noPath++;
            continue;
        }

        recovered++;
        hScores = updateHeuristicScores(hScores, foundLocation);
        if ((i + 1) % 10 === 0) {
            console.log(`  [${i + 1}/${NUM_ITEMS}] item from ${startLocation.padEnd(20)} → found at ${foundLocation.padEnd(15)} (path: ${path.join(' → ')})`);
        }
    }

    db.heuristicScores = hScores;
    db.schedule = schedule;
    writeDb(db);

    console.log(`\nSimulation complete`);
    console.log(`   Items simulated : ${NUM_ITEMS}`);
    console.log(`   Recovered       : ${recovered}`);
    console.log(`   Not recovered   : ${notRecovered}`);
    console.log(`   No path found   : ${noPath}`);
    console.log(`   Schedule rows   : ${schedule.length}`);
    console.log(`\nFinal heuristic scores (after ${recovered} recoveries):`);

    const sorted = Object.entries(hScores).sort((a, b) => b[1] - a[1]);
    for (const [b, s] of sorted) {
        const bar = '█'.repeat(Math.round(s * 20));
        console.log(`  ${b.padEnd(22)} ${bar.padEnd(22)} ${s.toFixed(4)}`);
    }
    console.log('\ndb.json updated.');
}

simulate();