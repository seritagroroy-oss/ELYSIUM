import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown } from 'lucide-react';

const FaqModal = ({ showFaqModal, setShowFaqModal }) => {
  const [faqSearchTerm, setFaqSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  if (!showFaqModal) return null;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowFaqModal(false)}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100vw', maxWidth: '100vw', height: '100vh', maxHeight: '100vh',
        background: 'linear-gradient(135deg, #082f49 0%, #0f172a 100%)',
        border: 'none',
        boxShadow: 'none',
        borderRadius: '0', padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto'
      }}>
        <div style={{ position: 'sticky', top: '-40px', zIndex: 10, background: '#091b35', margin: '-40px -40px 0 -40px', padding: '40px 40px 16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(14,165,233,0.2)', flexWrap: 'wrap', gap: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <h3 style={{ margin: 0, color: 'white', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.8rem' }}>📘</span> Foire aux questions (FAQ)
          </h3>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: '200px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
              <Search size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Rechercher dans la FAQ..." 
                value={faqSearchTerm}
                onChange={(e) => setFaqSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(14,165,233,0.3)', color: 'white', outline: 'none' }}
              />
            </div>
          </div>
          <button onClick={() => setShowFaqModal(false)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', transition: 'all 0.2s' }}>Fermer</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Accordion Item - Calendar Days */}
          {(!faqSearchTerm || "Pourquoi le mois de juin (ou un autre) affiche 31 ou 30 jours dans la grille ?".toLowerCase().includes(faqSearchTerm.toLowerCase())) && (
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '14px', overflow: 'hidden' }}>
            <div
              onClick={() => setExpandedFaq(expandedFaq === 'calendar' ? null : 'calendar')}
              style={{ padding: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedFaq === 'calendar' ? 'rgba(14,165,233,0.15)' : 'transparent', transition: 'all 0.2s' }}
            >
              <h4 style={{ color: expandedFaq === 'calendar' ? '#38bdf8' : 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '1.5rem', filter: expandedFaq === 'calendar' ? 'drop-shadow(0 0 8px rgba(192,132,252,0.6))' : 'none' }}>📅</span> Pourquoi un cycle affiche parfois 31 ou 30 jours, même si le mois en compte moins ?
              </h4>
              <ChevronDown size={26} color={expandedFaq === 'calendar' ? '#38bdf8' : 'rgba(255,255,255,0.4)'} style={{ transform: expandedFaq === 'calendar' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>

            {expandedFaq === 'calendar' && (
              <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid rgba(14,165,233,0.1)', marginTop: '4px' }}>
                <div style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '18px' }}>
                  <p style={{ margin: 0 }}>C'est tout à fait normal et lié au principe du "cycle à cheval" sur deux mois calendaires.</p>
                  <div style={{ background: 'rgba(14,165,233,0.1)', borderLeft: '4px solid #38bdf8', padding: '16px 20px', borderRadius: '6px' }}>
                    <strong>Principe (Cycle du 21 au 20) :</strong> Le nombre de jours total affiché sur la grille de pointage dépend <strong>exclusivement</strong> du nombre de jours du mois qui démarre le cycle (le mois précédent).
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '14px', fontSize: '1.15rem' }}>Exemple avec la Paie de Juin :</strong>
                    <p style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Le cycle va du <strong>21 Mai</strong> au <strong>20 Juin</strong>.</p>
                    <ul style={{ margin: 0, paddingLeft: '26px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <li><strong>Mois de Mai :</strong> du 21 au 31 mai (soit <span style={{ color: '#38bdf8' }}>11 jours</span>).</li>
                      <li><strong>Mois de Juin :</strong> du 1er au 20 juin (soit <span style={{ color: '#34d399' }}>20 jours</span>).</li>
                      <li>Total généré = <strong>31 jours</strong> dans la grille (car le mois de Mai compte 31 jours).</li>
                    </ul>
                    
                    <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '10px', fontSize: '1.15rem' }}>Exemple avec la Paie de Juillet :</strong>
                      <p style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Le cycle va du <strong>21 Juin</strong> au <strong>20 Juillet</strong>.</p>
                      <ul style={{ margin: 0, paddingLeft: '26px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <li><strong>Mois de Juin :</strong> du 21 au 30 juin (soit <span style={{ color: '#38bdf8' }}>10 jours</span>).</li>
                        <li><strong>Mois de Juillet :</strong> du 1er au 20 juillet (soit <span style={{ color: '#34d399' }}>20 jours</span>).</li>
                        <li>Total généré = <strong>30 jours</strong> dans la grille (car le mois de Juin compte 30 jours).</li>
                      </ul>
                    </div>
                  </div>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#38bdf8' }}>ℹ️</span> En résumé, la grille aura une largeur de 28, 29, 30 ou 31 colonnes selon la durée du mois de départ !
                  </p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Accordion Item 1 */}
          {(!faqSearchTerm || "Comment est calculé le bonus pour les jours en Costume (COST) ?".toLowerCase().includes(faqSearchTerm.toLowerCase())) && (
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '14px', overflow: 'hidden' }}>
            <div
              onClick={() => setExpandedFaq(expandedFaq === 'costume' ? null : 'costume')}
              style={{ padding: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedFaq === 'costume' ? 'rgba(14,165,233,0.15)' : 'transparent', transition: 'all 0.2s' }}
            >
              <h4 style={{ color: expandedFaq === 'costume' ? '#38bdf8' : 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '1.5rem', filter: expandedFaq === 'costume' ? 'drop-shadow(0 0 8px rgba(192,132,252,0.6))' : 'none' }}>👔</span> Comment est calculé le bonus pour les jours en Costume (COST) ?
              </h4>
              <ChevronDown size={26} color={expandedFaq === 'costume' ? '#38bdf8' : 'rgba(255,255,255,0.4)'} style={{ transform: expandedFaq === 'costume' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>

            {expandedFaq === 'costume' && (
              <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid rgba(14,165,233,0.1)', marginTop: '4px' }}>
                <div style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '18px' }}>
                  <p style={{ margin: 0 }}>Lorsqu'un agent effectue des jours en "Costume", il perçoit un bonus qui correspond à la différence entre le tarif du Costume et son tarif habituel, ajoutée à son salaire de base normal.</p>
                  <div style={{ background: 'rgba(14,165,233,0.1)', borderLeft: '4px solid #38bdf8', padding: '16px 20px', borderRadius: '6px' }}>
                    <strong>Principe (Règle Différentielle) :</strong> Le bonus correspond à la différence entre le salaire de la fonction Costume et le salaire habituel de l'agent pour chaque jour effectué. Le jour spécial n'est pas déduit de la base de 30 jours.
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '14px', fontSize: '1.15rem' }}>Exemple de calcul concret :</strong>
                    <ul style={{ margin: 0, paddingLeft: '26px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <li>Salaire Tenue (habituel) = <span style={{ color: '#fb7185' }}>75 000 CFA</span> <em style={{ opacity: 0.6 }}>(soit 2 500 CFA / jour)</em></li>
                      <li>Salaire Costume = <span style={{ color: '#34d399' }}>90 000 CFA</span> <em style={{ opacity: 0.6 }}>(soit 3 000 CFA / jour)</em></li>
                      <li>Différence générée = <span style={{ color: '#38bdf8' }}>+500 CFA / jour</span></li>
                    </ul>
                    <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '1.15rem' }}>
                      Si l'agent fait <strong>5 jours</strong> en Costume sur le mois :<br />
                      <ul style={{ margin: '10px 0 0 0', paddingLeft: '26px', fontSize: '1rem' }}>
                        <li>Salaire de base (30j pleins) = <strong>75 000 CFA</strong></li>
                        <li>Bonus généré (5j Costume × 500 CFA) = <strong style={{ color: '#38bdf8' }}>+2 500 CFA</strong></li>
                        <li>Total brut calculé = <strong>77 500 CFA</strong></li>
                      </ul>
                    </div>
                  </div>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#38bdf8' }}>ℹ️</span> Ce montant s'ajoute automatiquement au <strong>Salaire net (Aperçu)</strong> dans la section "Bonus et Supp.".
                  </p>
                </div>
              </div>
            )}
          </div>
          )}

          {(!faqSearchTerm || "Comment est calculé le prorata pour les autres fonctions (GA, CP, MC, etc.) ?".toLowerCase().includes(faqSearchTerm.toLowerCase())) && (
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '14px', overflow: 'hidden' }}>
            <div
              onClick={() => setExpandedFaq(expandedFaq === 'prorata' ? null : 'prorata')}
              style={{ padding: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedFaq === 'prorata' ? 'rgba(14,165,233,0.15)' : 'transparent', transition: 'all 0.2s' }}
            >
              <h4 style={{ color: expandedFaq === 'prorata' ? '#38bdf8' : 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '1.5rem', filter: expandedFaq === 'prorata' ? 'drop-shadow(0 0 8px rgba(192,132,252,0.6))' : 'none' }}>🛡️</span> Comment est calculé le prorata pour les autres fonctions (GA, CP, MC, etc.) ?
              </h4>
              <ChevronDown size={26} color={expandedFaq === 'prorata' ? '#38bdf8' : 'rgba(255,255,255,0.4)'} style={{ transform: expandedFaq === 'prorata' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>

            {expandedFaq === 'prorata' && (
              <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid rgba(14,165,233,0.1)', marginTop: '4px' }}>
                <div style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '18px' }}>
                  <p style={{ margin: 0 }}>La logique est exactement la même que pour le Costume, et s'applique automatiquement à <strong>toutes les fonctions et postes existants ou que vous créerez plus tard</strong>.</p>
                  <div style={{ background: 'rgba(14,165,233,0.1)', borderLeft: '4px solid #38bdf8', padding: '16px 20px', borderRadius: '6px' }}>
                    <strong>Principe :</strong> Le bonus affiché correspond à la différence entre le salaire de la fonction assignée (si supérieur) et le salaire habituel de l'agent. La base reste pleine (30 jours).
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '14px', fontSize: '1.15rem' }}>Exemple (Agent AS qui effectue des jours en tant que CP) :</strong>
                    <ul style={{ margin: 0, paddingLeft: '26px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <li>Salaire de base de l'agent (AS) = <span style={{ color: '#fb7185' }}>75 000 CFA</span> <em style={{ opacity: 0.6 }}>(soit 2 500 CFA / jour)</em></li>
                      <li>Salaire de la fonction (CP) = <span style={{ color: '#34d399' }}>90 000 CFA</span> <em style={{ opacity: 0.6 }}>(soit 3 000 CFA / jour)</em></li>
                      <li>Différence générée = <span style={{ color: '#38bdf8' }}>+500 CFA / jour</span></li>
                    </ul>
                    <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '1.15rem' }}>
                      Si l'agent fait <strong>3 jours</strong> en tant que CP sur le mois :<br />
                      <ul style={{ margin: '10px 0 0 0', paddingLeft: '26px', fontSize: '1rem' }}>
                        <li>Salaire de base (30j pleins) = <strong>75 000 CFA</strong></li>
                        <li>Bonus final généré (3j CP × 500 CFA) = <strong style={{ color: '#38bdf8', fontSize: '1.4rem' }}>+1 500 CFA</strong></li>
                      </ul>
                    </div>
                  </div>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#38bdf8' }}>ℹ️</span> Note : Si la fonction assignée a le <strong>même salaire</strong> que la fonction de base de l'agent (ex: AS en GA = 75 000), le bonus généré sera logiquement de +0 CFA.
                  </p>
                </div>
              </div>
            )}
          </div>
          )}

          {(!faqSearchTerm || "Quels sont les raccourcis clavier pour le pointage ?".toLowerCase().includes(faqSearchTerm.toLowerCase())) && (
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '14px', overflow: 'hidden' }}>
            <div
              onClick={() => setExpandedFaq(expandedFaq === 'shortcuts' ? null : 'shortcuts')}
              style={{ padding: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedFaq === 'shortcuts' ? 'rgba(14,165,233,0.15)' : 'transparent', transition: 'all 0.2s' }}
            >
              <h4 style={{ color: expandedFaq === 'shortcuts' ? '#38bdf8' : 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '1.5rem', filter: expandedFaq === 'shortcuts' ? 'drop-shadow(0 0 8px rgba(192,132,252,0.6))' : 'none' }}>⌨️</span> Quels sont les raccourcis clavier pour le pointage ?
              </h4>
              <ChevronDown size={26} color={expandedFaq === 'shortcuts' ? '#38bdf8' : 'rgba(255,255,255,0.4)'} style={{ transform: expandedFaq === 'shortcuts' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>

            {expandedFaq === 'shortcuts' && (
              <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid rgba(14,165,233,0.1)', marginTop: '4px' }}>
                <div style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '18px' }}>
                  <p style={{ margin: 0 }}>Vous pouvez utiliser votre clavier pour corriger plus rapidement vos erreurs de saisie :</p>

                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <ul style={{ margin: 0, paddingLeft: '26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <li>
                        <strong style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>CTRL + Z</strong>
                        <span style={{ marginLeft: '12px' }}><strong>Annuler</strong> la dernière modification de présence. Si vous cliquez sur une case par erreur, ce raccourci la remet dans son état précédent.</span>
                      </li>
                      <li>
                        <strong style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>CTRL + Y</strong> <em style={{ opacity: 0.6, fontSize: '0.9rem' }}>(ou CTRL + MAJ + Z)</em>
                        <span style={{ marginLeft: '12px' }}><strong>Rétablir</strong> une modification que vous venez d'annuler.</span>
                      </li>
                      <li>
                        <strong style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>CTRL + F</strong>
                        <span style={{ marginLeft: '12px' }}>Place directement le curseur dans la barre de <strong>recherche d'un agent</strong>.</span>
                      </li>
                      <li>
                        <strong style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>Flèches (Haut, Bas, Gauche, Droite)</strong>
                        <span style={{ marginLeft: '12px' }}>Permet de se déplacer rapidement de cellule en cellule au clavier.</span>
                      </li>
                      <li>
                        <strong style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>Touche Entrée</strong>
                        <span style={{ marginLeft: '12px' }}>Ouvre la fenêtre de modification ou valide le pointage sur la cellule sélectionnée.</span>
                      </li>
                      <li>
                        <strong style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>Touche Suppr / Backspace</strong>
                        <span style={{ marginLeft: '12px' }}>Efface instantanément le pointage de la cellule sélectionnée.</span>
                      </li>
                    </ul>
                  </div>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#38bdf8' }}>ℹ️</span> <em>Note : L'historique des annulations est propre à votre session sur la page. Si vous quittez ou actualisez la page, l'historique repart à zéro.</em>
                  </p>
                </div>
              </div>
            )}
          </div>
          )}

          {(!faqSearchTerm || "Comment déclarer des Heures Supplémentaires (SP) de Jour ou de Nuit ?".toLowerCase().includes(faqSearchTerm.toLowerCase())) && (
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '14px', overflow: 'hidden' }}>
            <div
              onClick={() => setExpandedFaq(expandedFaq === 'sp_button' ? null : 'sp_button')}
              style={{ padding: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedFaq === 'sp_button' ? 'rgba(14,165,233,0.15)' : 'transparent', transition: 'all 0.2s' }}
            >
              <h4 style={{ color: expandedFaq === 'sp_button' ? '#38bdf8' : 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '1.5rem', filter: expandedFaq === 'sp_button' ? 'drop-shadow(0 0 8px rgba(192,132,252,0.6))' : 'none' }}>⏱️</span> Comment déclarer des Heures Supplémentaires (SP) de Jour ou de Nuit ?
              </h4>
              <ChevronDown size={26} color={expandedFaq === 'sp_button' ? '#38bdf8' : 'rgba(255,255,255,0.4)'} style={{ transform: expandedFaq === 'sp_button' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>

            {expandedFaq === 'sp_button' && (
              <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid rgba(14,165,233,0.1)', marginTop: '4px' }}>
                <div style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '18px' }}>
                  <p style={{ margin: 0 }}>Pour ajouter des heures supplémentaires à un agent, utilisez le bouton bleu <strong>SP</strong> situé à côté de son nom.</p>

                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <ul style={{ margin: 0, paddingLeft: '26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <li>
                        <strong style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>Clic Gauche (Standard)</strong>
                        <span style={{ marginLeft: '12px' }}>Affiche une seule ligne générique <strong>S</strong>. Idéal si la distinction Jour/Nuit n'est pas nécessaire.</span>
                      </li>
                      <li>
                        <strong style={{ color: '#f8fafc', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px' }}>Clic Droit (Détaillé)</strong>
                        <span style={{ marginLeft: '12px' }}>Affiche deux lignes distinctes : <strong>SP-J</strong> (Jour) et <strong>SP-N</strong> (Nuit). Indispensable si un agent de Jour effectue un remplacement de Nuit, ou pour les agents en rotation (24h/48h).</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {(!faqSearchTerm || "Que se passe-t-il si je clique sur le nom d'un agent ?".toLowerCase().includes(faqSearchTerm.toLowerCase())) && (
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '14px', overflow: 'hidden' }}>
            <div
              onClick={() => setExpandedFaq(expandedFaq === 'agent_click' ? null : 'agent_click')}
              style={{ padding: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedFaq === 'agent_click' ? 'rgba(16,185,129,0.15)' : 'transparent', transition: 'all 0.2s' }}
            >
              <h4 style={{ color: expandedFaq === 'agent_click' ? '#10b981' : 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '1.5rem', filter: expandedFaq === 'agent_click' ? 'drop-shadow(0 0 8px rgba(16,185,129,0.6))' : 'none' }}>🖱️</span> Que se passe-t-il si je clique sur le nom d'un agent ?
              </h4>
              <ChevronDown size={26} color={expandedFaq === 'agent_click' ? '#10b981' : 'rgba(255,255,255,0.4)'} style={{ transform: expandedFaq === 'agent_click' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>

            {expandedFaq === 'agent_click' && (
              <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid rgba(16,185,129,0.1)', marginTop: '4px' }}>
                <div style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '18px' }}>
                  <p style={{ margin: 0 }}>Deux actions différentes sont possibles directement depuis la <strong>colonne des noms</strong> :</p>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <ul style={{ margin: 0, paddingLeft: '26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <li>
                        <strong style={{ color: '#10b981' }}>Clic Gauche (Aperçu KPI) :</strong> Ouvre un bandeau de statistiques en bas de l'écran affichant l'<strong>Aperçu Salarial</strong> de l'agent. Vous y verrez son salaire de base, le compte de ses vacations et absences, ainsi que l'estimation de son <strong>Salaire Net</strong>.
                      </li>
                      <li>
                        <strong style={{ color: '#10b981' }}>Clic Droit (Menu Contextuel) :</strong> Ouvre un menu flottant contenant des options de gestion spécifiques à l'agent : <em>Muter cet agent, Changer de vacation, Avertissement, Modifier le nom, ou Consulter le profil complet.</em>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {(!faqSearchTerm || "Comment changer un agent de zone ?".toLowerCase().includes(faqSearchTerm.toLowerCase())) && (
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '14px', overflow: 'hidden' }}>
            <div
              onClick={() => setExpandedFaq(expandedFaq === 'move_zone' ? null : 'move_zone')}
              style={{ padding: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedFaq === 'move_zone' ? 'rgba(14,165,233,0.15)' : 'transparent', transition: 'all 0.2s' }}
            >
              <h4 style={{ color: expandedFaq === 'move_zone' ? '#0ea5e9' : 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '1.5rem', filter: expandedFaq === 'move_zone' ? 'drop-shadow(0 0 8px rgba(14,165,233,0.6))' : 'none' }}>🔄</span> Comment changer un agent de zone ?
              </h4>
              <ChevronDown size={26} color={expandedFaq === 'move_zone' ? '#0ea5e9' : 'rgba(255,255,255,0.4)'} style={{ transform: expandedFaq === 'move_zone' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>

            {expandedFaq === 'move_zone' && (
              <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid rgba(14,165,233,0.1)', marginTop: '4px' }}>
                <div style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '18px' }}>
                  <p style={{ margin: 0 }}>Il existe <strong>trois manières</strong> de changer un agent de zone ou de sous-site :</p>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <ul style={{ margin: 0, paddingLeft: '26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <li>
                        <strong style={{ color: '#0ea5e9' }}>Par Glisser-Déposer (Nouveau !) :</strong> Maintenez le clic sur la poignée <strong>⋮⋮</strong> à gauche du nom de l'agent, puis <strong>glissez-le</strong> vers le bloc de la zone de votre choix.
                      </li>
                      <li>
                        <strong style={{ color: '#0ea5e9' }}>Depuis le menu contextuel :</strong> Faites un <strong>Clic Droit</strong> sur la ligne de l'agent concerné, puis sélectionnez l'option <em>"Changer la zone 🔄"</em> dans le menu flottant.
                      </li>
                      <li>
                        <strong style={{ color: '#0ea5e9' }}>Depuis l'en-tête de la zone :</strong> Cliquez sur la petite icône avec les doubles flèches (⇄) située complètement à droite du nom de la zone.
                      </li>
                    </ul>
                  </div>
                  <p style={{ margin: 0, padding: '12px', background: 'rgba(14,165,233,0.1)', borderLeft: '4px solid #0ea5e9', borderRadius: '0 8px 8px 0' }}>
                    <strong>💡 Astuce :</strong> Si la zone de destination n'existe pas encore, vous pouvez la créer directement depuis la fenêtre de transfert en cliquant sur le bouton <strong>"+ Créer une zone"</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
          )}

          {(!faqSearchTerm || "Comment est calculé le montant perçu pour un Supplémentaire Externe ?".toLowerCase().includes(faqSearchTerm.toLowerCase())) && (
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
            <div
              onClick={() => setExpandedFaq(expandedFaq === 'supp_ext_calc' ? null : 'supp_ext_calc')}
              style={{ padding: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedFaq === 'supp_ext_calc' ? 'rgba(234,179,8,0.15)' : 'transparent', transition: 'all 0.2s' }}
            >
              <h4 style={{ color: expandedFaq === 'supp_ext_calc' ? '#eab308' : 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '1.5rem', filter: expandedFaq === 'supp_ext_calc' ? 'drop-shadow(0 0 8px rgba(234,179,8,0.6))' : 'none' }}>💰</span> Comment est calculé le montant perçu pour un Supplémentaire Externe ?
              </h4>
              <ChevronDown size={26} color={expandedFaq === 'supp_ext_calc' ? '#eab308' : 'rgba(255,255,255,0.4)'} style={{ transform: expandedFaq === 'supp_ext_calc' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>

            {expandedFaq === 'supp_ext_calc' && (
              <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '4px' }}>
                <div style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '18px' }}>
                  <p style={{ margin: 0 }}>
                    Lorsqu'un agent effectue un supplémentaire externe, le montant généré pour cette vacation s'affiche dans les <strong>Détails du Supplémentaire</strong>.
                    Le calcul suit <strong style={{ color: '#eab308' }}>3 règles mathématiques strictes</strong> en fonction du remplacement :
                  </p>
                  
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <ul style={{ margin: 0, paddingLeft: '26px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <li>
                        <strong style={{ color: '#eab308', fontSize: '1.15rem' }}>Scénario A : Je remplace quelqu'un qui gagne PLUS que moi</strong><br/>
                        <span style={{ color: '#94a3b8' }}>La règle est simple : on vous donne uniquement l'écart (le bonus) entre son salaire et le vôtre.</span>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '14px', borderRadius: '8px', marginTop: '10px', fontSize: '1rem', borderLeft: '3px solid #eab308' }}>
                          <em><strong>Exemple concret :</strong> Mon salaire est de 2 500 CFA/jour. Je vais remplacer un chef (RAF) qui gagne 10 000 CFA/jour.<br/>
                          ➡️ Le système calcule la différence : 10 000 - 2 500.<br/>
                          <strong>Montant affiché : 7 500 CFA.</strong></em>
                        </div>
                      </li>
                      <li>
                        <strong style={{ color: '#eab308', fontSize: '1.15rem' }}>Scénario B : Je remplace quelqu'un qui gagne MOINS que moi</strong><br/>
                        <span style={{ color: '#94a3b8' }}>Dans ce cas, vous vous adaptez au poste : vous êtes payé exactement au tarif de la personne que vous remplacez.</span>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '14px', borderRadius: '8px', marginTop: '10px', fontSize: '1rem', borderLeft: '3px solid #eab308' }}>
                          <em><strong>Exemple concret :</strong> Je suis un chef (RAF) à 10 000 CFA/jour. Exceptionnellement, je viens remplacer un agent de sécurité classique à 2 500 CFA/jour.<br/>
                          <strong>Montant affiché : 2 500 CFA.</strong></em>
                        </div>
                      </li>
                      <li>
                        <strong style={{ color: '#eab308', fontSize: '1.15rem' }}>Scénario C : Je fais un supplémentaire SANS remplacer personne</strong><br/>
                        <span style={{ color: '#94a3b8' }}>C'est un renfort simple. Il n'y a pas de calcul compliqué : vous êtes payé sur la base de votre propre salaire.</span>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '14px', borderRadius: '8px', marginTop: '10px', fontSize: '1rem', borderLeft: '3px solid #eab308' }}>
                          <em><strong>Exemple concret :</strong> Je suis un agent à 2 500 CFA/jour. Je viens juste donner un coup de main (aucun agent remplacé).<br/>
                          <strong>Montant affiché : 2 500 CFA.</strong></em>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <p style={{ margin: 0, padding: '12px', background: 'rgba(234,179,8,0.1)', borderLeft: '4px solid #eab308', borderRadius: '0 8px 8px 0' }}>
                    <strong>💡 Note :</strong> Ce montant est calculé sur la base d'une vacation de 12H (soit Salaire de Base / 30). Il est ensuite multiplié automatiquement si la vacation est de 24H (x2), 48H (x4) ou 72H (x6).
                  </p>
                </div>
              </div>
            )}
          </div>
          )}

          {(!faqSearchTerm || "Comment utiliser les Fonctionnalités Premium (Mode Zen, Pinceau, Copier/Coller) ?".toLowerCase().includes(faqSearchTerm.toLowerCase())) && (
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '14px', overflow: 'hidden' }}>
            <div
              onClick={() => setExpandedFaq(expandedFaq === 'premium' ? null : 'premium')}
              style={{ padding: '24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedFaq === 'premium' ? 'rgba(56,189,248,0.15)' : 'transparent', transition: 'all 0.2s' }}
            >
              <h4 style={{ color: expandedFaq === 'premium' ? '#38bdf8' : 'white', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '1.5rem', filter: expandedFaq === 'premium' ? 'drop-shadow(0 0 8px rgba(56,189,248,0.6))' : 'none' }}>🚀</span> Comment utiliser les Fonctionnalités Premium (Mode Zen, Pinceau, Copier/Coller) ?
              </h4>
              <ChevronDown size={26} color={expandedFaq === 'premium' ? '#38bdf8' : 'rgba(255,255,255,0.4)'} style={{ transform: expandedFaq === 'premium' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>

            {expandedFaq === 'premium' && (
              <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid rgba(56,189,248,0.1)', marginTop: '4px' }}>
                <div style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '18px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <ul style={{ margin: 0, paddingLeft: '26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <li>
                        <strong style={{ color: '#38bdf8' }}>Mode Zen 👁️ / 🔍</strong> : En bas à droite de l'écran, cliquez sur l'icône de l'œil pour masquer l'interface supérieure et passer en plein écran.
                      </li>
                      <li>
                        <strong style={{ color: '#38bdf8' }}>Mode Pinceau 🖌️</strong> : En bas au centre, activez cette case pour saisir très rapidement des pointages. Choisissez le statut (Présent, Absent, etc.), puis cliquez et glissez sur les cellules sans relâcher la souris.
                      </li>
                      <li>
                        <strong style={{ color: '#38bdf8' }}>Menu Contextuel 🖱️</strong> : Un clic-droit sur n'importe quelle cellule du tableau ouvre un menu rapide sous votre curseur (pour muter l'agent, changer de vacation, etc.).
                      </li>
                      <li>
                        <strong style={{ color: '#38bdf8' }}>Copier / Coller de semaine 📋</strong> : Dans le menu du clic-droit, vous pouvez "Copier la semaine" d'un agent puis "Coller la semaine" sur un autre agent pour dupliquer tout le mois instantanément !
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
};

export default FaqModal;
