import React from 'react';
import { Home } from 'lucide-react';

const ListeningScreen = ({ onHome, onNavigate }) => {
  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={onHome}
            className="p-2 rounded-lg bg-white shadow-md mr-4 hover:bg-gray-50"
          >
            <Home size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">🎧 Escuchar y Repetir</h2>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Próximamente</h3>
          <p className="text-gray-600 mb-4">
            Esta sección estará disponible pronto con ejercicios de escucha y pronunciación.
          </p>
          <button 
            onClick={() => onNavigate('speaking')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            🤖 Probar Conversación
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListeningScreen;
