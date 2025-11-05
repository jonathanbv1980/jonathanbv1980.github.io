
import React from 'react';
import Modal from './Modal';

interface Props {
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
}

const CreateKnockoutModal: React.FC<Props> = ({ onClose, onConfirm, title, description }) => {
    return (
        <Modal onClose={onClose}>
            <div className="p-6">
                <h2 className="text-2xl font-bold text-france-blue mb-4">{title}</h2>
                <p className="text-gray-600 mb-6">{description}</p>
                
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-france-blue text-white rounded-md hover:bg-opacity-90"
                    >
                        Confirmar y Crear
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CreateKnockoutModal;
