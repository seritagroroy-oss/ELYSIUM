import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Crosshair, Users, Car, ShieldAlert, ArrowLeft, Search, Wifi, Smartphone, Mail, Target } from 'lucide-react';

export default function CtrlTracking({ onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const trackings = [
    { id: 1, name: 'Équipage Alpha', role: 'Patrouille', status: 'En mouvement', speed: '45 km/h', location: 'Zone Industrielle Yopougon', device: 'GPS Véhicule', icon: Car, color: '#3b82f6' },
    { id: 2, name: 'Koffi Laurent', role: 'Agent de Sécurité', status: 'En poste', location: 'Siège BOA Plateau', device: 'Smartphone', icon: Smartphone, color: '#22c55e' },
    { id: 3, name: 'Bamba Souleymane', role: 'Chef de Poste', status: 'Immobile (30min)', location: 'Port Autonome', device: 'Application Mobile', icon: Wifi, color: '#f59e0b' },
    { id: 4, name: 'Équipage Bravo', role: 'Intervention', status: 'Levée de doute en cours', speed: '0 km/h', location: 'Marcory Résidentiel', device: 'GPS Véhicule', icon: Car, color: '#ef4444' }
  ];

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white font-sans">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Crosshair className="text-blue-400" />
              Tracking & Géolocalisation
            </h1>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Synchronisation GPS en direct
            </p>
          </div>
        </div>
        <div className="flex gap-2">
           <div className="bg-gray-700 p-2 rounded-lg flex items-center gap-2">
             <Target size={16} className="text-gray-400" />
             <span className="text-sm font-medium">Radar Actif</span>
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar Liste des Trackings */}
        <div className="w-full lg:w-1/3 border-r border-gray-700 bg-gray-800/50 flex flex-col h-full">
          <div className="p-4 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher un agent, un véhicule..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {trackings.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition-all flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-900" style={{ color: item.color }}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                    <p className="text-xs text-gray-400 truncate">{item.role} • {item.location}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-900" style={{ color: item.color, border: `1px solid ${item.color}40` }}>
                        {item.status}
                      </span>
                      {item.speed && <span className="text-[10px] text-gray-500">{item.speed}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Espace Carte / Radar simulé */}
        <div className="flex-1 relative bg-gray-900 overflow-hidden flex items-center justify-center min-h-[400px]">
          {/* Simulation d'une grille radar */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
               style={{ 
                 backgroundImage: 'linear-gradient(#374151 1px, transparent 1px), linear-gradient(90deg, #374151 1px, transparent 1px)',
                 backgroundSize: '40px 40px'
               }}>
          </div>
          <div className="absolute w-[600px] h-[600px] border border-blue-500/20 rounded-full flex items-center justify-center">
            <div className="absolute w-[400px] h-[400px] border border-blue-500/30 rounded-full flex items-center justify-center">
              <div className="absolute w-[200px] h-[200px] border border-blue-500/50 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
              </div>
            </div>
            {/* Ligne de balayage radar */}
            <div className="absolute w-1/2 h-[2px] bg-gradient-to-r from-transparent to-blue-500 origin-left animate-[spin_4s_linear_infinite]" style={{ top: '50%', left: '50%' }}></div>
          </div>

          {/* Points sur le radar */}
          <div className="absolute z-10" style={{ top: '30%', left: '40%' }}>
            <div className="relative group cursor-pointer">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping absolute"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full relative"></div>
              <div className="absolute top-4 -left-10 bg-gray-800 border border-gray-700 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg">
                <span className="text-blue-400 font-bold">Équipage Alpha</span><br/>45 km/h
              </div>
            </div>
          </div>

          <div className="absolute z-10" style={{ top: '60%', left: '65%' }}>
            <div className="relative group cursor-pointer">
              <div className="w-3 h-3 bg-green-500 rounded-full relative shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
              <div className="absolute top-4 -left-10 bg-gray-800 border border-gray-700 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg">
                <span className="text-green-400 font-bold">Koffi Laurent</span><br/>En poste
              </div>
            </div>
          </div>

          <div className="absolute z-10" style={{ top: '45%', left: '20%' }}>
            <div className="relative group cursor-pointer">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute"></div>
              <div className="w-3 h-3 bg-red-500 rounded-full relative"></div>
              <div className="absolute top-4 -left-10 bg-gray-800 border border-gray-700 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg">
                <span className="text-red-400 font-bold">Équipage Bravo</span><br/>Intervention
              </div>
            </div>
          </div>

          {/* Overlay info */}
          <div className="absolute bottom-4 left-4 bg-gray-800/80 backdrop-blur-sm border border-gray-700 p-3 rounded-lg flex items-center gap-4 text-xs shadow-lg">
             <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Véhicules</div>
             <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Agents (App)</div>
             <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Urgences</div>
          </div>
        </div>
      </div>
    </div>
  );
}
