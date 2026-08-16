import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import ContratsClientsView from './ContratsClientsView';
import { useAuth } from '../AuthContext';
import { ChevronLeft } from 'lucide-react';

export default function ContratsClientsModule({ onClose }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [siteContracts, setSiteContracts] = useState([]);
  const [subsiteContracts, setSubsiteContracts] = useState({});
  const [sites, setSites] = useState([]);
  const [unbilledSites, setUnbilledSites] = useState([]);
  const [configFunctions, setConfigFunctions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        
        const [cData, fData, sData] = await Promise.all([
          apiCall('get_compta_data', { period: currentPeriod }, 'GET'),
          apiCall('get_functions', { scope: 'company' }, 'GET'),
          apiCall('get_sites', { scope: 'company', module: 'FACTURATION' }, 'GET')
        ]);
        
        if (cData.success) {
          setSiteContracts(cData.contracts || []);
          setSubsiteContracts(cData.subsite_contracts || {});
        }
        if (fData.success && fData.functions) {
          setConfigFunctions(fData.functions);
        }
        if (Array.isArray(sData)) {
          setSites(sData.filter(s => s.is_billed === undefined || s.is_billed == 1));
          setUnbilledSites(sData.filter(s => s.is_billed == 0));
        } else if (sData && sData.sites) {
          setSites(sData.sites.filter(s => s.is_billed === undefined || s.is_billed == 1));
          setUnbilledSites(sData.sites.filter(s => s.is_billed == 0));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatMoney = (val) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(val);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#94a3b8' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '3rem', color: '#10b981', marginBottom: '1.5rem' }}></i>
          <p>Chargement des données de facturation...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0b1220', display: 'flex', flexDirection: 'column' }}>
      <div className="top-bar glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
        {onClose && (
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
            <ChevronLeft size={20} /> Retour
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ color: '#10b981', background: '#10b98115', padding: '10px', borderRadius: '10px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          </div>
          <div>
            <h2 style={{ margin: 0, color: 'white', fontSize: '1.25rem' }}>CONTRATS CLIENTS</h2>
            <div style={{ fontSize: '0.85rem', color: 'white' }}>Cliquez sur un site pour configurer ses zones et effectifs contractuels</div>
          </div>
        </div>
        
        {/* Total Facturation mensuelle */}
        <div style={{ marginLeft: 'auto', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ color: '#10b981' }}><i className="fas fa-coins"></i></div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Total Facturation Mensuelle</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
              {formatMoney(
                Object.values(subsiteContracts).flat().reduce((acc, contract) => {
                  return acc + (Number(contract.quantite) || 0) * (Number(contract.montant_unitaire) || 0);
                }, 0)
              )}
            </div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <ContratsClientsView 
            sites={sites}
            unbilledSites={unbilledSites}
            siteContracts={siteContracts}
            subsiteContracts={subsiteContracts}
            configFunctions={configFunctions}
            setSites={setSites}
            setUnbilledSites={setUnbilledSites}
            setSiteContracts={setSiteContracts}
            setSubsiteContracts={setSubsiteContracts}
            formatMoney={formatMoney}
            searchTerm={searchTerm}
        />
      </div>
    </div>
  );
}
