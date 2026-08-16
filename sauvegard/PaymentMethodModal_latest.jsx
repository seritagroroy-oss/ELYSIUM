import React, { useState, useEffect } from 'react';

// Configuration des pays et longueurs
const COUNTRIES = [
  { code: 'CI', name: "Côte d'Ivoire", prefix: '+225', length: 10 },
  { code: 'SN', name: "Sénégal", prefix: '+221', length: 9 },
  { code: 'ML', name: "Mali", prefix: '+223', length: 8 },
  { code: 'BF', name: "Burkina Faso", prefix: '+226', length: 8 },
  { code: 'GN', name: "Guinée", prefix: '+224', length: 9 },
  { code: 'TG', name: "Togo", prefix: '+228', length: 8 },
  { code: 'BJ', name: "Bénin", prefix: '+229', length: 8 },
  { code: 'NE', name: "Niger", prefix: '+227', length: 8 },
  { code: 'GW', name: "Guinée-Bissau", prefix: '+245', length: 7 },
  { code: 'MR', name: "Mauritanie", prefix: '+222', length: 8 },
  { code: 'CM', name: "Cameroun", prefix: '+237', length: 9 },
  { code: 'GA', name: "Gabon", prefix: '+241', length: 7 },
  { code: 'CG', name: "Congo", prefix: '+242', length: 9 },
  { code: 'CD', name: "RDC", prefix: '+243', length: 9 },
  { code: 'TD', name: "Tchad", prefix: '+235', length: 8 },
  { code: 'GQ', name: "Guinée équatoriale", prefix: '+240', length: 9 },
  { code: 'CF', name: "RCA", prefix: '+236', length: 8 },
  { code: 'MG', name: "Madagascar", prefix: '+261', length: 9 },
  { code: 'KM', name: "Comores", prefix: '+269', length: 7 },
  { code: 'MU', name: "Maurice", prefix: '+230', length: 8 },
  { code: 'MA', name: "Maroc", prefix: '+212', length: 9 },
  { code: 'DZ', name: "Algérie", prefix: '+213', length: 9 },
  { code: 'TN', name: "Tunisie", prefix: '+216', length: 8 },
  { code: 'ZA', name: "Afrique du Sud", prefix: '+27', length: 9 },
  { code: 'NG', name: "Nigeria", prefix: '+234', length: 10 },
  { code: 'GH', name: "Ghana", prefix: '+233', length: 9 },
  { code: 'FR', name: "France", prefix: '+33', length: 9 },
  { code: 'BE', name: "Belgique", prefix: '+32', length: 9 },
  { code: 'CH', name: "Suisse", prefix: '+41', length: 9 },
  { code: 'CA', name: "Canada", prefix: '+1', length: 10 },
  { code: 'US', name: "USA", prefix: '+1', length: 10 },
  { code: 'OTHER', name: "Autre", prefix: '', length: 0 }
];

// Détecter le pays par défaut selon le fuseau horaire
const detectDefaultCountry = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.includes('Abidjan')) return 'CI';
    if (tz.includes('Dakar')) return 'SN';
    if (tz.includes('Bamako')) return 'ML';
    if (tz.includes('Ouagadougou')) return 'BF';
    if (tz.includes('Conakry')) return 'GN';
  } catch(e) {}
  return 'CI'; // Par défaut Côte d'Ivoire
};

