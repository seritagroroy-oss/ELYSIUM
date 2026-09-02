const fs = require('fs');
const filePath = 'frontend/src/components/PayrollView.jsx';
let c = fs.readFileSync(filePath, 'utf8');
const before = c.length;

// ── 1. Remplacer la fonction handleTogglePrimeSite complète ──
const oldFunc = `  const handleTogglePrimeSite = async (agent, exclusionType) => {
    try {
      const pData = typeof agent.profile_data === 'string' ? JSON.parse(agent.profile_data) : (agent.profile_data || {});
      const updatedProfile = { ...pData };
      
      if (exclusionType === 'none') {
          delete updatedProfile.prime_site_excluded;
          delete updatedProfile.prime_site_excluded_period;
      } else if (exclusionType === 'period') {
          updatedProfile.prime_site_excluded = false;
          updatedProfile.prime_site_excluded_period = period;
      } else if (exclusionType === 'permanent') {
          updatedProfile.prime_site_excluded = true;
          delete updatedProfile.prime_site_excluded_period;
      }
      
      const res = await apiCall('update_agent_profile', { agent_id: agent.id, profile_data: updatedProfile, period: period });
      if (res.success) {
        setPrimeExclusionModal(null);

        // Mise à jour directe de l'état local sans recharger toute la page
        const isExcluded = exclusionType !== 'none';
        setSalaries(prev => prev.map(s => {
          if (s.id !== agent.id) return s;
          const originalPrime = s.is_prime_excluded ? 0 : (s.prime_site || 0);
          // Récupérer la vraie valeur de prime depuis l'agent original (avant exclusion)
          const truePrime = s._original_prime_site ?? s.prime_site ?? 0;
          return {
            ...s,
            profile_data: updatedProfile,
            is_prime_excluded: isExcluded,
            prime_site: isExcluded ? 0 : truePrime,
            _original_prime_site: truePrime,
            total: (s.total || 0) + (isExcluded ? -(truePrime) : truePrime),
          };
        }));
      } else {
        alert(res.message || 'Erreur lors de la sauvegarde');
      }
    } catch(e) {
      console.error(e);
      alert('Erreur serveur');
    }
  };`;

const newFunc = `  const handleTogglePrimeSite = async (agent, exclusionType) => {
    setPrimeExclusionLoading(true);
    try {
      const pData = typeof agent.profile_data === 'string' ? JSON.parse(agent.profile_data) : (agent.profile_data || {});
      const updatedProfile = { ...pData };
      
      if (exclusionType === 'none') {
          delete updatedProfile.prime_site_excluded;
          delete updatedProfile.prime_site_excluded_period;
      } else if (exclusionType === 'period') {
          updatedProfile.prime_site_excluded = false;
          updatedProfile.prime_site_excluded_period = period;
      } else if (exclusionType === 'permanent') {
          updatedProfile.prime_site_excluded = true;
          delete updatedProfile.prime_site_excluded_period;
      }
      
      const res = await apiCall('update_agent_profile', { agent_id: agent.id, profile_data: updatedProfile, period: period });
      if (res.success) {
        setPrimeExclusionModal(null);
        setPrimeExclusionLoading(false);

        // Mise à jour directe de l'état local sans recharger toute la page
        const isExcluded = exclusionType !== 'none';
        setSalaries(prev => prev.map(s => {
          if (s.id !== agent.id) return s;
          const truePrime = s._original_prime_site ?? s.prime_site ?? 0;
          return {
            ...s,
            profile_data: updatedProfile,
            is_prime_excluded: isExcluded,
            prime_site: isExcluded ? 0 : truePrime,
            _original_prime_site: truePrime,
            total: (s.total || 0) + (isExcluded ? -(truePrime) : truePrime),
          };
        }));
      } else {
        alert(res.message || 'Erreur lors de la sauvegarde');
        setPrimeExclusionLoading(false);
      }
    } catch(e) {
      console.error(e);
      alert('Erreur serveur');
      setPrimeExclusionLoading(false);
    }
  };`;

if (c.includes(oldFunc)) {
  c = c.replace(oldFunc, newFunc);
  console.log('✅ Fonction remplacée');
} else {
  console.log('❌ Fonction NON trouvée - vérification manuelle requise');
}

// ── 2. Remplacer les boutons dans les 3 modaux ──
const oldBtnBlock = `                <button
                  type="button"
                  onClick={() => handleTogglePrimeSite(primeExclusionModal.agent, 'period')}
                  style={{ padding: '12px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '8px', cursor: primeExclusionLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: primeExclusionLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {primeExclusionLoading ? <span style={{ width: '16px', height: '16px', border: '2px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> : null}
                  Pour ce mois uniquement
                </button>
                <button
                  type="button"
                  onClick={() => handleTogglePrimeSite(primeExclusionModal.agent, 'permanent')}
                  style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', cursor: primeExclusionLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: primeExclusionLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {primeExclusionLoading ? <span style={{ width: '16px', height: '16px', border: '2px solid #ef4444', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> : null}
                  Définitivement (Tous les mois)
                </button>`;

// Compter les occurrences déjà transformées
let alreadyTransformed = (c.match(/primeExclusionLoading \? 'not-allowed'/g) || []).length;
console.log('Occurrences déjà transformées:', alreadyTransformed);

// Remplacer les anciens boutons simples (sans loading)
const simpleBtnBlock = `                <button
                  type="button"
                  onClick={() => handleTogglePrimeSite(primeExclusionModal.agent, 'period')}
                  style={{ padding: '12px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Pour ce mois uniquement
                </button>
                <button
                  type="button"
                  onClick={() => handleTogglePrimeSite(primeExclusionModal.agent, 'permanent')}
                  style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Définitivement (Tous les mois)
                </button>`;

const newBtnBlock = `                <button
                  type="button"
                  disabled={primeExclusionLoading}
                  onClick={() => handleTogglePrimeSite(primeExclusionModal.agent, 'period')}
                  style={{ padding: '12px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '8px', cursor: primeExclusionLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: primeExclusionLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'opacity 0.2s' }}
                >
                  {primeExclusionLoading && <span style={{ width: '14px', height: '14px', border: '2px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />}
                  Pour ce mois uniquement
                </button>
                <button
                  type="button"
                  disabled={primeExclusionLoading}
                  onClick={() => handleTogglePrimeSite(primeExclusionModal.agent, 'permanent')}
                  style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', cursor: primeExclusionLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: primeExclusionLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'opacity 0.2s' }}
                >
                  {primeExclusionLoading && <span style={{ width: '14px', height: '14px', border: '2px solid #ef4444', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />}
                  Définitivement (Tous les mois)
                </button>`;

let count = 0;
while (c.includes(simpleBtnBlock)) {
  c = c.replace(simpleBtnBlock, newBtnBlock);
  count++;
}
// Aussi remplacer les déjà transformés (avec ancienne syntaxe)
while (c.includes(oldBtnBlock)) {
  c = c.replace(oldBtnBlock, newBtnBlock);
  count++;
}
console.log(`✅ Boutons remplacés: ${count} occurrence(s)`);

fs.writeFileSync(filePath, c);
console.log('Taille finale:', c.length, '(avant:', before, ')');
