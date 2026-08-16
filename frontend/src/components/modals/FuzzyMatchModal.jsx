import React from 'react';
import { X, Check, AlertCircle, Building2, User, FileSpreadsheet, Database } from 'lucide-react';

export default function FuzzyMatchModal({ isOpen, onClose, data, onValidate }) {
  if (!isOpen || !data) return null;

  const { row, matchedAgent, similarity } = data;
  
  // Extraire les infos de la base de données
  const dbName = matchedAgent?.name || 'Inconnu';
  const dbSite = matchedAgent?.site || 'Non défini';
  
  // Extraire la fonction directement de l'objet (en priorisant l'abréviation)
  const dbFunction = matchedAgent?.function || matchedAgent?.function_label || 'Non défini';

  // Extraire les infos du fichier
  const excelName = row.rawName || 'Inconnu';
  const excelSite = row.rawSite || 'Non renseigné (Colonne manquante)';
  const excelFunction = row.rawFunction || 'Non renseigné (Colonne manquante)';

  const simPercent = Math.round(similarity * 100);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(5px)' }}>
      <div className="glass-panel" style={{ width: '90%', maxWidth: '800px', padding: 0, animation: 'scaleIn 0.3s' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(245, 158, 11, 0.1)' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '1.2rem' }}>
            <AlertCircle size={22} />
            Correspondance Imparfaite ({simPercent}% de similitude)
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          <p style={{ color: 'var(--muted)', marginBottom: '24px', textAlign: 'center', fontSize: '1.05rem' }}>
            Vérifiez si l'agent du fichier Excel correspond bien à l'agent trouvé dans la base de données.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Colonne Excel */}
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                <FileSpreadsheet size={18} color="#10b981" />
                Dans le Fichier Excel
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '4px' }}>
                    <User size={14} /> Nom
                  </label>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#10b981' }}>{excelName}</div>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '4px' }}>
                    <Building2 size={14} /> Site / Agence
                  </label>
                  <div style={{ color: 'white' }}>{excelSite}</div>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '4px' }}>
                    <Building2 size={14} /> Fonction / Poste
                  </label>
                  <div style={{ color: 'white' }}>{excelFunction}</div>
                </div>
              </div>
            </div>

            {/* Colonne DB */}
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                <Database size={18} color="var(--primary)" />
                Dans la Base ELYSIUM
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '4px' }}>
                    <User size={14} /> Nom
                  </label>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>{dbName}</div>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '4px' }}>
                    <Building2 size={14} /> Site / Agence
                  </label>
                  <div style={{ color: 'white' }}>{dbSite}</div>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '4px' }}>
                    <Building2 size={14} /> Fonction / Poste
                  </label>
                  <div style={{ color: 'white' }}>{dbFunction}</div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
          <button onClick={onClose} className="btn" style={{ background: 'rgba(255,255,255,0.1)' }}>
            Fermer
          </button>
          <button onClick={() => { onValidate(row.id); onClose(); }} className="btn btn-primary" style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
            <Check size={18} />
            C'est bien lui ! (Valider)
          </button>
        </div>

      </div>
    </div>
  );
}
