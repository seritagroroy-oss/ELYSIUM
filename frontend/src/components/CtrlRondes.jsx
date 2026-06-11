import React, { useState } from 'react';
import { Clock, ArrowLeft, ShieldCheck, MapPin, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CtrlRondes({ onClose }) {
  const rondes = [
    { id: 1, site: 'Banque Atlantique', agent: 'Koffi Laurent', progress: '3/5', status: 'En cours', lastScan: 'Il y a 2 min', alert: null },
    { id: 2, site: 'Port Autonome', agent: 'Touré Moussa', progress: '12/12', status: 'Terminée', lastScan: 'Il y a 45 min', alert: null },
    { id: 3, site: 'Zone Ind. Yopougon', agent: 'Bamba Souleymane', progress: '1/8', status: 'Retard', lastScan: 'Il y a 1h 20min', alert: 'Retard point de ronde 2' },
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
              <Activity className="text-teal-400" />
              Supervision des Rondes
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full space-y-6">
        {/* Résumé */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center text-center">
             <div className="text-3xl font-bold text-teal-400">12</div>
             <div className="text-xs text-gray-400">Rondes prévues</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center text-center">
             <div className="text-3xl font-bold text-blue-400">8</div>
             <div className="text-xs text-gray-400">En cours</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl border border-red-500/50 bg-red-900/10 flex flex-col items-center justify-center text-center">
             <div className="text-3xl font-bold text-red-500">1</div>
             <div className="text-xs text-gray-400">Anomalie</div>
          </div>
        </div>

        {/* Liste des rondes */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-300">Rondes en direct</h2>
          {rondes.map(r => (
            <div key={r.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                 <div className={`p-3 rounded-full ${r.status === 'Terminée' ? 'bg-green-500/20 text-green-500' : r.status === 'Retard' ? 'bg-red-500/20 text-red-500' : 'bg-teal-500/20 text-teal-400'}`}>
                    <ShieldCheck size={24} />
                 </div>
                 <div>
                   <h3 className="font-bold text-lg">{r.site}</h3>
                   <p className="text-sm text-gray-400 flex items-center gap-1"><MapPin size={14} /> Agent: {r.agent}</p>
                 </div>
              </div>

              <div className="flex-1 w-full md:w-auto px-0 md:px-8">
                 <div className="flex justify-between text-xs mb-1">
                   <span className="text-gray-400">Progression NFC</span>
                   <span className="font-bold">{r.progress}</span>
                 </div>
                 <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                   <div className={`h-full ${r.status === 'Retard' ? 'bg-red-500' : 'bg-teal-400'}`} style={{ width: `${(parseInt(r.progress.split('/')[0]) / parseInt(r.progress.split('/')[1])) * 100}%` }}></div>
                 </div>
              </div>

              <div className="flex flex-col items-end">
                <span className={`text-xs font-bold px-2 py-1 rounded-full border ${r.status === 'Terminée' ? 'bg-green-500/10 border-green-500/30 text-green-400' : r.status === 'Retard' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
                  {r.status}
                </span>
                <span className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Clock size={12}/> {r.lastScan}</span>
                {r.alert && <span className="text-[10px] text-red-400 flex items-center gap-1 mt-1"><AlertCircle size={10} /> {r.alert}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
