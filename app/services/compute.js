import {
    DISTANCE_MATRIX,
    FACILITIES,
    FACILITY_LABELS,
    GRAPH,
    HEURISTIC_SCORES,
    LOCATION_NAMES,
    PROBABILITY_SCORES,
} from "./campusData";
import { ensureScheduleForRange, getScheduleForWindow } from "./scheduler";

const FACILITY_SET = new Set(Object.keys(FACILITIES));

function timeDecay(lostDateStr) {
    const hoursElapsed = (Date.now() - new Date(lostDateStr).getTime()) / (1000 * 60 * 60);
    return Math.exp(-0.03 * hoursElapsed);
}

function distanceWeight(fromName, toName) {
    const i = LOCATION_NAMES[fromName];
    const j = LOCATION_NAMES[toName];
    if (i === undefined || j === undefined) return 0;
    const dist = DISTANCE_MATRIX[i][j];
    return 1 / (1 + dist / 100);
}

function rebuildProbabilityScores(trafficMap) {
    for (const from of Object.keys(GRAPH)) {
        const neighbors = Object.keys(GRAPH[from]);
        const studentsAtFrom = trafficMap[from] ?? 0.1;

        const raw = {};
        for (const to of neighbors) {
            raw[to] = distanceWeight(from, to) * studentsAtFrom;
        }

        const total = Object.values(raw).reduce((s, v) => s + v, 0);

        for (const to of neighbors) {
            PROBABILITY_SCORES[from][to] = total > 0 ? raw[to] / total : 1 / neighbors.length;
        }
    }
}

function dfs(node, prob, depth, maxDepth, buildingProbs, visited) {
    if (depth > maxDepth || prob < 0.001) return;

    visited.add(node);
    buildingProbs[node] = (buildingProbs[node] ?? 0) + prob;

    const neighbors = Object.keys(GRAPH[node] ?? {});
    const raw = {};
    for (const n of neighbors) {
        if (!visited.has(n)) {
            raw[n] = PROBABILITY_SCORES[node]?.[n] ?? 0;
        }
    }

    const total = Object.values(raw).reduce((s, v) => s + v, 0);
    for (const [neighbor, w] of Object.entries(raw)) {
        const p = total > 0 ? w / total : 0;
        if (p > 0) {
            dfs(neighbor, prob * p, depth + 1, maxDepth, buildingProbs, new Set(visited));
        }
    }
}

function buildTrafficMap(scheduleRows) {
    const raw = {};
    for (const row of scheduleRows) {
        raw[row.building] = (raw[row.building] ?? 0) + row.enrollment;
    }
    const max = Math.max(...Object.values(raw), 1);
    const normalized = {};
    for (const [building, count] of Object.entries(raw)) {
        normalized[building] = count / max;
    }
    return normalized;
}

function computeHeuristic(building, pathProb, distFromStart, scheduleTraffic) {
    const learned = HEURISTIC_SCORES[building] ?? 0.3;
    const distW = 1 / (1 + distFromStart / 100);
    return 0.35 * learned
        + 0.30 * pathProb
        + 0.20 * distW
        + 0.15 * scheduleTraffic;
}

export function runSearch(startLocation, lostDateStr, schedule, threshold = 0.02) {
    const updatedSchedule = ensureScheduleForRange(lostDateStr, schedule);

    const now = new Date().toISOString();
    const decay = timeDecay(lostDateStr);
    const relevantRows = getScheduleForWindow(updatedSchedule, lostDateStr, now);
    const trafficMap = buildTrafficMap(relevantRows);
    const start = GRAPH[startLocation] ? startLocation : Object.keys(GRAPH)[0];

    rebuildProbabilityScores(trafficMap);

    const buildingProbs = {};
    dfs(start, 1.0, 0, 6, buildingProbs, new Set());

    const maxProb = Math.max(...Object.values(buildingProbs), 1);
    const startId = LOCATION_NAMES[start];

    const results = [];
    for (const [building, rawProb] of Object.entries(buildingProbs)) {
        const pathProb = rawProb / maxProb;
        const buildingId = LOCATION_NAMES[building];
        const distFromStart = startId !== undefined && buildingId !== undefined
            ? DISTANCE_MATRIX[startId][buildingId]
            : 500;
        const scheduleTraffic = trafficMap[building] ?? 0.1;

        const hScore = computeHeuristic(building, pathProb, distFromStart, scheduleTraffic);
        const finalScore = hScore * decay;

        if (finalScore >= threshold) {
            results.push({
                building,
                label: FACILITY_LABELS[building] ?? building,
                isFacility: FACILITY_SET.has(building),
                finalScore: Math.round(finalScore * 10000) / 10000,
                hScore: Math.round(hScore * 10000) / 10000,
                confidence: Math.round(decay * 100),
                trafficLoad: Math.round((trafficMap[building] ?? 0) * 100),
            });
        }
    }

    results.sort((a, b) => b.finalScore - a.finalScore);

    return {
        results,
        hoursElapsed: Math.round((Date.now() - new Date(lostDateStr).getTime()) / (1000 * 60 * 60)),
        confidence: Math.round(decay * 100),
        updatedSchedule,
    };
}