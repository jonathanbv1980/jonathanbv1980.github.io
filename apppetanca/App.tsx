
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import TournamentSetup from './components/TournamentSetup';
import TournamentView from './components/TournamentView';
import CreateNextStageModal from './components/CreateNextStageModal';
import { Tournament, Team, Phase, Round, Match } from './types';
import { createInitialTeams, createRoundRobinMatches, calculateLeaderboard, createKnockoutMatches } from './utils/tournamentLogic';

const TOURNAMENT_STORAGE_KEY = 'petanqueTournament';
const TEAMS_STORAGE_KEY = 'petanqueInitialTeams';

const App: React.FC = () => {
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [initialTeams, setInitialTeams] = useState<Team[]>([]);
    const [showNextStageModal, setShowNextStageModal] = useState(false);

    // Load state from localStorage on initial render
    useEffect(() => {
        try {
            const savedTournament = localStorage.getItem(TOURNAMENT_STORAGE_KEY);
            const savedTeams = localStorage.getItem(TEAMS_STORAGE_KEY);
            if (savedTournament) {
                setTournament(JSON.parse(savedTournament));
            }
            if (savedTeams) {
                setInitialTeams(JSON.parse(savedTeams));
            }
        } catch (error) {
            console.error("Failed to load state from localStorage", error);
            // Clear corrupted data
            localStorage.removeItem(TOURNAMENT_STORAGE_KEY);
            localStorage.removeItem(TEAMS_STORAGE_KEY);
        }
    }, []);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        try {
            if (tournament) {
                localStorage.setItem(TOURNAMENT_STORAGE_KEY, JSON.stringify(tournament));
            } else {
                localStorage.removeItem(TOURNAMENT_STORAGE_KEY);
            }
            if (initialTeams.length > 0) {
                 localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(initialTeams));
            } else {
                localStorage.removeItem(TEAMS_STORAGE_KEY);
            }
        } catch (error) {
            console.error("Failed to save state to localStorage", error);
        }
    }, [tournament, initialTeams]);


    const handleTournamentStart = useCallback((teamNames: string[], tournamentName: string) => {
        const teams = createInitialTeams(teamNames);
        const matches = createRoundRobinMatches(teams);
        const rounds: Round[] = [];
        
        const matchesByRound: { [key: number]: Match[] } = {};
        matches.forEach(match => {
            if (!matchesByRound[match.round]) {
                matchesByRound[match.round] = [];
            }
            matchesByRound[match.round].push(match);
        });
        
        Object.keys(matchesByRound).forEach(roundNum => {
            rounds.push({
                id: parseInt(roundNum),
                name: `Ronda ${roundNum}`,
                matches: matchesByRound[parseInt(roundNum)],
                isComplete: false,
            });
        });

        const initialPhase: Phase = {
            id: 1,
            name: tournamentName,
            type: 'round-robin',
            rounds: rounds,
            teams: teams,
            isComplete: false,
        };
        
        setInitialTeams(teams);
        setTournament({ phases: [initialPhase] });
    }, []);

    const handleUpdateMatch = useCallback((roundId: number, matchId: number, score1: number | null, score2: number | null) => {
        setTournament(prev => {
            if (!prev) return null;
            const newPhases = prev.phases.map(phase => {
                const newRounds = phase.rounds.map(round => {
                    if (round.id === roundId) {
                        const newMatches = round.matches.map(match => {
                            if (match.id === matchId) {
                                return { ...match, score1, score2 };
                            }
                            return match;
                        });
                        return { ...round, matches: newMatches };
                    }
                    return round;
                });
                return { ...phase, rounds: newRounds };
            });
            return { ...prev, phases: newPhases };
        });
    }, []);
    
    const handleFinishRound = useCallback((roundId: number) => {
         setTournament(prev => {
            if (!prev) return null;
            const newPhases = prev.phases.map(phase => {
                 const newRounds = phase.rounds.map(round => {
                    if (round.id === roundId) {
                        return { ...round, isComplete: true };
                    }
                    return round;
                });

                if(newRounds.every(r => r.isComplete)) {
                    if(phase.type === 'round-robin') {
                         setShowNextStageModal(true);
                    }
                    return { ...phase, rounds: newRounds, isComplete: true };
                }

                return { ...phase, rounds: newRounds };
            });
            return { ...prev, phases: newPhases };
        });
    }, []);
    
    const handleCreateKnockout = useCallback((numTeams: number) => {
        if (!tournament) return;

        const lastPhase = tournament.phases[tournament.phases.length - 1];
        const allMatches = lastPhase.rounds.flatMap(r => r.matches);
        const rankedTeams = calculateLeaderboard(initialTeams, allMatches);
        const advancingTeams = rankedTeams.slice(0, numTeams);
        
        const knockoutMatches = createKnockoutMatches(advancingTeams);

        const knockoutPhase: Phase = {
            id: tournament.phases.length + 1,
            name: `Fase Eliminatoria - ${numTeams} equipos`,
            type: 'knockout',
            rounds: [{
                id: 1,
                name: `Ronda de ${numTeams}`,
                matches: knockoutMatches,
                isComplete: false,
            }],
            teams: advancingTeams,
            isComplete: false,
        };

        setTournament(prev => prev ? ({...prev, phases: [...prev.phases, knockoutPhase]}) : null);
        setShowNextStageModal(false);

    }, [tournament, initialTeams]);

    const handleReset = useCallback(() => {
        if (window.confirm('¿Estás seguro de que quieres volver al inicio? Se perderá todo el progreso no guardado.')) {
            setTournament(null);
            setInitialTeams([]);
            setShowNextStageModal(false);
            localStorage.removeItem(TOURNAMENT_STORAGE_KEY);
            localStorage.removeItem(TEAMS_STORAGE_KEY);
        }
    }, []);


    const activePhase = useMemo(() => {
        if (!tournament) return null;
        return tournament.phases.find(p => !p.isComplete) || tournament.phases[tournament.phases.length - 1];
    }, [tournament]);

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col">
            <main className="flex-grow">
                {!tournament || !activePhase ? (
                    <div className="flex items-center justify-center h-full p-4">
                        <TournamentSetup onTournamentStart={handleTournamentStart} />
                    </div>
                ) : (
                    <>
                        <TournamentView
                            tournamentName={activePhase.name}
                            initialTeams={initialTeams}
                            rounds={activePhase.rounds}
                            onUpdateMatch={handleUpdateMatch}
                            onFinishRound={handleFinishRound}
                            onReset={handleReset}
                        />
                        {showNextStageModal && (
                            <CreateNextStageModal 
                                teams={initialTeams}
                                onClose={() => setShowNextStageModal(false)}
                                onCreateKnockout={handleCreateKnockout}
                            />
                        )}
                    </>
                )}
            </main>
            <footer className="text-center py-4 bg-gray-100 border-t border-gray-200 text-gray-600 text-sm">
                Aplicación generada por Jónathan.Bacaicoa.Valls.
            </footer>
        </div>
    );
};

export default App;
