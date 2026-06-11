import React, { useState } from 'react';
import { Car, Camera, Fuel, ArrowLeft, PenTool, CheckCircle, AlertTriangle, FileText, Wrench } from 'lucide-react';

export default function CtrlFlotte({ onClose }) {
  const [step, setStep] = useState(1);

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white font-sans overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Car className="text-purple-500" />
              Gestion Flotte (État des lieux)
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full">
        {/* Stepper */}
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-700 -z-10 -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-0 h-1 bg-purple-500 -z-10 -translate-y-1/2 transition-all" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
          
          <div className={`flex flex-col items-center gap-2 ${step >= 1 ? 'text-purple-400' : 'text-gray-500'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-purple-500 bg-gray-900' : 'border-gray-600 bg-gray-800'}`}>1</div>
            <span className="text-xs font-bold">Identifiant</span>
          </div>
          <div className={`flex flex-col items-center gap-2 ${step >= 2 ? 'text-purple-400' : 'text-gray-500'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-purple-500 bg-gray-900' : 'border-gray-600 bg-gray-800'}`}>2</div>
            <span className="text-xs font-bold">Kilométrage</span>
          </div>
          <div className={`flex flex-col items-center gap-2 ${step >= 3 ? 'text-purple-400' : 'text-gray-500'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-purple-500 bg-gray-900' : 'border-gray-600 bg-gray-800'}`}>3</div>
            <span className="text-xs font-bold">Photos & Dommages</span>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6 bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Sélection du véhicule</h2>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Immatriculation</label>
              <select className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-purple-500 outline-none">
                <option value="">Sélectionner...</option>
                <option value="1">1234 AB 01 (Dacia Duster)</option>
                <option value="2">5678 CD 01 (Renault Kangoo)</option>
                <option value="3">9012 EF 01 (Toyota Hilux)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Type de contrôle</label>
              <div className="grid grid-cols-2 gap-4">
                <button className="py-3 bg-purple-600 text-white rounded-lg font-bold border border-purple-500">Prise de service</button>
                <button className="py-3 bg-gray-700 text-white rounded-lg font-bold border border-gray-600">Fin de service</button>
              </div>
            </div>
            <button onClick={() => setStep(2)} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold mt-4 transition-colors">
              Suivant
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Tableau de bord</h2>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Kilométrage actuel (km)</label>
              <input type="number" placeholder="Ex: 145000" className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-purple-500 outline-none" />
              <p className="text-xs text-orange-400 mt-2 flex items-center gap-1"><AlertTriangle size={14}/> Précédent: 144,850 km</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Niveau de carburant</label>
              <div className="flex gap-2">
                {['Vide', '1/4', '1/2', '3/4', 'Plein'].map((level, i) => (
                  <button key={level} className={`flex-1 py-2 text-xs font-bold rounded ${i === 3 ? 'bg-purple-600' : 'bg-gray-700'}`}>{level}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setStep(1)} className="w-1/3 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-colors">Retour</button>
              <button onClick={() => setStep(3)} className="w-2/3 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors">Suivant</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Inspection visuelle</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <button className="aspect-video bg-gray-900 rounded-lg border border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:text-purple-400 hover:border-purple-400 transition-colors">
                <Camera size={32} className="mb-2" />
                <span className="text-sm">Avant</span>
              </button>
              <button className="aspect-video bg-gray-900 rounded-lg border border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:text-purple-400 hover:border-purple-400 transition-colors">
                <Camera size={32} className="mb-2" />
                <span className="text-sm">Arrière</span>
              </button>
              <button className="aspect-video bg-gray-900 rounded-lg border border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:text-purple-400 hover:border-purple-400 transition-colors">
                <Camera size={32} className="mb-2" />
                <span className="text-sm">Côté Gauche</span>
              </button>
              <button className="aspect-video bg-gray-900 rounded-lg border border-dashed border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:text-purple-400 hover:border-purple-400 transition-colors">
                <Camera size={32} className="mb-2" />
                <span className="text-sm">Côté Droit</span>
              </button>
            </div>

            <div className="mt-6">
               <label className="block text-sm font-medium text-gray-400 mb-2">Signaler un nouveau dommage / anomalie</label>
               <textarea rows="3" placeholder="Décrivez l'anomalie (rayure, pneu dégonflé...)" className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-purple-500 outline-none"></textarea>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setStep(2)} className="w-1/3 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-colors">Retour</button>
              <button onClick={() => { alert('Fiche véhicule enregistrée avec succès !'); onClose(); }} className="w-2/3 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors">
                <CheckCircle size={20} /> Valider l'état
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
