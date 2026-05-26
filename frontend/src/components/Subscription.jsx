import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { apiCall } from '../api';
import { CreditCard, Check, ShieldAlert, Sparkles, Loader2, DollarSign } from 'lucide-react';

export default function Subscription({ setView }) {
  const { user, subscription, refreshUser, logout } = useAuth();
  const [months, setMonths] = useState(1);
  const [provider, setProvider] = useState('stripe');
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState(''); // 'success' | 'error'

  // Charger les fournisseurs de paiement
  useEffect(() => {
    async function loadProviders() {
      try {
        const res = await apiCall('get_payment_providers', {}, 'GET');
        if (res.success && res.providers) {
          // Filtrer les providers activés
          setProviders(res.providers.filter(p => p.enabled));
          // Définir le premier provider disponible par défaut
          const firstEnabled = res.providers.find(p => p.enabled);
          if (firstEnabled) setProvider(firstEnabled.id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingProviders(false);
      }
    }
    loadProviders();
  }, []);

  // Gérer le retour de paiement (URL params)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const paymentProvider = params.get('provider');
    const sessionId = params.get('session_id');
    const transactionId = params.get('transaction_id');

    if (paymentStatus === 'success') {
      verifyPayment();
    } else if (paymentStatus === 'cancel') {
      setStatusType('error');
      setStatusMessage("Le paiement a été annulé.");
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    async function verifyPayment() {
      setVerifyingPayment(true);
      setStatusType('warning');
      setStatusMessage("Vérification de votre paiement en cours...");
      
      try {
        let res;
        if (paymentProvider === 'stripe' && sessionId) {
          res = await apiCall('confirm_stripe_payment', { session_id: sessionId });
        } else if ((paymentProvider === 'orange_money' || paymentProvider === 'wave') && transactionId) {
          res = await apiCall('confirm_cinetpay_payment', { transaction_id: transactionId });
        }

        if (res && res.success) {
          setStatusType('success');
          setStatusMessage("Votre paiement a été validé ! Votre abonnement est maintenant actif.");
          await refreshUser();
        } else {
          setStatusType('error');
          setStatusMessage(res?.message || "Le paiement n'a pas pu être validé. Veuillez contacter le support.");
        }
      } catch (e) {
        setStatusType('error');
        setStatusMessage("Erreur réseau lors de la validation du paiement.");
      } finally {
        setVerifyingPayment(false);
        // Nettoyer l'URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [refreshUser]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoadingCheckout(true);
    setStatusMessage('');
    
    try {
      const res = await apiCall('create_checkout_session', { provider, months });
      if (res.success && res.checkout_url) {
        // Rediriger vers la passerelle de paiement
        window.location.href = res.checkout_url;
      } else {
        setStatusType('error');
        setStatusMessage(res.message || "Impossible de démarrer la session de paiement.");
        setLoadingCheckout(false);
      }
    } catch (err) {
      setStatusType('error');
      setStatusMessage("Erreur réseau.");
      setLoadingCheckout(false);
    }
  };

  const isAccessAllowed = subscription?.access_allowed;
  const pricePerMonth = subscription?.monthly_price || 20000;
  const currency = subscription?.currency || 'XOF';

  return (
    <div className="container" style={{ maxWidth: '800px', padding: '40px 0' }}>
      <div className="top-bar">
        <div className="brand">
          <ShieldAlert size={28} />
          <span>Pointage Pro</span>
        </div>
        <div>
          {isAccessAllowed && (
            <button className="btn btn-secondary" onClick={() => setView('home')}>
              Aller à l'Accueil
            </button>
          )}
          <button className="btn btn-danger" style={{ marginLeft: '12px' }} onClick={logout}>
            Déconnexion
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(56, 189, 248, 0.15)',
            color: 'var(--b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem'
          }}>
            <Sparkles />
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem' }}>Abonnement Pointage Pro</h2>
            <p className="subtitle">
              {isAccessAllowed 
                ? "Votre abonnement est actif. Merci pour votre confiance !"
                : "Abonnement requis pour accéder à l'ensemble des fonctionnalités."
              }
            </p>
          </div>
        </div>

        {statusMessage && (
          <div className={`alert alert-${statusType}`}>
            {verifyingPayment && <Loader2 className="animate-spin" size={18} />}
            <span>{statusMessage}</span>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '24px'
        }}>
          <div>
            <h4 style={{ color: 'var(--muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statut Actuel</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span className={`badge ${isAccessAllowed ? 'bg-success' : 'bg-danger'}`} style={{
                background: isAccessAllowed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: isAccessAllowed ? 'var(--a)' : 'var(--danger)',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}>
                {isAccessAllowed 
                  ? (subscription.status === 'trial' ? 'Essai Gratuit Actif' : 'Premium Actif')
                  : 'Abonnement Expiré'
                }
              </span>
            </div>
            {isAccessAllowed && (
              <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '8px' }}>
                {subscription.status === 'trial' 
                  ? `Il vous reste ${subscription.trial_days_left} jours d'essai gratuit (fin le ${new Date(subscription.trial_ends_at).toLocaleDateString()}).`
                  : `Votre abonnement est valable jusqu'au ${new Date(subscription.subscription_until).toLocaleDateString()}.`
                }
              </p>
            )}
          </div>
          <div>
            <h4 style={{ color: 'var(--muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Offre Premium</h4>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '6px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--a)' }}>
                {pricePerMonth.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--muted)' }}>
                {currency} / mois
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '8px' }}>
              Accès illimité pour tous vos agents, dashboard, rapports de salaires et archives.
            </p>
          </div>
        </div>
      </div>

      {(!isAccessAllowed || isAccessAllowed) && !verifyingPayment && (
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Activer ou Renouveler</h3>
          <form onSubmit={handleCheckout}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="months">Durée de l'abonnement</label>
                <select
                  id="months"
                  className="form-input"
                  style={{ background: 'rgba(0,0,0,0.3)', width: '100%' }}
                  value={months}
                  onChange={(e) => setMonths(parseInt(e.target.value))}
                  disabled={loadingCheckout}
                >
                  <option value={1}>1 Mois ({pricePerMonth.toLocaleString()} {currency})</option>
                  <option value={3}>3 Mois ({(pricePerMonth * 3).toLocaleString()} {currency})</option>
                  <option value={6}>6 Mois ({(pricePerMonth * 6).toLocaleString()} {currency})</option>
                  <option value={12}>12 Mois ({(pricePerMonth * 12).toLocaleString()} {currency} - 1 an)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="provider">Moyen de paiement</label>
                {loadingProviders ? (
                  <div className="form-input" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Loader2 className="animate-spin" size={16} /> Chargement...
                  </div>
                ) : providers.length === 0 ? (
                  <div className="form-input text-danger" style={{ color: 'var(--danger)' }}>
                    Aucun moyen de paiement activé (.env)
                  </div>
                ) : (
                  <select
                    id="provider"
                    className="form-input"
                    style={{ background: 'rgba(0,0,0,0.3)', width: '100%' }}
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    disabled={loadingCheckout}
                  >
                    {providers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border)',
              paddingTop: '20px',
              marginTop: '10px'
            }}>
              <div>
                <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Total à payer :</span>
                <span style={{ fontSize: '1.4rem', fontWeight: '700', marginLeft: '8px', color: 'var(--text)' }}>
                  {(pricePerMonth * months).toLocaleString()} {currency}
                </span>
              </div>
              <button
                type="submit"
                className="btn btn-success"
                disabled={loadingCheckout || providers.length === 0}
              >
                {loadingCheckout ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Redirection...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    <span>S'abonner maintenant</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
