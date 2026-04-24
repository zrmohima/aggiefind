export const LOCATION_IDS = {
    0: "ScienceHall",
    1: "WaldenHall",
    2: "BiologyAnnex",
    3: "AstronomyBuilding",
    4: "BransonLibrary",
    5: "FosterHall",
    6: "YoungHall",
    7: "PeteDomenici",
    8: "HardmanJacobs",
    9: "MiltonHall",
    10: "FrencerFoodCourt",
    11: "ZuhlLibrary",
    12: "AggieHealth",
    13: "HadleyHall",
};

export const LOCATION_NAMES = Object.fromEntries(
    Object.entries(LOCATION_IDS).map(([id, name]) => [name, parseInt(id)])
);

export const FACILITIES = {
    HadleyHall: 13,
    ZuhlLibrary: 11,
    WaldenHall: 1,
};

export const FACILITY_LABELS = {
    HadleyHall: "Hadley Hall Lost & Found",
    ZuhlLibrary: "Zuhl Library Front Desk",
    WaldenHall: "Walden Hall Lost & Found",
};

export const GRAPH = {
    ScienceHall: { WaldenHall: 1, BiologyAnnex: 1, AstronomyBuilding: 1, BransonLibrary: 1, FrencerFoodCourt: 1 },
    WaldenHall: { ScienceHall: 1, FosterHall: 1, BransonLibrary: 1 },
    BiologyAnnex: { ScienceHall: 1, AstronomyBuilding: 1, BransonLibrary: 1 },
    AstronomyBuilding: { ScienceHall: 1, BiologyAnnex: 1, BransonLibrary: 1, FrencerFoodCourt: 1 },
    BransonLibrary: { WaldenHall: 1, FosterHall: 1, YoungHall: 1, PeteDomenici: 1, FrencerFoodCourt: 1, HadleyHall: 1, ZuhlLibrary: 1 },
    FosterHall: { WaldenHall: 1, BransonLibrary: 1, HadleyHall: 1, YoungHall: 1 },
    YoungHall: { HadleyHall: 1, BransonLibrary: 1, HardmanJacobs: 1, FosterHall: 1 },
    PeteDomenici: { BransonLibrary: 1, ZuhlLibrary: 1, FrencerFoodCourt: 1, HardmanJacobs: 1, MiltonHall: 1 },
    HardmanJacobs: { YoungHall: 1, PeteDomenici: 1, MiltonHall: 1, BransonLibrary: 1 },
    MiltonHall: { HardmanJacobs: 1, PeteDomenici: 1, ZuhlLibrary: 1 },
    FrencerFoodCourt: { BransonLibrary: 1, ZuhlLibrary: 1, PeteDomenici: 1, AggieHealth: 1, ScienceHall: 1 },
    ZuhlLibrary: { PeteDomenici: 1, FrencerFoodCourt: 1, MiltonHall: 1, AggieHealth: 1 },
    AggieHealth: { ZuhlLibrary: 1, FrencerFoodCourt: 1 },
    HadleyHall: { YoungHall: 1, FosterHall: 1, BransonLibrary: 1 },
};

export let PROBABILITY_SCORES = {
    ScienceHall: { WaldenHall: 0.25, BiologyAnnex: 0.20, AstronomyBuilding: 0.20, BransonLibrary: 0.20, FrencerFoodCourt: 0.15 },
    WaldenHall: { ScienceHall: 0.35, FosterHall: 0.35, BransonLibrary: 0.30 },
    BiologyAnnex: { ScienceHall: 0.40, AstronomyBuilding: 0.35, BransonLibrary: 0.25 },
    AstronomyBuilding: { ScienceHall: 0.30, BiologyAnnex: 0.30, BransonLibrary: 0.25, FrencerFoodCourt: 0.15 },
    BransonLibrary: { WaldenHall: 0.15, FosterHall: 0.15, YoungHall: 0.15, PeteDomenici: 0.15, FrencerFoodCourt: 0.15, HadleyHall: 0.15, ZuhlLibrary: 0.10 },
    FosterHall: { WaldenHall: 0.30, BransonLibrary: 0.35, HadleyHall: 0.20, YoungHall: 0.15 },
    YoungHall: { HadleyHall: 0.30, BransonLibrary: 0.30, HardmanJacobs: 0.25, FosterHall: 0.15 },
    PeteDomenici: { BransonLibrary: 0.25, ZuhlLibrary: 0.25, FrencerFoodCourt: 0.25, HardmanJacobs: 0.15, MiltonHall: 0.10 },
    HardmanJacobs: { YoungHall: 0.30, PeteDomenici: 0.30, MiltonHall: 0.25, BransonLibrary: 0.15 },
    MiltonHall: { HardmanJacobs: 0.40, PeteDomenici: 0.35, ZuhlLibrary: 0.25 },
    FrencerFoodCourt: { BransonLibrary: 0.25, ZuhlLibrary: 0.25, PeteDomenici: 0.25, AggieHealth: 0.15, ScienceHall: 0.10 },
    ZuhlLibrary: { PeteDomenici: 0.30, FrencerFoodCourt: 0.25, MiltonHall: 0.20, AggieHealth: 0.25 },
    AggieHealth: { ZuhlLibrary: 0.50, FrencerFoodCourt: 0.50 },
    HadleyHall: { YoungHall: 0.35, FosterHall: 0.35, BransonLibrary: 0.30 },
};

