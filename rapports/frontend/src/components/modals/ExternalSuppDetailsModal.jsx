import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { apiCall } from '../../api';

export default function ExternalSuppDetailsModal({
  data, // { agent_id, date }
  onClose,
  agents = []
}) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (data && data.agent_id && data.date) {
      apiCall('get_external_supp_details', {
        agent_id: data.agent_id,
        date: data.date
      })
      .then(res => {
        if (res.success && res.data) {
          setDetails(res.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [data]);

  const safeAgents = Array.isArray(agents) ? agents : [];
  const mainAgent = safeAgents.find(ag => String(ag.id) === String(data.agent_id));
  const mainFunc = mainAgent?.function || mainAgent?.poste || mainAgent?.fonction;
  const agentName = mainAgent ? `${mainAgent.name}${mainFunc ? ' (' + mainFunc + ')' : ''}` : 'Agent';
  
  let replacedAgentName = 'Aucun';
  const remplaceVal = details?.agent_remplace || details?.replaced_agent_name;
  
  if (remplaceVal) {
    let rAgent = safeAgents.find(ag => String(ag.id) === String(remplaceVal));
    if (!rAgent) {
      rAgent = safeAgents.find(ag => ag.name.trim().toLowerCase() === String(remplaceVal).trim().toLowerCase());
    }
    
    if (rAgent) {
      const rFunc = rAgent.function || rAgent.poste || rAgent.fonction || details?.replaced_agent_poste;
      replacedAgentName = `${rAgent.name}${rFunc ? ' (' + rFunc + ')' : ''}`;
    } else {
      // Backend fallback
      const backName = details?.replaced_agent_name || remplaceVal;
      const backPoste = details?.replaced_agent_poste;
      replacedAgentName = `${backName}${backPoste ? ' (' + backPoste + ')' : ''}`;
    }
  }

  const getDisplayDate = () => {
    if (!details?.date_supp) return '';
    const startDate = new Date(details.date_supp);
    let endDate = null;

    if (details.vacation?.toUpperCase() === '48H') {
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);
    } else if (details.vacation?.toUpperCase() === '72H') {
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 2);
    }

    if (endDate) {
      return `${startDate.toLocaleDateString('fr-FR')} au ${endDate.toLocaleDateString('fr-FR')}`;
    }
    return startDate.toLocaleDateString('fr-FR');
  };

  const handleDelete = () => {
    setIsDeleting(true);
    apiCall('delete_external_supp', {
      agent_id: data.agent_id,
      date: data.date,
      period: window.pontage_period || localStorage.getItem('pontage_period')
    })
    .then(res => {
      if (res.success) {
        onClose(true);
      } else {
        alert('Erreur: ' + (res.message || 'Impossible de supprimer.'));
        setIsDeleting(false);
        setShowConfirmDelete(false);
      }
    })
    .catch(err => {
      console.error(err);
      alert('Erreur de connexion');
      setIsDeleting(false);
      setShowConfirmDelete(false);
    });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(5px)' }}>
      <div className="modal-content" style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #0f172a 100%)', padding: '32px', borderRadius: '16px', width: '400px', border: '1px solid rgba(139, 92, 246, 0.3)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', position: 'relative', overflow: 'hidden' }}>
        
        {/* Custom Confirmation Overlay */}
        {showConfirmDelete && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.95)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', fontSize: '24px', marginBottom: '16px' }}>
              ⚠️
            </div>
            <h3 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '12px', marginTop: 0 }}>Confirmation</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Voulez-vous vraiment supprimer ce supplémentaire ?<br />
              Cette action retirera le pointage sur le site actuel et sur le site de destination.
            </p>
            <div style={{ display: 'flex', gap: '16px', width: '100%', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowConfirmDelete(false)}
                disabled={isDeleting}
                className="btn"
                style={{ padding: '8px 24px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontWeight: '500', cursor: isDeleting ? 'not-allowed' : 'pointer', transition: 'all 0.2s', flex: 1 }}
                onMouseOver={e => !isDeleting && (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                onMouseOut={e => !isDeleting && (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              >
                Annuler
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn"
                style={{ padding: '8px 24px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', fontWeight: '500', cursor: isDeleting ? 'not-allowed' : 'pointer', transition: 'all 0.2s', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                onMouseOver={e => !isDeleting && (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)')}
                onMouseOut={e => !isDeleting && (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)')}
              >
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : 'Oui, supprimer'}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', fontSize: '20px' }}>
            ℹ️
          </div>
          <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem' }}>Détails du Supplémentaire</h3>
        </div>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <div className="loader-pulsar"><div className="loader-pulsar-inner"></div></div>
          </div>
        ) : details ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'white' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Agent</div>
              <div style={{ fontWeight: '500', fontSize: '1.05rem' }}>{agentName}</div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Site de Destination</div>
                <div style={{ fontWeight: '500', fontSize: '1.05rem', color: '#60a5fa' }}>{details.destination_name || 'Inconnu'}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Agent Remplacé</div>
                <div style={{ fontWeight: '500', fontSize: '1.05rem', color: '#fca5a5' }}>{replacedAgentName}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Date</div>
                <div style={{ fontWeight: '500', fontSize: details.vacation?.toUpperCase() === '48H' || details.vacation?.toUpperCase() === '72H' ? '0.9rem' : '1.05rem' }}>{getDisplayDate()}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Vacation</div>
                <div style={{ fontWeight: '500' }}>{details.vacation}</div>
              </div>
            </div>

            {details.montant_a_percevoir !== undefined && details.montant_a_percevoir > 0 && (
              <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.95rem', color: '#86efac', fontWeight: '500' }}>Montant à percevoir</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#4ade80' }}>
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(details.montant_a_percevoir)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '20px' }}>
            Aucun détail trouvé.
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
          <button 
            onClick={() => setShowConfirmDelete(true)}
            className="btn"
            style={{ padding: '8px 24px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
          >
            Supprimer
          </button>
          <button 
            onClick={() => onClose(false)}
            className="btn"
            style={{ padding: '8px 24px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
