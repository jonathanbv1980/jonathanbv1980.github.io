import React from 'react';
import { Match, Team } from '../types';
import { CameraIcon } from './icons';

interface Props {
    match: Match;
    team1?: Team;
    team2?: Team;
    onScoreChange: (score1: number | null, score2: number | null) => void;
    onOcrRequest: () => void;
    isReadOnly: boolean;
}

const MatchCard: React.FC<Props> = ({ match, team1, team2, onScoreChange, onOcrRequest, isReadOnly }) => {
    const handleScoreInputChange = (team: 'team1' | 'team2', value: string) => {
        if (isReadOnly) return;
        
        let score: number | null = parseInt(value, 10);

        if (isNaN(score)) {
            score = null;
        } else {
            if (score < 0) score = 0;
            if (score > 13) score = 13;
        }

        const newScore1 = team === 'team1' ? score : match.score1;
        const newScore2 = team === 'team2' ? score : match.score2;

        onScoreChange(newScore1, newScore2);
    };

    if (!team1) return null;

    const isComplete = match.score1 !== null && match.score2 !== null;
    const isTie = isComplete && match.score1 === match.score2;

    const baseInputClasses = "w-14 text-center p-1 border rounded focus:outline-none focus:ring-2 focus:ring-france-blue disabled:bg-gray-100 transition-colors duration-200";
    
    let score1Classes = baseInputClasses;
    let score2Classes = baseInputClasses;

    if (isComplete && !isTie) {
        if (match.score1! > match.score2!) {
            score1Classes += ' bg-green-100 border-green-400 text-green-800 font-bold';
            score2Classes += ' bg-red-100 border-red-400 text-red-800';
        } else {
            score1Classes += ' bg-red-100 border-red-400 text-red-800';
            score2Classes += ' bg-green-100 border-green-400 text-green-800 font-bold';
        }
    } else if (isTie) {
        score1Classes += ' border-red-500 ring-red-500 bg-red-50';
        score2Classes += ' border-red-500 ring-red-500 bg-red-50';
    } else {
        score1Classes += ' border-gray-300';
        score2Classes += ' border-gray-300';
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="text-sm text-gray-500 mb-2">
                <span>Pista {match.pista}</span>
            </div>
            <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4">
                <div className="text-right font-semibold text-gray-800 truncate" title={`${team1.name} (EQ${team1.id})`}>
                    {team1.name} <span className="text-xs text-gray-400">(EQ{team1.id})</span>
                </div>
                <div className="flex items-center justify-center">
                    <input
                        type="number"
                        min="0"
                        max="13"
                        value={match.score1 ?? ''}
                        onChange={(e) => handleScoreInputChange('team1', e.target.value)}
                        className={score1Classes}
                        disabled={isReadOnly || match.team2 === null}
                        placeholder="-"
                        aria-label={`Puntuación del equipo ${team1.name}`}
                    />
                    
                     {!isReadOnly && match.team2 !== null ? (
                         <button
                            type="button"
                            onClick={onOcrRequest}
                            className="p-2 mx-1 text-gray-500 hover:text-france-blue hover:bg-blue-100 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-label="Escanear resultado con IA"
                            title="Escanear resultado con IA"
                            disabled={isReadOnly}
                        >
                            <CameraIcon />
                        </button>
                    ) : (
                        <span className="text-gray-400 font-bold mx-2">-</span>
                    )}

                    <input
                        type="number"
                        min="0"
                        max="13"
                        value={match.score2 ?? ''}
                        onChange={(e) => handleScoreInputChange('team2', e.target.value)}
                        className={score2Classes}
                        disabled={isReadOnly || match.team2 === null}
                        placeholder="-"
                        aria-label={`Puntuación del equipo ${team2?.name ?? 'Descansa'}`}
                    />
                </div>
                <div className="font-semibold text-gray-800 truncate" title={team2 ? `${team2.name} (EQ${team2.id})` : 'Descansa'}>
                    {team2 ? (
                        <>
                           <span className="text-xs text-gray-400">(EQ{team2.id})</span> {team2.name}
                        </>
                    ) : (
                        <span className="text-green-600 font-bold">DESCANSA</span>
                    )}
                </div>
            </div>
             {isTie && <p className="text-center text-red-600 font-semibold text-sm mt-2">No se permiten empates.</p>}
        </div>
    );
};

export default MatchCard;