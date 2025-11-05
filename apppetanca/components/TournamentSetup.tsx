import React, { useState, useCallback, useRef } from 'react';
import { suggestTournamentName } from '../services/geminiService';
import Spinner from './Spinner';
import { TrashIcon, UploadIcon } from './icons';

interface Props {
    onTournamentStart: (teams: string[], tournamentName: string) => void;
}

const TournamentSetup: React.FC<Props> = ({ onTournamentStart }) => {
    const [teams, setTeams] = useState<string[]>(['', '']);
    const [tournamentName, setTournamentName] = useState('');
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddTeam = () => {
        setTeams([...teams, '']);
    };

    const handleTeamChange = (index: number, value: string) => {
        const newTeams = [...teams];
        newTeams[index] = value;
        setTeams(newTeams);
    };

    const handleRemoveTeam = (index: number) => {
        const newTeams = teams.filter((_, i) => i !== index);
        setTeams(newTeams);
    };

    const handleSuggestName = useCallback(async () => {
        setError('');
        setIsSuggesting(true);
        try {
            const name = await suggestTournamentName();
            setTournamentName(name);
        } catch (e) {
            console.error(e);
            setError('No se pudo sugerir un nombre. Inténtalo de nuevo.');
        } finally {
            setIsSuggesting(false);
        }
    }, []);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        if (!file.name.toLowerCase().endsWith('.csv')) {
            setError('Por favor, selecciona un archivo .csv');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (text) {
                const parsedTeams = text
                    .split(/\r?\n/) // Handle both LF and CRLF line endings
                    .map(line => line.split(',')[0].trim()) // Take only the first part before a comma
                    .filter(name => name); // Remove empty lines

                if (parsedTeams.length > 0) {
                    setTeams(parsedTeams);
                    setError('');
                } else {
                    setError('El archivo CSV está vacío o no contiene nombres de equipo válidos.');
                }
            }
        };
        reader.onerror = () => {
            setError('Error al leer el archivo.');
        };
        reader.readAsText(file);

        if (event.target) {
            event.target.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const nonEmptyTeams = teams.filter(t => t.trim() !== '');
        if (nonEmptyTeams.length < 2) {
            setError('Se necesitan al menos 2 equipos para empezar.');
            return;
        }
        if (!tournamentName.trim()) {
            setError('El nombre del torneo no puede estar vacío.');
            return;
        }
        setError('');
        onTournamentStart(nonEmptyTeams, tournamentName);
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4 md:p-8 bg-white rounded-lg shadow-xl">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-france-blue">Torneo</h1>
                <p className="text-gray-500 mt-2">Introduce los detalles para generar el calendario de partidas.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                 <div>
                     <label htmlFor="tournamentName" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Torneo</label>
                     <div className="flex items-center space-x-2">
                        <input
                            id="tournamentName"
                            type="text"
                            value={tournamentName}
                            onChange={(e) => setTournamentName(e.target.value)}
                            placeholder="Ej: Torneo de Verano"
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-france-blue focus:border-france-blue"
                            required
                        />
                        <button 
                            type="button" 
                            onClick={handleSuggestName}
                            disabled={isSuggesting}
                            className="flex items-center justify-center w-32 px-4 py-2 bg-france-blue text-white rounded-md hover:bg-opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSuggesting ? <Spinner /> : 'Sugerir'}
                        </button>
                     </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Equipos</h3>
                    <div className="space-y-3">
                        {teams.map((team, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={team}
                                    onChange={(e) => handleTeamChange(index, e.target.value)}
                                    placeholder={`Nombre del Equipo ${index + 1}`}
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-france-blue focus:border-france-blue"
                                />
                                {teams.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTeam(index)}
                                        className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                                        aria-label="Eliminar equipo"
                                    >
                                        <TrashIcon />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                     <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
                        <button
                            type="button"
                            onClick={handleAddTeam}
                            className="w-full text-sm py-2 px-4 border border-dashed border-gray-400 text-gray-600 rounded-md hover:bg-gray-100"
                        >
                            + Añadir otro equipo
                        </button>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full text-sm py-2 px-4 border border-dashed border-gray-400 text-gray-600 rounded-md hover:bg-gray-100 flex items-center justify-center gap-2"
                        >
                            <UploadIcon />
                            <span>Importar desde CSV</span>
                        </button>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".csv"
                        className="hidden"
                    />
                </div>
                
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <button
                    type="submit"
                    className="w-full py-3 px-4 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                    Generar Torneo
                </button>
            </form>
        </div>
    );
};

export default TournamentSetup;