
export interface Team {
    id: number;
    name: string;
    pg: number; // Partidos Ganados (Matches Won)
    pf: number; // Puntos a Favor (Points For)
    pc: number; // Puntos en Contra (Points Against)
    dif: number; // Diferencia de Puntos (Point Difference)
    pts: number; // Puntos (Total Points)
}

export interface Match {
    id: number;
    round: number;
    pista: number; // Pista = Court/Field
    team1: number;
    team2: number | null; // null for a bye
    score1: number | null;
    score2: number | null;
    winner: number | null;
}

export interface Round {
    id: number;
    name: string;
    matches: Match[];
    isComplete: boolean;
}

export interface Phase {
    id: number;
    name: string;
    type: 'round-robin' | 'knockout';
    rounds: Round[];
    teams: Team[];
    isComplete: boolean;
}

export interface Tournament {
    phases: Phase[];
}
