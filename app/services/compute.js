import { db } from '../../backend/db';
import { ensureScheduleForRange, getScheduleForWindow } from '../services/scheduler';

function distanceWeight(distanceMatrix, locationNames, fromName, toName) {
    const i = locationNames[fromName];
    const j = locationNames[toName];
    if (i === undefined || j === undefined) return 0;
    return 1 / (1 + distanceMatrix[i][j] / 100);
}

function buildProbabilityScores(graph, distanceMatrix, locationNames, trafficMap) {
    const scores = {};
    for (const from of Object.keys(graph)) {
        const neighbors = Object.keys(graph[from]);
        const studentsAtFrom = trafficMap[from] ?? 0.1;
        const raw = {};
        for (const to of neighbors) {
            raw[to] = distanceWeight(distanceMatrix, locationNames, from, to) * studentsAtFrom;
        }
        const total = Object.values(raw).reduce((s, v) => s + v, 0);
        scores[from] = {};
        for (const to of neighbors) {
            scores[from][to] = total > 0 ? raw[to] / total : 1 / neighbors.length;
        }
    }
    return scores;
}

function dfs(node, prob, depth, maxDepth, buildingProbs, visited, probabilityScores, graph) {
    if (depth > maxDepth || prob < 0.001) return;
    visited.add(node);
    buildingProbs[node] = (buildingProbs[node] ?? 0) + prob;
    const neighbors = Object.keys(graph[node] ?? {});
    const raw = {};
    for (const n of neighbors) {
        if (!visited.has(n)) raw[n] = probabilityScores[node]?.[n] ?? 0;
    }
    const total = Object.values(raw).reduce((s, v) => s + v, 0);
    for (const [neighbor, w] of Object.entries(raw)) {
        const p = total > 0 ? w / total : 0;
        if (p > 0) dfs(neighbor, prob * p, depth + 1, maxDepth, buildingProbs, new Set(visited), probabilityScores, graph);
    }
}

function buildTrafficMap(scheduleRows) {
    const raw = {};
    for (const row of scheduleRows) {
        const effectiveStudents = Math.round(row.enrollment * (row.attendanceRate ?? 1.0));
        raw[row.building] = (raw[row.building] ?? 0) + effectiveStudents;
    }
    const max = Math.max(...Object.values(raw), 1);
    const normalized = {};
    for (const [b, count] of Object.entries(raw)) normalized[b] = count / max;
    return normalized;
}

function computeHeuristic(building, heuristicScores, distanceMatrix, locationNames, startLocation, pathProb, scheduleTraffic) {
    const learned = heuristicScores[building] ?? 0.3;
    const startId = locationNames[startLocation];
    const buildId = locationNames[building];
    const dist = startId !== undefined && buildId !== undefined ? distanceMatrix[startId][buildId] : 500;
    const distW = 1 / (1 + dist / 100);
    return 0.35 * learned + 0.30 * pathProb + 0.20 * distW + 0.15 * scheduleTraffic;
}

export async function runSearch(startLocation, lostDateStr, threshold = 0.02) {
    const [config, heuristicScores] = await Promise.all([
        db.getCampusConfig(),
        db.getHeuristicScores(),
    ]);

    const { graph, distanceMatrix, facilities, facilityLabels, locationIds } = config;
    const locationNames = Object.fromEntries(Object.entries(locationIds).map(([id, name]) => [name, parseInt(id)]));
    const facilitySet = new Set(Object.keys(facilities));

    const schedule = await ensureScheduleForRange(lostDateStr);
    const now = new Date().toISOString();
    const relevantRows = getScheduleForWindow(schedule, lostDateStr, now);
    const trafficMap = buildTrafficMap(relevantRows);
    const start = graph[startLocation] ? startLocation : Object.keys(graph)[0];

    const probabilityScores = buildProbabilityScores(graph, distanceMatrix, locationNames, trafficMap);

    const buildingProbs = {};
    dfs(start, 1.0, 0, 6, buildingProbs, new Set(), probabilityScores, graph);

    const maxProb = Math.max(...Object.values(buildingProbs), 1);
    const hoursElapsed = (Date.now() - new Date(lostDateStr).getTime()) / (1000 * 60 * 60);
    const decay = Math.exp(-0.03 * hoursElapsed);

    const results = [];
    for (const [building, rawProb] of Object.entries(buildingProbs)) {
        const pathProb = rawProb / maxProb;
        const scheduleTraffic = trafficMap[building] ?? 0.1;
        const hScore = computeHeuristic(building, heuristicScores, distanceMatrix, locationNames, start, pathProb, scheduleTraffic);
        const finalScore = hScore * decay;
        if (finalScore >= threshold) {
            results.push({
                building,
                label: facilityLabels[building] ?? building,
                isFacility: facilitySet.has(building),
                finalScore: Math.round(finalScore * 10000) / 10000,
                hScore: Math.round(hScore * 10000) / 10000,
                confidence: Math.round(decay * 100),
                trafficLoad: Math.round((trafficMap[building] ?? 0) * 100),
            });
        }
    }

    results.sort((a, b) => b.finalScore - a.finalScore);
    return {
        results: results.slice(0, 5),
        hoursElapsed: Math.round(hoursElapsed),
        confidence: Math.round(decay * 100),
    };
}

export async function onItemRecovered(confirmedBuilding, alpha = 0.1) {
    const hScores = await db.getHeuristicScores();
    const updated = { ...hScores };
    updated[confirmedBuilding] = (1 - alpha) * updated[confirmedBuilding] + alpha * 1.0;
    await db.saveHeuristicScores(updated);
}