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
  try { profileData = agent.profile_data ? JSON.parse(agent.profile_data) : {}; } catch (e) { }
  
  const [paymentMethod, setPaymentMethod] = useState(profileData.payment_method || 'MONEY');
  
  // MONEY fields
  const [paymentNumber, setPaymentNumber] = useState(profileData.payment_number || '');
  const [paymentOperator, setPaymentOperator] = useState(profileData.payment_operator || 'Wave');
  const [countryCode, setCountryCode] = useState(profileData.payment_country || detectDefaultCountry());
  
  // BANQUE fields
  const [paymentRib, setPaymentRib] = useState(profileData.payment_rib || '');
  const [paymentBankName, setPaymentBankName] = useState(profileData.payment_bank_name || '');
  const [errorMsg, setErrorMsg] = useState('');

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
    
    const updatedProfile = {
      ...profileData,
      payment_method: paymentMethod,
      payment_number: paymentMethod === 'MONEY' ? paymentNumber : '',
      payment_operator: paymentMethod === 'MONEY' ? paymentOperator : '',
      payment_country: paymentMethod === 'MONEY' ? countryCode : '',
      payment_rib: paymentMethod === 'BANQUE' ? paymentRib : '',
      payment_bank_name: paymentMethod === 'BANQUE' ? paymentBankName : ''
    };
    onSubmit(agent.id, updatedProfile);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
          💳 Moyen de paiement : {agent.name}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--muted)' }}>Type de paiement</label>
            <select
              className="form-input"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
            >
              <option value="MONEY" style={{ color: 'black' }}>MONEY</option>
              <option value="BANQUE" style={{ color: 'black' }}>BANQUE</option>
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
                  <option value="Wave" style={{ color: 'black' }}>Wave</option>
                  <option value="Orange Money" style={{ color: 'black' }}>Orange Money</option>
                  <option value="MTN Money" style={{ color: 'black' }}>MTN Money</option>
                  <option value="Moov Money" style={{ color: 'black' }}>Moov Money</option>
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
                      <option key={c.code} value={c.code} style={{ color: 'black' }}>
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
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: CI000 00000 00000000000 00"
                  value={paymentRib}
                  onChange={(e) => setPaymentRib(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                  required
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Annuler</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}
