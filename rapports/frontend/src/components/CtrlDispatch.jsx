import React, { useState } from 'react';
import { ShieldAlert, Send, Clock, ArrowLeft, MapPin, CheckCircle2, Car, Phone } from 'lucide-react';

export default function CtrlDispatch({ onClose }) {
  const [activeTab, setActiveTab] = useState('urgences');
  
  const urgences = [
    { id: 1, site: 'Banque Atlantique Plateau', type: 'Intrusion détectée', time: 'Il y a 2 min', priority: 'high', status: 'En attente' },
    { id: 2, site: 'Zone Industrielle Yopougon', type: 'Déclenchement PTI', time: 'Il y a 5 min', priority: 'critical', status: 'Dispatché' },
    { id: 3, site: 'Port Autonome', type: 'Ronde non effectuée', time: 'Il y a 15 min', priority: 'medium', status: 'En attente' }
  ];

  const equipages = [
    { id: 'E1', name: 'Équipage Alpha', status: 'Disponible', dist: '2.5 km', time: '5 min' },
    { id: 'E2', name: 'Équipage Bravo', status: 'En intervention', dist: '8.1 km', time: '15 min' },
    { id: 'E3', name: 'Superviseur Zone Sud', status: 'Disponible', dist: '4.0 km', time: '8 min' }
  ];

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white font-sans">
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ShieldAlert className="text-red-500" />
              Dispatch & Interventions
            </h1>
          </div>
        </div>
        <div className="bg-red-500/20 text-red-500 px-3 py-1 rounded-full text-sm font-bold animate-pulse">
          2 Urgences
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Liste des urgences */}
        <div className="w-1/2 border-r border-gray-700 overflow-y-auto p-4 space-y-4">
          <h2 className="font-bold text-gray-400 uppercase tracking-wider text-sm mb-4">Urgences en attente</h2>
          {urgences.map(u => (
            <div key={u.id} className={`p-4 rounded-xl border ${u.priority === 'critical' ? 'bg-red-900/20 border-red-500/50' : 'bg-gray-800 border-gray-700'} relative overflow-hidden group`}>
              {u.priority === 'critical' && <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/20 rounded-bl-full flex items-start justify-end p-2"><ShieldAlert size={16} className="text-red-500" /></div>}
              
              <h3 className="font-bold text-lg mb-1">{u.site}</h3>
              <p className={`text-sm font-medium ${u.priority === 'critical' ? 'text-red-400' : 'text-orange-400'}`}>{u.type}</p>
              
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Clock size={14} /> {u.time}</span>
                <span className="flex items-center gap-1">
                  {u.status === 'Dispatché' ? <CheckCircle2 size={14} className="text-green-500" /> : <MapPin size={14} />}
                  {u.status}
                </span>
              </div>

              {u.status === 'En attente' && (
                <button className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <Send size={16} /> Assigner une équipe
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Équipes disponibles */}
        <div className="w-1/2 p-4 bg-gray-800/50 overflow-y-auto">
          <h2 className="font-bold text-gray-400 uppercase tracking-wider text-sm mb-4 flex items-center justify-between">
            Unités à proximité
            <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs">Tri: Plus proche</span>
          </h2>

          <div className="space-y-3">
            {equipages.map(e => (
              <div key={e.id} className="bg-gray-800 border border-gray-700 p-4 rounded-xl flex items-center justify-between hover:border-blue-500/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${e.status === 'Disponible' ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
                    <Car size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold">{e.name}</h4>
                    <span className="text-xs text-gray-400">{e.status}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-blue-400">{e.dist}</div>
                  <div className="text-xs text-gray-500">{e.time} estimé</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-gray-800 rounded-xl border border-gray-700 text-center">
            <Phone className="mx-auto text-gray-500 mb-2" size={24} />
            <h4 className="font-bold text-gray-300">Forces de l'ordre</h4>
            <p className="text-xs text-gray-500 mb-4">Si la situation dégénère sur un site</p>
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-sm font-bold transition-colors">Police (111)</button>
              <button className="flex-1 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg text-sm font-bold transition-colors">Sapeurs (119)</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
