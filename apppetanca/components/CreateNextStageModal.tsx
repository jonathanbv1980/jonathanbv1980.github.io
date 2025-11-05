
import React, { useState } from 'react';
import { Team } from '../types';
import Modal from './Modal';

interface Props {
    teams: Team[];
    onClose: () => void;
    onCreateKnockout: (numTeams: number) => void;
}

const CreateNextStageModal: React.FC<Props> = ({ teams, onClose, onCreateKnockout }) => {
    const possibleTeamCounts = [2, 4, 8, 16, 32].filter(n => n <= teams.length && n > 0);
    const [numTeams, setNumTeams] = useState<number>(possibleTeamCounts.length > 0 ? possibleTeamCounts[possibleTeamCounts.length - 1] : 0);

    const handleSubmit = () => {
        if (numTeams > 0) {
            onCreateKnockout(numTeams);
            onClose();
        }
    };
    
    if (possibleTeamCounts.length === 0) {
        return (
             <Modal onClose={onClose}>
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-france-blue mb-4">Fase de Grupos Completa</h2>
                    <p className="text-gray-600 mb-6">No hay suficientes equipos para crear una fase eliminatoria.</p>
                     <div className="flex justify-end space-x-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-france-blue text-white rounded-md hover:bg-opacity-90"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </Modal>
        );
    }
    
    return (
        <Modal onClose={onClose}>
            <div className="p-6">
                <h2 className="text-2xl font-bold text-france-blue mb-4">Crear Fase Eliminatoria</h2>
                <p className="text-gray-600 mb-6">La fase de grupos ha terminado. Selecciona cuántos de los mejores equipos avanzarán a la siguiente fase.</p>
                
                <div className="mb-6">
                    <label htmlFor="numTeams" className="block text-sm font-medium text-gray-700 mb-2">
                        Equipos que clasifican:
                    </label>
                    <select
                        id="numTeams"
                        value={numTeams}
                        onChange={(e) => setNumTeams(parseInt(e.target.value, 10))}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-france-blue focus:border-france-blue"
                    >
                        {possibleTeamCounts.map(count => (
                            <option key={count} value={count}>
                                {count} equipos (Top {count} de la clasificación)
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-france-blue text-white rounded-md hover:bg-opacity-90"
                    >
                        Crear Fase
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CreateNextStageModal;