export const DISTANCE_MATRIX = [
    [0, 80, 120, 200, 280, 300, 450, 400, 550, 600, 350, 600, 700, 520],
    [80, 0, 200, 280, 200, 200, 380, 420, 570, 620, 400, 550, 700, 450],
    [120, 200, 0, 100, 250, 350, 480, 380, 530, 580, 350, 560, 680, 530],
    [200, 280, 100, 0, 250, 380, 480, 350, 500, 560, 300, 520, 640, 530],
    [280, 200, 250, 250, 0, 150, 180, 200, 320, 380, 220, 350, 500, 320],
    [300, 200, 350, 380, 150, 0, 250, 350, 450, 520, 370, 480, 620, 350],
    [450, 380, 480, 480, 180, 250, 0, 320, 220, 380, 350, 420, 560, 200],
    [400, 420, 380, 350, 200, 350, 320, 0, 200, 280, 120, 200, 380, 380],
    [550, 570, 530, 500, 320, 450, 220, 200, 0, 220, 320, 380, 520, 380],
    [600, 620, 580, 560, 380, 520, 380, 280, 220, 0, 380, 280, 480, 480],
    [350, 400, 350, 300, 220, 370, 350, 120, 320, 380, 0, 200, 280, 450],
    [600, 550, 560, 520, 350, 480, 420, 200, 380, 280, 200, 0, 300, 500],
    [700, 700, 680, 640, 500, 620, 560, 380, 520, 480, 280, 300, 0, 650],
    [520, 450, 530, 530, 320, 350, 200, 380, 380, 480, 450, 500, 650, 0],
];

export let HEURISTIC_SCORES = {
    ScienceHall: 0.60,
    WaldenHall: 0.75,
    BiologyAnnex: 0.55,
    AstronomyBuilding: 0.25,
    BransonLibrary: 0.55,
    FosterHall: 0.65,
    YoungHall: 0.55,
    PeteDomenici: 0.85,
    HardmanJacobs: 0.90,
    MiltonHall: 0.65,
    FrencerFoodCourt: 0.60,
    ZuhlLibrary: 0.90,
    AggieHealth: 0.40,
    HadleyHall: 0.75,
};

export function updateProbabilityScores(confirmedPath, alpha = 0.1) {
    const confirmedEdges = new Set();
    for (let i = 0; i < confirmedPath.length - 1; i++) {
        confirmedEdges.add(`${confirmedPath[i]}->${confirmedPath[i + 1]}`);
    }

    for (const from of Object.keys(PROBABILITY_SCORES)) {
        for (const to of Object.keys(PROBABILITY_SCORES[from])) {
            const reward = confirmedEdges.has(`${from}->${to}`) ? 1.0 : 0.0;
            PROBABILITY_SCORES[from][to] =
                (1 - alpha) * PROBABILITY_SCORES[from][to] + alpha * reward;
        }

        const total = Object.values(PROBABILITY_SCORES[from]).reduce((s, v) => s + v, 0);
        for (const to of Object.keys(PROBABILITY_SCORES[from])) {
            PROBABILITY_SCORES[from][to] /= total;
        }
    }
}

export function updateHeuristicScores(confirmedBuilding, alpha = 0.1, penaltyRate = 0.05) {
    for (const building of Object.keys(HEURISTIC_SCORES)) {
        if (building === confirmedBuilding) {
            HEURISTIC_SCORES[building] =
                (1 - alpha) * HEURISTIC_SCORES[building] + alpha * 1.0;
        } else {
            HEURISTIC_SCORES[building] =
                (1 - penaltyRate) * HEURISTIC_SCORES[building] + penaltyRate * 0.0;
        }
    }

    const max = Math.max(...Object.values(HEURISTIC_SCORES));
    for (const building of Object.keys(HEURISTIC_SCORES)) {
        HEURISTIC_SCORES[building] = HEURISTIC_SCORES[building] / max;
    }
}