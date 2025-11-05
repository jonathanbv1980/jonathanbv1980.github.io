
import React from 'react';
import { Team } from '../types';

interface Props {
    teams: Team[];
}

const Leaderboard: React.FC<Props> = ({ teams }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
            <h3 className="text-xl font-bold text-france-blue mb-4">Clasificación</h3>
            <table className="w-full text-left table-auto">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-3 font-semibold text-sm text-gray-600">#</th>
                        <th className="p-3 font-semibold text-sm text-gray-600">Equipo</th>
                        <th className="p-3 font-semibold text-sm text-gray-600 text-center">P.G.</th>
                        <th className="p-3 font-semibold text-sm text-gray-600 text-center">PF</th>
                        <th className="p-3 font-semibold text-sm text-gray-600 text-center">PC</th>
                        <th className="p-3 font-semibold text-sm text-gray-600 text-center">DIF</th>
                        <th className="p-3 font-semibold text-sm text-gray-600 text-center">Pts</th>
                    </tr>
                </thead>
                <tbody>
                    {teams.map((team, index) => (
                        <tr key={team.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            {/* FIX: Display rank (index + 1) instead of team ID. */}
                            <td className="p-3 font-medium text-gray-800">{index + 1}</td>
                            <td className="p-3">
                                <div className="font-bold text-gray-900">{team.name}</div>
                            </td>
                            <td className="p-3 text-center">{team.pg}</td>
                            <td className="p-3 text-center">{team.pf}</td>
                            <td className="p-3 text-center">{team.pc}</td>
                            <td className="p-3 text-center font-semibold">{team.dif}</td>
                            <td className="p-3 text-center font-bold text-france-blue">{team.pts}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Leaderboard;
