import React, { useState } from 'react';
import { MessageSquareWarning, Send, ShieldAlert, CheckCircle2, AlertTriangle, User, MapPin } from 'lucide-react';

export default function CtrlRapport() {
  const [formData, setFormData] = useState({
    site: 'Siège Social Cocody',
    type: 'Matériel Défectueux',
    agent: 'Koffi Marc',
    severity: 'medium',
    description: '',
    photoAttached: false,
    audioAttached: false
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const incidentTypes = [
    'Matériel Défectueux',
    'Absence d\'Agent',
    'Conflit / Bagarre',
    'Intrusion / Tentative',
    'Incendie / Risque Incendie',
    'Retard Majeur',
    'Autre Incident Opérationnel'
  ];

  const sites = [
    'Siège Social Cocody',
    'Entrepôt Vridi',
    'Zone Industrielle Yopougon',
    'Centre Commercial Marcory'
  ];

  const severityLevels = [
    { value: 'low', label: 'Faible', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    { value: 'medium', label: 'Moyen', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    { value: 'high', label: 'Élevé', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
    { value: 'critical', label: 'CRITIQUE (PC)', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          ...formData,
          description: '',
          photoAttached: false,
          audioAttached: false
        });
      }, 3000);
    }, 1200);
  };

  return (
    <div className="fade-in" style={{ paddingBottom: '40px', minHeight: '80vh', backgroundColor: '#090d16', color: '#f1f5f9', borderRadius: '16px', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.2)', paddingBottom: '20px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171' }}>
          <MessageSquareWarning size={28} /> Rapport d'Incident Express
        </h1>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
          Déclaration d'incident en direct du terrain. Synchronisé automatiquement avec le PC et la Direction Générale.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Form Container */}
        <div style={{ flex: '2 1 500px', backgroundColor: '#111827', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px', padding: '24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Row 1: Site & Type */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#cbd5e1', fontWeight: '600' }}>
                  Site concerné
                </label>
                <select
                  value={formData.site}
                  onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#1f2937', border: '1px solid #374151', color: 'white', outline: 'none' }}
                >
                  {sites.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#cbd5e1', fontWeight: '600' }}>
                  Nature de l'incident
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#1f2937', border: '1px solid #374151', color: 'white', outline: 'none' }}
                >
                  {incidentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Row 2: Agent (optional/prefilled) */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#cbd5e1', fontWeight: '600' }}>
                Agent impliqué / Constatant
              </label>
              <input
                type="text"
                value={formData.agent}
                onChange={(e) => setFormData({ ...formData, agent: e.target.value })}
                placeholder="Ex: Koffi Marc (laisser vide si aucun)"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#1f2937', border: '1px solid #374151', color: 'white', outline: 'none' }}
              />
            </div>

            {/* Row 3: Severity Level */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#cbd5e1', fontWeight: '600' }}>
                Niveau d'Urgence / Gravité
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {severityLevels.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, severity: level.value })}
                    style={{
                      flex: '1 1 100px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: formData.severity === level.value ? `2px solid ${level.color}` : '1px solid #374151',
                      backgroundColor: formData.severity === level.value ? level.bg : '#1f2937',
                      color: formData.severity === level.value ? 'white' : '#cbd5e1',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ color: level.color, marginRight: '4px' }}>●</span> {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 4: Details Textarea */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#cbd5e1', fontWeight: '600' }}>
                Description détaillée des faits
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="Décrivez précisément ce qu'il s'est passé, les personnes impliquées et les mesures immédiates prises..."
                style={{
                  width: '100%',
                  height: '140px',
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  padding: '12px',
                  color: 'white',
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                  resize: 'none',
                  outline: 'none'
                }}
              />
            </div>

            {/* Photo & Audio Simulation Attachments */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, photoAttached: !formData.photoAttached })}
                style={{
                  flex: '1 1 180px',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px dashed ' + (formData.photoAttached ? '#10b981' : '#374151'),
                  backgroundColor: formData.photoAttached ? 'rgba(16,185,129,0.1)' : 'transparent',
                  color: formData.photoAttached ? '#10b981' : '#cbd5e1',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.85rem'
                }}
              >
                {formData.photoAttached ? '✓ Photo du Constat Connectée' : '📸 Attacher une Photo (Simulation)'}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, audioAttached: !formData.audioAttached })}
                style={{
                  flex: '1 1 180px',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px dashed ' + (formData.audioAttached ? '#10b981' : '#374151'),
                  backgroundColor: formData.audioAttached ? 'rgba(16,185,129,0.1)' : 'transparent',
                  color: formData.audioAttached ? '#10b981' : '#cbd5e1',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.85rem'
                }}
              >
                {formData.audioAttached ? '✓ Note Vocale Attachée' : '🎤 Enregistrer Note Vocale (Simulation)'}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || submitted}
              style={{
                padding: '14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: submitted ? '#10b981' : '#ef4444',
                color: 'white',
                fontWeight: '700',
                fontSize: '1rem',
                cursor: (loading || submitted) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: submitted ? 'none' : '0 4px 15px rgba(239, 68, 68, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              {loading ? (
                <span>Transmission en cours...</span>
              ) : submitted ? (
                <>
                  <CheckCircle2 size={20} /> Transmis avec Succès au PC & DG !
                </>
              ) : (
                <>
                  <Send size={18} /> Transmettre le Rapport d'Incident
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Info Box */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="#ef4444" /> Protocole d'Urgence
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 12px 0', lineHeight: '1.4' }}>
              La transmission d'un incident critique déclenche instantanément :
            </p>
            <ul style={{ fontSize: '0.85rem', color: '#cbd5e1', paddingLeft: '20px', margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Une alerte flash sur l'écran du **Poste de Commandement (PC)**.</li>
              <li>Une notification push sur le terminal de la **Direction Générale (DG)**.</li>
              <li>Un archivage immédiat et infalsifiable dans la blockchain locale d'audit.</li>
            </ul>
            <div style={{ borderTop: '1px solid #1f2937', paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#ef4444', fontWeight: '600' }}>
              <AlertTriangle size={16} /> Ne pas utiliser pour de simples absences d'agents non critiques.
            </div>
          </div>

          <div style={{ backgroundColor: '#111827', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.05rem', color: 'white', fontWeight: '700' }}>Dernière transmission</h3>
            <div style={{ borderLeft: '2px solid #818cf8', paddingLeft: '12px', fontSize: '0.8rem', color: '#94a3b8' }}>
              <span style={{ display: 'block', color: '#cbd5e1', fontWeight: '600', marginBottom: '2px' }}>Panne Caméra 04 - Entrepôt Vridi</span>
              <span>Envoyé il y a 2h • Statut: Traité par le PC</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
