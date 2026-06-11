import React, { useState } from 'react';
import { Star, ArrowLeft, Send, UserCheck, AlertOctagon, CheckCircle2 } from 'lucide-react';

export default function CtrlNotation({ onClose }) {
  const [submitted, setSubmitted] = useState(false);
  
  const [rating, setRating] = useState({
    tenue: 0,
    posture: 0,
    connaissance: 0
  });

  const renderStars = (category) => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating({...rating, [category]: star})}
            className={`transition-colors ${rating[category] >= star ? 'text-yellow-400' : 'text-gray-600'}`}
          >
            <Star size={28} fill={rating[category] >= star ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
    );
  };

  if (submitted) {
    return (
      <div className="h-full flex flex-col bg-gray-900 text-white items-center justify-center p-6">
        <div className="bg-green-500/20 p-6 rounded-full mb-6">
          <CheckCircle2 size={64} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Évaluation enregistrée</h2>
        <p className="text-gray-400 text-center mb-8">La notation a bien été transmise au dossier de l'agent et aux RH.</p>
        <button onClick={onClose} className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold transition-colors">
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white font-sans">
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Star className="text-yellow-500" />
              Évaluation & Discipline
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 space-y-6">
          
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Agent contrôlé</label>
            <select className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none">
              <option value="">Sélectionner un agent...</option>
              <option value="1">Koffi Laurent (Matricule: 00142)</option>
              <option value="2">Bamba Souleymane (Matricule: 00891)</option>
              <option value="3">Touré Moussa (Matricule: 00234)</option>
            </select>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-700">
            <h3 className="font-bold text-lg">Critères d'évaluation</h3>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-900 rounded-lg">
              <div>
                <span className="font-medium text-sm">Tenue & Équipement</span>
                <p className="text-xs text-gray-500">Port de l'uniforme, propreté, badge visible.</p>
              </div>
              {renderStars('tenue')}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-900 rounded-lg">
              <div>
                <span className="font-medium text-sm">Posture & Vigilance</span>
                <p className="text-xs text-gray-500">Attitude professionnelle, pas de téléphone au poste.</p>
              </div>
              {renderStars('posture')}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-900 rounded-lg">
              <div>
                <span className="font-medium text-sm">Connaissance Consignes</span>
                <p className="text-xs text-gray-500">Maîtrise des procédures spécifiques au site.</p>
              </div>
              {renderStars('connaissance')}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <label className="block text-sm font-bold text-gray-300 mb-2">Commentaires / Avertissement</label>
            <textarea rows="4" placeholder="Observation spécifique, point positif ou manquement justifiant un avertissement..." className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"></textarea>
          </div>

          <div className="flex gap-4 pt-4">
             <button className="w-1/3 py-4 bg-red-900/50 hover:bg-red-900/80 text-red-400 border border-red-500/30 rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
               <AlertOctagon size={18} /> Signalement
             </button>
             <button onClick={() => setSubmitted(true)} className="w-2/3 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
               <Send size={18} /> Enregistrer
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}
