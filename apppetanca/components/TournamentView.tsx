import React, { useMemo, useState, useRef } from 'react';
import { Team, Round, Match } from '../types';
import MatchCard from './MatchCard';
import Leaderboard from './Leaderboard';
import { calculateLeaderboard } from '../utils/tournamentLogic';
import { parseScoresFromImage, parseMultipleScoresFromImage, parseFullTournamentScoresheet } from '../services/geminiService';
import Spinner from './Spinner';
import { DocumentScannerIcon, SparklesIcon } from './icons';

interface Props {
    initialTeams: Team[];
    rounds: Round[];
    tournamentName: string;
    onUpdateMatch: (roundId: number, matchId: number, score1: number | null, score2: number | null) => void;
    onFinishRound: (roundId: number) => void;
    onReset: () => void;
}

interface Notification {
    type: 'error' | 'success';
    message: string;
}

const TournamentView: React.FC<Props> = ({ initialTeams, rounds, tournamentName, onUpdateMatch, onFinishRound, onReset }) => {
    const allMatches = useMemo(() => rounds.flatMap(r => r.matches), [rounds]);
    
    const teams = useMemo(() => {
        return calculateLeaderboard(initialTeams, allMatches);
    }, [initialTeams, allMatches]);

    const [isProcessingOcr, setIsProcessingOcr] = useState(false);
    const [notification, setNotification] = useState<Notification | null>(null);
    const ocrTargetRef = useRef<{ roundId: number; matchId: number } | null>(null);
    const ocrFileInputRef = useRef<HTMLInputElement>(null);
    const multiOcrTargetRoundIdRef = useRef<number | null>(null);
    const multiOcrFileInputRef = useRef<HTMLInputElement>(null);
    const fullScanFileInputRef = useRef<HTMLInputElement>(null);


    const getTeamById = (id: number | null) => teams.find(t => t.id === id) || initialTeams.find(t => t.id === id);

    const isRoundComplete = (round: Round) => {
        return round.matches.every(m => {
            if (m.team2 === null) return true; // Bye match is always complete
            const isScoreValid = m.score1 !== null && m.score2 !== null && m.score1 !== m.score2;
            return isScoreValid;
        });
    }

    const showNotification = (type: 'error' | 'success', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleOcrRequest = (roundId: number, matchId: number) => {
        ocrTargetRef.current = { roundId, matchId };
        ocrFileInputRef.current?.click();
    };

    const handleOcrFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        const target = ocrTargetRef.current;

        if (!file || !target) return;

        setIsProcessingOcr(true);
        setNotification(null);

        try {
            const scores = await parseScoresFromImage(file);
            if (scores.score1 !== null && scores.score2 !== null) {
                onUpdateMatch(target.roundId, target.matchId, scores.score1, scores.score2);
            } else {
                showNotification("error", "La IA no pudo determinar un resultado válido. Por favor, introdúcelo manualmente.");
            }
        } catch (error) {
            console.error("OCR process failed", error);
            showNotification("error", "Ocurrió un error al procesar la imagen.");
        } finally {
            setIsProcessingOcr(false);
            ocrTargetRef.current = null;
            if (event.target) {
                event.target.value = '';
            }
        }
    };
    
    const handleMultiOcrRequest = (roundId: number) => {
        multiOcrTargetRoundIdRef.current = roundId;
        multiOcrFileInputRef.current?.click();
    };
    
    const handleMultiOcrFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        const roundId = multiOcrTargetRoundIdRef.current;
        if (!file || roundId === null) return;
        
        setIsProcessingOcr(true);
        setNotification(null);

        try {
            const results = await parseMultipleScoresFromImage(file);
            if(results.length > 0) {
                const round = rounds.find(r => r.id === roundId);
                if (round) {
                    let updatedCount = 0;
                    results.forEach(result => {
                        const match = round.matches.find(m => m.pista === result.pista);
                        if(match) {
                            onUpdateMatch(round.id, match.id, result.score1, result.score2);
                            updatedCount++;
                        }
                    });
                     if (updatedCount === 0) {
                        showNotification("error", "La IA no encontró partidos que coincidan en esta ronda.");
                    } else {
                        showNotification("success", `${updatedCount} resultado(s) importado(s) para esta ronda.`);
                    }
                }
            } else {
                 showNotification("error", "La IA no pudo extraer ningún resultado válido de la imagen.");
            }
        } catch (error) {
            console.error("Multi OCR process failed", error);
            showNotification("error", "Ocurrió un error al procesar la hoja de resultados.");
        } finally {
             setIsProcessingOcr(false);
             multiOcrTargetRoundIdRef.current = null;
             if (event.target) {
                event.target.value = '';
            }
        }
    };

    const handleFullScanRequest = () => {
        fullScanFileInputRef.current?.click();
    };

    const handleFullScanFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessingOcr(true);
        setNotification(null);

        try {
            const results = await parseFullTournamentScoresheet(file);
            if (results.length > 0) {
                let totalUpdated = 0;
                results.forEach(roundResult => {
                    const appRound = rounds.find(r => r.id === roundResult.round);
                    if (appRound) {
                        roundResult.matches.forEach(matchResult => {
                            const appMatch = appRound.matches.find(m => m.pista === matchResult.pista);
                            if (appMatch) {
                                onUpdateMatch(appRound.id, appMatch.id, matchResult.score1, matchResult.score2);
                                totalUpdated++;
                            }
                        });
                    }
                });

                if (totalUpdated > 0) {
                    showNotification("success", `${totalUpdated} resultados de ${results.length} ronda(s) han sido importados.`);
                } else {
                    showNotification("error", "La IA procesó la imagen pero no encontró resultados que coincidan.");
                }

            } else {
                showNotification("error", "La IA no pudo extraer ningún resultado válido de la hoja completa.");
            }
        } catch (error) {
            console.error("Full tournament scan process failed", error);
            showNotification("error", "Ocurrió un error grave al procesar la hoja de resultados completa.");
        } finally {
            setIsProcessingOcr(false);
            if (event.target) {
                event.target.value = '';
            }
        }
    };


    return (
        <div className="p-4 md:p-8 relative">
            {isProcessingOcr && (
                <div className="absolute inset-0 bg-white bg-opacity-80 z-50 flex flex-col justify-center items-center">
                    <Spinner />
                    <p className="mt-4 text-lg font-semibold text-france-blue">Analizando con IA...</p>
                </div>
            )}
             
            {notification && (
                 <div className={`fixed top-5 right-5 text-white p-4 rounded-lg shadow-lg z-50 ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-600'}`}>
                    <p>{notification.message}</p>
                 </div>
            )}
            
            <input
                type="file"
                ref={ocrFileInputRef}
                onChange={handleOcrFileSelected}
                accept="image/*"
                capture="environment"
                className="hidden"
            />
            <input
                type="file"
                ref={multiOcrFileInputRef}
                onChange={handleMultiOcrFileSelected}
                accept="image/*"
                capture="environment"
                className="hidden"
            />
            <input
                type="file"
                ref={fullScanFileInputRef}
                onChange={handleFullScanFileSelected}
                accept="image/*"
                capture="environment"
                className="hidden"
            />
            
            <div className="relative text-center mb-8">
                <h1 className="text-4xl font-extrabold text-france-blue mb-2">{tournamentName}</h1>
                <p className="text-gray-500">¡Que gane el mejor equipo!</p>
                <div className="absolute top-0 right-0 flex items-center gap-2">
                    <button
                        onClick={handleFullScanRequest}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
                        title="Escanear toda la hoja del torneo con IA"
                    >
                        <SparklesIcon />
                        <span>Importar Hoja Completa</span>
                    </button>
                    <button
                        onClick={onReset}
                        className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                        title="Volver a la pantalla de inicio"
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {rounds.map((round) => (
                        <div key={round.id}>
                            <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
                                <h2 className="text-2xl font-bold text-gray-800">{round.name}</h2>
                                <div className="flex items-center gap-2">
                                     {!round.isComplete && (
                                         <button
                                            onClick={() => handleMultiOcrRequest(round.id)}
                                            className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-france-blue rounded-md hover:bg-blue-200 transition-colors text-sm"
                                            title="Escanear toda la hoja de la ronda con IA"
                                        >
                                            <DocumentScannerIcon />
                                            <span>Escanear Hoja de Ronda</span>
                                        </button>
                                     )}
                                    {isRoundComplete(round) && !round.isComplete && (
                                        <button 
                                            onClick={() => onFinishRound(round.id)}
                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                                        >
                                            Finalizar Ronda y Avanzar
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-4">
                                {round.matches.map(match => (
                                    <MatchCard
                                        key={match.id}
                                        match={match}
                                        team1={getTeamById(match.team1)}
                                        team2={getTeamById(match.team2)}
                                        onScoreChange={(s1, s2) => onUpdateMatch(round.id, match.id, s1, s2)}
                                        onOcrRequest={() => handleOcrRequest(round.id, match.id)}
                                        isReadOnly={round.isComplete}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-8">
                        <Leaderboard teams={teams} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TournamentView;