export default function PaymentMethodModal({ agent, allSalaries = [], onClose, onSubmit }) {
  let profileData = {};
  try { 
    profileData = agent.profile_data 
      ? (typeof agent.profile_data === 'object' ? agent.profile_data : JSON.parse(agent.profile_data)) 
      : {}; 
  } catch (e) { }
  
  const [paymentMethod, setPaymentMethod] = useState(profileData.payment_method || 'MONEY');
  
  // MONEY fields
  const [paymentNumber, setPaymentNumber] = useState(profileData.payment_number || '');
  const [paymentOperator, setPaymentOperator] = useState(profileData.payment_operator || 'Wave');
  const [countryCode, setCountryCode] = useState(profileData.payment_country || detectDefaultCountry());
  
  // BANQUE fields
  const initialRib = profileData.payment_rib || '';
  const [ribCode, setRibCode] = useState(initialRib.substring(0, 5));
  const [ribAgc, setRibAgc] = useState(initialRib.substring(5, 10));
  const [ribCompte, setRibCompte] = useState(initialRib.substring(10, 22));
  const [ribCle, setRibCle] = useState(initialRib.substring(22, 24));
  const [paymentBankName, setPaymentBankName] = useState(profileData.payment_bank_name || '');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Read-only toggle
  const [isEditing, setIsEditing] = useState(!profileData.payment_method);

  // S'assurer que le numéro est bien formaté selon le pays
  const handleNumberChange = (e) => {
    // Ne garder que les chiffres
    let val = e.target.value.replace(/\D/g, '');
    const country = COUNTRIES.find(c => c.code === countryCode);
    
    // Limiter la taille si ce n'est pas "Autre"
    if (country && country.length > 0 && val.length > country.length) {
      val = val.slice(0, country.length);
    }
    
    setPaymentNumber(val);
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation intelligente
    if (paymentMethod === 'MONEY') {
      const country = COUNTRIES.find(c => c.code === countryCode);
      if (country && country.length > 0 && paymentNumber.length !== country.length) {
        setErrorMsg(`Le numéro en ${country.name} doit comporter exactement ${country.length} chiffres.`);
        return;
      }

      const duplicateAgent = allSalaries.find(s => {
        if (s.id === agent.id) return false;
        try {
          const prof = typeof s.profile_data === 'string' ? JSON.parse(s.profile_data) : (s.profile_data || {});
          if (prof.payment_method === 'MONEY' && prof.payment_number) {
            return prof.payment_number.replace(/\D/g, '') === paymentNumber;
          }
        } catch(err) {}
        return false;
      });
      
      if (duplicateAgent) {
        if (!window.confirm(`⚠️ ALERTE FRAUDE / DOUBLON ⚠️\n\nCe numéro est DÉJÀ enregistré pour l'agent : ${duplicateAgent.name}.\n\nVoulez-vous vraiment l'attribuer aussi à ${agent.name} ?`)) {
          return;
        }
      }
    }
    
    if (paymentMethod === 'BANQUE') {
      if (!paymentBankName || !ribCode || !ribAgc || !ribCompte || !ribCle) {
        setErrorMsg("Veuillez remplir tous les champs bancaires.");
        return;
      }
      
      // Strip spaces, dashes, but KEEP letters and digits
      const cleanRibCode = ribCode.replace(/[^A-Z0-9]/g, '');
      const cleanRibAgc = ribAgc.replace(/[^A-Z0-9]/g, '');
      const cleanRibCompte = ribCompte.replace(/[^A-Z0-9]/g, '');
      const cleanRibCle = ribCle.replace(/[^A-Z0-9]/g, '');
      
      if (cleanRibCode.length !== 5) {
        setErrorMsg(`Le Code Banque doit contenir exactement 5 caractères (vous en avez saisi ${cleanRibCode.length}).`);
        return;
      }
      if (cleanRibAgc.length !== 5) {
        setErrorMsg(`Le Code Agence (Guichet) doit contenir exactement 5 caractères (vous en avez saisi ${cleanRibAgc.length}).`);
        return;
      }
      if (cleanRibCompte.length !== 12) {
        setErrorMsg(`Le Numéro de Compte doit contenir exactement 12 caractères (vous en avez saisi ${cleanRibCompte.length}).`);
        return;
      }
      if (cleanRibCle.length !== 2) {
        setErrorMsg(`La Clé RIB doit contenir exactement 2 chiffres (vous en avez saisi ${cleanRibCle.length}). Si elle est de 1 chiffre, ajoutez un "0" devant (ex: "05").`);
        return;
      }
      
      const updatedProfile = {
        ...profileData,
        payment_method: paymentMethod,
        payment_number: '',
        payment_operator: '',
        payment_country: '',
        payment_rib: `${cleanRibCode}${cleanRibAgc}${cleanRibCompte}${cleanRibCle}`,
        payment_bank_name: paymentBankName
      };
      onSubmit(agent.id, updatedProfile);
      return;
    }

    const updatedProfile = {
      ...profileData,
      payment_method: paymentMethod,
      payment_number: paymentMethod === 'MONEY' ? paymentNumber : '',
      payment_operator: paymentMethod === 'MONEY' ? paymentOperator : '',
      payment_country: paymentMethod === 'MONEY' ? countryCode : '',
      payment_rib: '',
      payment_bank_name: ''
    };
    onSubmit(agent.id, updatedProfile);
  };

  const formatRib = (rib) => {
    if (!rib || rib.length !== 24) return rib;
    return `${rib.substring(0, 5)} ${rib.substring(5, 10)} ${rib.substring(10, 22)} ${rib.substring(22, 24)}`;
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
          💳 Moyen de paiement : {agent.name}
        </h3>
        {!isEditing ? (
          <div>
            {paymentMethod === 'MONEY' ? (
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                <p style={{ color: 'var(--muted)', margin: '0 0 8px 0', fontSize: '0.9rem' }}>Type de paiement : <strong style={{ color: 'white' }}>MONEY</strong></p>
                <p style={{ color: 'var(--muted)', margin: '0 0 8px 0', fontSize: '0.9rem' }}>Opérateur Mobile : <strong style={{ color: 'white' }}>{paymentOperator}</strong></p>
                <p style={{ color: 'var(--muted)', margin: '0', fontSize: '0.9rem' }}>Numéro de téléphone : <strong style={{ color: 'white', fontSize: '1.1rem' }}>{countryCode && COUNTRIES.find(c => c.code === countryCode)?.prefix} {paymentNumber}</strong></p>
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                <p style={{ color: 'var(--muted)', margin: '0 0 8px 0', fontSize: '0.9rem' }}>Type de paiement : <strong style={{ color: 'white' }}>BANQUE</strong></p>
                <p style={{ color: 'var(--muted)', margin: '0 0 8px 0', fontSize: '0.9rem' }}>Nom de la Banque : <strong style={{ color: 'white' }}>{paymentBankName}</strong></p>
                <p style={{ color: 'var(--muted)', margin: '0', fontSize: '0.9rem' }}>Numéro RIB / Compte : <strong style={{ color: 'white', fontSize: '1.1rem', whiteSpace: 'nowrap' }}>{formatRib(`${ribCode}${ribAgc}${ribCompte}${ribCle}`)}</strong></p>
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Fermer</button>
              <button type="button" className="btn btn-primary" onClick={() => setIsEditing(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>Modifier</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--muted)' }}>Type de paiement</label>
            <select
              className="form-input"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
            >
              <option value="MONEY" style={{ background: '#1e293b', color: 'white' }}>MONEY</option>
              <option value="BANQUE" style={{ background: '#1e293b', color: 'white' }}>BANQUE</option>
            </select>
          </div>

          {paymentMethod === 'MONEY' && (
            <>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label" style={{ color: 'var(--muted)' }}>Opérateur Mobile</label>
                <select
                  className="form-input"
                  value={paymentOperator}
                  onChange={(e) => setPaymentOperator(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                >
                  <option value="Wave" style={{ background: '#1e293b', color: 'white' }}>Wave</option>
                  <option value="Orange Money" style={{ background: '#1e293b', color: 'white' }}>Orange Money</option>
                  <option value="MTN Money" style={{ background: '#1e293b', color: 'white' }}>MTN Money</option>
                  <option value="Moov Money" style={{ background: '#1e293b', color: 'white' }}>Moov Money</option>
                </select>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label" style={{ color: 'var(--muted)' }}>Numéro de téléphone</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select 
                    className="form-input" 
                    value={countryCode} 
                    onChange={(e) => {
                      setCountryCode(e.target.value);
                      setErrorMsg('');
                    }}
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white', width: '35%' }}
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code} style={{ background: '#1e293b', color: 'white' }}>
                        {c.code} {c.prefix}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Ex: 0102030405"
                    value={paymentNumber}
                    onChange={handleNumberChange}
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white', flex: 1 }}
                    required
                  />
                </div>
                {errorMsg && (
                  <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '6px' }}>
                    {errorMsg}
                  </div>
                )}
                <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '6px' }}>
                  {(() => {
                    const c = COUNTRIES.find(x => x.code === countryCode);
                    return c && c.length > 0 ? `Format requis: ${c.length} chiffres` : 'Format libre';
                  })()}
                </div>
              </div>
            </>
          )}

          {paymentMethod === 'BANQUE' && (
            <>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label" style={{ color: 'var(--muted)' }}>Nom de la Banque</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Ecobank, SGCI..."
                  value={paymentBankName}
                  onChange={(e) => setPaymentBankName(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                  required
                />
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label" style={{ color: 'var(--muted)' }}>Numéro RIB / Compte</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="CODE (5)"
                    maxLength="5"
                    value={ribCode}
                    onChange={(e) => setRibCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white', flex: 1, minWidth: 0, padding: '8px', textAlign: 'center' }}
                    required
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="AGC (5)"
                    maxLength="5"
                    value={ribAgc}
                    onChange={(e) => setRibAgc(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white', flex: 1, minWidth: 0, padding: '8px', textAlign: 'center' }}
                    required
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="COMPTE (12)"
                    maxLength="12"
                    value={ribCompte}
                    onChange={(e) => setRibCompte(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white', flex: 2, minWidth: 0, padding: '8px', textAlign: 'center' }}
                    required
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="CLÉ (2)"
                    maxLength="2"
                    value={ribCle}
                    onChange={(e) => setRibCle(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white', width: '60px', minWidth: '60px', padding: '8px', textAlign: 'center' }}
                    required
                  />
                </div>
              </div>
              {errorMsg && (
                <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '16px', background: 'rgba(239,68,68,0.1)', padding: '8px', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.3)' }}>
                  ⚠️ {errorMsg}
                </div>
              )}
            </>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Annuler</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>Enregistrer</button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
