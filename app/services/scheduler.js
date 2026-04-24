import { FACILITIES, LOCATION_IDS } from "./campusData";

const FACILITY_IDS = new Set(Object.values(FACILITIES));

const TEACHING_BUILDINGS = Object.entries(LOCATION_IDS)
    .filter(([id]) => !FACILITY_IDS.has(parseInt(id)))
    .map(([, name]) => name);

const DEPARTMENTS = {
    ScienceHall: ["CHEM", "PHYS"],
    WaldenHall: ["HIST", "ENGL"],
    BiologyAnnex: ["BIOL"],
    AstronomyBuilding: ["ASTR", "PHYS"],
    BransonLibrary: [],
    FosterHall: ["ARTS", "THTR"],
    YoungHall: ["GOVT", "SOCI"],
    PeteDomenici: ["MGMT", "ECON"],
    HardmanJacobs: ["CS", "ECE"],
    MiltonHall: ["MATH", "STAT"],
    FrencerFoodCourt: [],
    ZuhlLibrary: [],
    AggieHealth: [],
    HadleyHall: [],
};

const CLASS_DURATIONS = [50, 75];

const TIME_SLOTS = [
    { start: "07:30", end: "08:20" },
    { start: "08:30", end: "09:20" },
    { start: "09:30", end: "10:45" },
    { start: "11:00", end: "11:50" },
    { start: "13:00", end: "13:50" },
    { start: "14:00", end: "15:15" },
    { start: "15:30", end: "16:20" },
    { start: "16:30", end: "17:45" },
    { start: "18:00", end: "18:50" },
    { start: "19:00", end: "20:15" },
];

const BREAK_SLOTS = ["12:00–13:00", "17:45–18:00"];

function toMinutes(timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
}

function dateKey(date) {
    return date.toISOString().split("T")[0];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateDaySchedule(dateStr) {
    const rows = [];

    for (const building of TEACHING_BUILDINGS) {
        const depts = DEPARTMENTS[building];
        if (!depts || depts.length === 0) continue;

        const usedSlots = [];

        for (const slot of TIME_SLOTS) {
            const slotStart = toMinutes(slot.start);
            const slotEnd = toMinutes(slot.end);

            const overlaps = usedSlots.some(
                (used) => slotStart < used.end + 10 && slotEnd > used.start - 10
            );
            if (overlaps) continue;

            if (Math.random() < 0.35) continue;

            const dept = randomChoice(depts);
            const courseNum = randomInt(100, 599);
            const enrollment = randomInt(15, 120);

            rows.push({
                date: dateStr,
                building,
                department: dept,
                course: `${dept} ${courseNum}`,
                startTime: slot.start,
                endTime: slot.end,
                enrollment,
            });

            usedSlots.push({ start: slotStart, end: slotEnd });
        }
    }

    return rows;
}

export function ensureScheduleForRange(lostDateStr, schedule) {
    const lost = new Date(lostDateStr);
    const today = new Date();
    lost.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const existingDates = new Set(schedule.map((r) => r.date));
    const newRows = [];

    const cursor = new Date(lost);
    while (cursor <= today) {
        const key = dateKey(cursor);
        if (!existingDates.has(key)) {
            newRows.push(...generateDaySchedule(key));
        }
        cursor.setDate(cursor.getDate() + 1);
    }

    return [...schedule, ...newRows];
}

export function getScheduleForWindow(schedule, lostDateStr, currentDateStr) {
    const lostDate = new Date(lostDateStr);
    const currentDate = new Date(currentDateStr);
    const lostHour = lostDate.getHours();
    const lostMinute = lostDate.getMinutes();
    const lostDay = dateKey(lostDate);
    const currentDay = dateKey(currentDate);

    return schedule.filter((row) => {
        if (row.date < lostDay || row.date > currentDay) return false;

        if (row.date === lostDay) {
            const rowEnd = toMinutes(row.endTime);
            const lostMins = lostHour * 60 + lostMinute;
            const windowStart = Math.max(0, lostMins - 120);
            return rowEnd >= windowStart && toMinutes(row.startTime) <= lostMins;
        }

        return true;
    });
}