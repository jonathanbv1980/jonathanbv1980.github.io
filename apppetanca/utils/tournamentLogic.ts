
import { Team, Match } from '../types';

// Fisher-Yates shuffle algorithm
const shuffle = <T>(array: T[]): T[] => {
    let currentIndex = array.length, randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
};

export const createInitialTeams = (teamNames: string[]): Team[] => {
    // FIX: Removed unused 'club' property.
    return teamNames.map((name, index) => ({
        id: index + 1,
        name: name.trim() || `Equipo ${index + 1}`,
        pg: 0,
        pf: 0,
        pc: 0,
        dif: 0,
        pts: 0,
    }));
};

export const createRoundRobinMatches = (teams: Team[]): Match[] => {
    const shuffledTeams = shuffle([...teams]);
    const teamCount = shuffledTeams.length;
    const matches: Match[] = [];
    let matchId = 1;

    if (teamCount < 2) return [];

    const teamsWithBye = teamCount % 2 !== 0 ? [...shuffledTeams, null] : [...shuffledTeams];
    const numTeamsWithBye = teamsWithBye.length;
    const rounds = numTeamsWithBye - 1;

    for (let round = 0; round < rounds; round++) {
        for (let i = 0; i < numTeamsWithBye / 2; i++) {
            const team1 = teamsWithBye[i];
            const team2 = teamsWithBye[numTeamsWithBye - 1 - i];

            if (team1 && team2) {
                matches.push({
                    id: matchId++,
                    round: round + 1,
                    pista: i + 1,
                    team1: team1.id,
                    team2: team2.id,
                    score1: null,
                    score2: null,
                    winner: null,
                });
            } else if (team1) { // team2 is null (bye)
                 matches.push({
                    id: matchId++,
                    round: round + 1,
                    pista: i + 1,
                    team1: team1.id,
                    team2: null,
                    score1: null,
                    score2: null,
                    winner: team1.id, // The team with a bye automatically "wins" this non-match
                });
            } else if (team2) { // team1 is null (bye)
                 matches.push({
                    id: matchId++,
                    round: round + 1,
                    pista: i + 1,
                    team1: team2.id,
                    team2: null,
                    score1: null,
                    score2: null,
                    winner: team2.id,
                });
            }
        }
        // Rotate teams for the next round
        const lastTeam = teamsWithBye.pop();
        if (lastTeam !== undefined) {
             teamsWithBye.splice(1, 0, lastTeam);
        }
    }
    return matches;
};


export const calculateLeaderboard = (teams: Team[], matches: Match[]): Team[] => {
    const teamStats: { [key: number]: Team } = {};

    teams.forEach(team => {
        teamStats[team.id] = { ...team, pg: 0, pf: 0, pc: 0, dif: 0, pts: 0 };
    });

    matches.forEach(match => {
        if (match.score1 === null || match.score2 === null || match.team2 === null) return;
        
        const team1 = teamStats[match.team1];
        const team2 = teamStats[match.team2];

        if (!team1 || !team2) return;

        team1.pf += match.score1;
        team1.pc += match.score2;
        team2.pf += match.score2;
        team2.pc += match.score1;

        // FIX: Changed scoring to 3 points for a win and 0 for a loss.
        if (match.score1 > match.score2) {
            team1.pg += 1;
            team1.pts += 3; // 3 points for a win
            team2.pts += 0; // 0 points for a loss
        } else if (match.score2 > match.score1) {
            team2.pg += 1;
            team2.pts += 3; // 3 points for a win
            team1.pts += 0; // 0 points for a loss
        }
        // No points for a tie, as they are not allowed
    });

    const updatedTeams = Object.values(teamStats).map(team => ({
        ...team,
        dif: team.pf - team.pc,
    }));

    updatedTeams.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.pg !== a.pg) return b.pg - a.pg;
        if (b.dif !== a.dif) return b.dif - a.dif;
        if (b.pf !== a.pf) return b.pf - a.pf;
        return a.id - b.id; // Tie-breaker by ID
    });

    return updatedTeams;
};


export const createKnockoutMatches = (teams: Team[]): Match[] => {
    if (teams.length < 2) return [];

    const shuffledTeams = shuffle([...teams]);
    const matches: Match[] = [];
    let matchId = 1;
    
    for(let i=0; i < shuffledTeams.length; i+=2) {
        const team1 = shuffledTeams[i];
        const team2 = shuffledTeams[i+1];
        
        if (team1 && team2) {
             matches.push({
                id: matchId++,
                round: 1,
                pista: (i/2) + 1,
                team1: team1.id,
                team2: team2.id,
                score1: null,
                score2: null,
                winner: null
            });
        }
    }
    return matches;
}
