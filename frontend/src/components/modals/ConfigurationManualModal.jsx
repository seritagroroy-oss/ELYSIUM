import React from 'react';
import { X, BookOpen, ShieldAlert, FileText, Settings, HelpCircle, CheckCircle, Clock, Printer } from 'lucide-react';
import DOMPurify from 'dompurify';

const ConfigurationManualModal = ({ onClose }) => {
  const handlePrint = () => {
    const printContent = document.getElementById('manual-print-content').innerHTML;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Manuel de Configuration - Impression</title>
          <style>
            @page { size: portrait; margin: 0; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              color: #1e293b; 
              background: white;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              margin: 15mm;
              padding: 0;
            }
            .print-section { 
              page-break-after: always; 
              margin-bottom: 40px; 
            }
            .print-section:last-child { page-break-after: auto; }
            h3 { color: #0f172a; font-size: 1.4rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; display: flex; align-items: center; }
            h4 { color: #0f172a; font-size: 1.2rem; margin-top: 20px; }
            p { font-size: 1.05rem; line-height: 1.6; color: #334155; }
            ul { line-height: 1.6; font-size: 1.05rem; color: #334155; padding-left: 20px; }
            .mockup-window { 
              border: 1px solid #cbd5e1; 
              border-radius: 8px; 
              margin: 20px 0; 
              background: #f8fafc;
              overflow: hidden;
            }
            .mockup-header { 
              background: #e2e8f0; 
              padding: 10px 15px; 
              display: flex; 
              gap: 6px; 
              align-items: center; 
              border-bottom: 1px solid #cbd5e1;
            }
            .mockup-dot { width: 12px; height: 12px; border-radius: 50%; }
            .mockup-title { font-size: 0.85rem; color: #64748b; margin-left: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
            .mockup-body { padding: 20px; }
            strong { color: #0f172a; }
            .no-print { display: none !important; }
            
            /* Custom grids for iframe since we copy the HTML but want it to look good on white background */
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
            .box { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            .box-blue { background: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 20px; }
            .input-mock { display: block; width: 100%; padding: 8px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; margin-top: 5px; color: #475569; font-size: 0.9rem; }
            .btn-mock { display: inline-block; background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 0.9rem; margin-top: 10px; }
            
            svg { display: inline-block; vertical-align: middle; margin-right: 8px; }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #0f172a; padding-bottom: 20px;">
            <h1 style="color: #0f172a; margin: 0; font-size: 2rem;">📖 Manuel d'Utilisation</h1>
            <h2 style="color: #64748b; margin: 10px 0 0 0; font-weight: normal;">Module : Configuration de l'Entreprise</h2>
          </div>
          ${DOMPurify.sanitize(printContent)}
        </body>
      </html>
    `);
    iframe.contentWindow.document.close();
    
    // Attendre que l'iframe soit prête puis imprimer
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
    }}>
      <div style={{
        background: '#0f172a', borderRadius: '16px', width: '90%', maxWidth: '900px',
        border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column'
      }}>
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 25px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen style={{ color: '#38bdf8' }} />
            Manuel du Module : Configuration de l'Entreprise
          </h2>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={handlePrint} style={{ 
              background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600
            }}>
              <Printer size={18} />
              Imprimer le Manuel
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}>
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Corps du manuel (Scrolable à l'écran, mais contenu copié pour l'impression) */}
        <div id="manual-print-content" style={{ padding: '25px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          {/* Section 1 : Grille des Postes */}
          <div className="print-section" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 10px 0', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              1. Grille des Postes & Salaires
            </h3>
            
            <div className="mockup-window">
              <div className="mockup-header">
                <div className="mockup-dot" style={{ background: '#ef4444' }}></div>
                <div className="mockup-dot" style={{ background: '#f59e0b' }}></div>
                <div className="mockup-dot" style={{ background: '#22c55e' }}></div>
                <span className="mockup-title">Configuration des Postes</span>
              </div>
              <div className="mockup-body grid-3">
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Code (ex: CP)</label>
                  <div className="input-mock">OTS</div>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Nom complet du poste</label>
                  <div className="input-mock">Opérateur Radio ITC</div>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Salaire de base</label>
                  <div className="input-mock">100 000 FCFA</div>
                </div>
              </div>
            </div>

            <p style={{ color: '#94a3b8', margin: '0 0 15px 0', lineHeight: '1.6', fontSize: '1.05rem' }}>
              Cette section vous permet de structurer les différents emplois de l'entreprise. Vous définissez ici le <strong>Code du poste</strong>, le <strong>Nom complet</strong> et le <strong>Salaire de base</strong>.
            </p>
            <p style={{ color: '#94a3b8', margin: '0 0 15px 0', lineHeight: '1.6', fontSize: '1.05rem' }}>
              <strong style={{ color: '#f59e0b' }}>💡 Pourquoi c'est important :</strong> Lors de la création d'un agent, le système se basera automatiquement sur le salaire défini ici pour calculer ses futures fiches de paie.
            </p>
          </div>

          {/* Section 2 : Salaires Particuliers */}
          <div className="print-section" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 10px 0', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              2. Salaires Particuliers (Agents / Superviseurs)
            </h3>
            
            <div className="mockup-window">
              <div className="mockup-header">
                <div className="mockup-dot" style={{ background: '#ef4444' }}></div>
                <div className="mockup-dot" style={{ background: '#f59e0b' }}></div>
                <div className="mockup-dot" style={{ background: '#22c55e' }}></div>
                <span className="mockup-title">Salaires Particuliers</span>
              </div>
              <div className="mockup-body grid-2">
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Sélectionnez un agent</label>
                  <div className="input-mock">6A2D6D - ALIMATA (OTS)</div>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Nouveau Salaire de Base (FCFA)</label>
                  <div className="input-mock">150 000</div>
                </div>
              </div>
            </div>

            <p style={{ color: '#94a3b8', margin: '0 0 15px 0', lineHeight: '1.6', fontSize: '1.05rem' }}>
              Il arrive qu'un agent bénéficie d'un salaire différent de celui de son poste de base (négociation à l'embauche, promotion, etc.).
            </p>
            <p style={{ color: '#94a3b8', margin: 0, lineHeight: '1.6', fontSize: '1.05rem' }}>
              <strong style={{ color: '#38bdf8' }}>⚡ Fonctionnement :</strong> Ajoutez simplement le matricule de l'agent et son nouveau salaire de base ici. Le module de paie appliquera <strong>toujours</strong> cette valeur en priorité par rapport à la grille générale.
            </p>
          </div>

          {/* Section 3 : Méthodes de calcul & Logo */}
          <div className="print-section" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 10px 0', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              3. Informations Générales de Paie
            </h3>
            
            <div className="mockup-window">
              <div className="mockup-header">
                <div className="mockup-dot" style={{ background: '#ef4444' }}></div>
                <div className="mockup-dot" style={{ background: '#f59e0b' }}></div>
                <div className="mockup-dot" style={{ background: '#22c55e' }}></div>
                <span className="mockup-title">Configuration de la Paie</span>
              </div>
              <div className="mockup-body grid-2">
                <div className="box">
                  <label style={{ display: 'block', color: '#64748b', marginBottom: '8px', fontSize: '0.9rem' }}>Méthode de calcul des impôts</label>
                  <div className="input-mock">Simplifié (Taux fixes paramétrables)</div>
                </div>
                <div className="box">
                  <label style={{ display: 'block', color: '#64748b', marginBottom: '8px', fontSize: '0.9rem' }}>Logo de l'entreprise</label>
                  <div className="input-mock" style={{ borderStyle: 'dashed', textAlign: 'center' }}>📁 Cliquez pour uploader une image</div>
                </div>
              </div>
            </div>

            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '1.05rem' }}>
              <li><strong>Méthode de calcul des impôts :</strong> Vous avez le choix entre plusieurs barèmes ou taux fixes selon la convention appliquée.</li>
              <li><strong>Logo de l'entreprise :</strong> L'image uploadée ici remplacera automatiquement le logo par défaut sur l'en-tête de <strong>tous les bulletins de paie</strong> générés.</li>
            </ul>
          </div>

          {/* Section 4 : Aide Comptable */}
          <div className="print-section box-blue" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
            <h3 style={{ color: '#3b82f6', margin: '0 0 10px 0', fontSize: '1.4rem', borderBottom: '2px solid #93c5fd' }}>
              4. Aide Comptable : Comprendre les Retenues
            </h3>

            <p style={{ fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '20px' }}>
              Une distinction claire est nécessaire lors du paramétrage des taux pour éviter de léser l'employé ou l'entreprise.
            </p>

            <div className="grid-2">
              <div className="box">
                <strong style={{ fontSize: '1.1rem', color: '#1e3a8a' }}>Retenues Salariales :</strong>
                <p style={{ fontSize: '1rem', lineHeight: '1.6', marginTop: '8px' }}>
                  Sont inclus : <em>CNPS Salarial, CMU Employé, ITS, Avances</em>.<br/><br/>
                  Elles sont <strong>payées par l'agent</strong>. Le montant total de ces rubriques est déduit du "Salaire Brut" pour obtenir le "Net à Payer".
                </p>
              </div>
              <div className="box">
                <strong style={{ fontSize: '1.1rem', color: '#1e3a8a' }}>Retenues Patronales :</strong>
                <p style={{ fontSize: '1rem', lineHeight: '1.6', marginTop: '8px' }}>
                  Sont inclus : <em>Accidents du Travail, FDFP, Taxe Apprentissage, CNPS Patronal, CMU Patronal</em>.<br/><br/>
                  Elles sont <strong>payées par l'entreprise</strong> directement à l'État. Elles n'impactent pas le portefeuille de l'employé.
                </p>
              </div>
            </div>
          </div>

          {/* Section 5 : Rubriques du Bulletin */}
          <div className="print-section" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 10px 0', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              5. Affichage & Rubriques du Bulletin
            </h3>
            
            <div className="mockup-window">
              <div className="mockup-header">
                <div className="mockup-dot" style={{ background: '#ef4444' }}></div>
                <div className="mockup-dot" style={{ background: '#f59e0b' }}></div>
                <div className="mockup-dot" style={{ background: '#22c55e' }}></div>
                <span className="mockup-title">Rubriques du Bulletin de Paie</span>
              </div>
              <div className="mockup-body grid-3">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><input type="checkbox" checked readOnly /> Sursalaire / Primes</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><input type="checkbox" checked readOnly /> Prime d'Ancienneté</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><input type="checkbox" checked readOnly /> CMU Employé</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><input type="checkbox" checked readOnly /> ITS</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><input type="checkbox" checked readOnly /> Accidents du Travail</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}><input type="checkbox" checked readOnly /> FDFP</label>
              </div>
            </div>

            <p style={{ margin: '0 0 15px 0', lineHeight: '1.6', fontSize: '1.05rem' }}>
              Ce panneau vous donne le contrôle absolu sur le contenu visuel du bulletin de paie généré. Cochez les cases correspondant aux lignes que vous souhaitez voir apparaître sur le document final.
            </p>
            
            <h4>Inclusions Spécifiques & Temps de Travail</h4>
            <p style={{ margin: '0 0 15px 0', lineHeight: '1.6', fontSize: '1.05rem' }}>
              Définissez la règle métier de votre entreprise pour le calcul des heures à partir du pointage. Par exemple, si vous cochez <strong>"Inclure Congés dans Heures Travaillées"</strong>, un agent en congé verra ses heures de repos créditées sur sa paie. Vous pouvez également configurer la visibilité des lignes d'absence sur le bulletin imprimé.
            </p>
          </div>

          {/* Section 6 : Heures de Montée et Descente */}
          <div className="print-section" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 10px 0', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              6. Horaires Automatiques (Montée / Descente)
            </h3>

            <div className="mockup-window">
              <div className="mockup-header">
                <div className="mockup-dot" style={{ background: '#ef4444' }}></div>
                <div className="mockup-dot" style={{ background: '#f59e0b' }}></div>
                <div className="mockup-dot" style={{ background: '#22c55e' }}></div>
                <span className="mockup-title">Heures de Montée et Descente</span>
              </div>
              <div className="mockup-body grid-2">
                <div className="box" style={{ borderLeft: '4px solid #38bdf8' }}>
                  <strong style={{ color: '#38bdf8', fontSize: '1rem', display: 'block', marginBottom: '10px' }}>☀️ Vacation Jour</strong>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}><label style={{ fontSize: '0.8rem', color: '#64748b' }}>Montée</label><div className="input-mock">06:30</div></div>
                    <div style={{ flex: 1 }}><label style={{ fontSize: '0.8rem', color: '#64748b' }}>Descente</label><div className="input-mock">18:30</div></div>
                  </div>
                </div>
                <div className="box" style={{ borderLeft: '4px solid #a855f7' }}>
                  <strong style={{ color: '#a855f7', fontSize: '1rem', display: 'block', marginBottom: '10px' }}>🌙 Vacation Nuit</strong>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}><label style={{ fontSize: '0.8rem', color: '#64748b' }}>Montée</label><div className="input-mock">18:30</div></div>
                    <div style={{ flex: 1 }}><label style={{ fontSize: '0.8rem', color: '#64748b' }}>Descente</label><div className="input-mock">06:30</div></div>
                  </div>
                </div>
              </div>
            </div>

            <p style={{ margin: '0 0 15px 0', lineHeight: '1.6', fontSize: '1.05rem' }}>
              Indispensable pour traduire un statut de pointage (ex: Présent) en un nombre d'heures réelles travaillées. Le système fera la différence entre l'heure de descente et de montée pour trouver la durée.
            </p>
            <p style={{ margin: '15px 0 0 0', lineHeight: '1.6', fontSize: '1.05rem' }}>
              Un agent en cycle 24h cumulera automatiquement la somme des deux vacations (ex: 12h + 12h = 24h).
            </p>
          </div>

          {/* Section 7 : Taux de Cotisation */}
          <div className="print-section" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 10px 0', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              7. Taux Applicables & Heures Sup.
            </h3>

            <div className="mockup-window">
              <div className="mockup-header">
                <div className="mockup-dot" style={{ background: '#ef4444' }}></div>
                <div className="mockup-dot" style={{ background: '#f59e0b' }}></div>
                <div className="mockup-dot" style={{ background: '#22c55e' }}></div>
                <span className="mockup-title">Taux Applicables</span>
              </div>
              <div className="mockup-body grid-3">
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>CNPS Salarial (%)</label><div className="input-mock">6.3</div></div>
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>CNPS Patronal (%)</label><div className="input-mock">7.7</div></div>
                <div><label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>ITS Fixe (%)</label><div className="input-mock">1.2</div></div>
              </div>
            </div>

            <p style={{ margin: '0 0 15px 0', lineHeight: '1.6', fontSize: '1.05rem' }}>
              Configurez ici les pourcentages réglementaires pour garantir la conformité de vos fiches de paie en cas de modification de la loi de finances.
            </p>
            <ul style={{ fontSize: '1.05rem', lineHeight: '1.8', paddingLeft: '20px' }}>
              <li><strong>CNPS Salarial :</strong> Souvent fixé autour de 6,3%.</li>
              <li><strong>CNPS Patronal :</strong> Souvent fixé autour de 7,7%.</li>
              <li><strong>Heures Supplémentaires :</strong> Définissez les majorations pour chaque type de jour (Jour normal: +15%, Nuit: +50%, Dimanche: +75%, Férié: +100%).</li>
              <li><strong>Montant Fixe :</strong> Certains éléments comme la CMU peuvent être configurés via un montant fixe plutôt qu'un pourcentage.</li>
            </ul>
          </div>



          {/* Section 8 : Cumul Annuel et Avantages */}
          <div className="print-section" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 10px 0', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              8. Cumul Annuel et Avantages en Nature
            </h3>

            <div className="mockup-window">
              <div className="mockup-header">
                <div className="mockup-dot" style={{ background: '#ef4444' }}></div>
                <div className="mockup-dot" style={{ background: '#f59e0b' }}></div>
                <div className="mockup-dot" style={{ background: '#22c55e' }}></div>
                <span className="mockup-title">Paramètres du Cumul Annuel</span>
              </div>
              <div className="mockup-body grid-2">
                <div className="box" style={{ borderLeft: '4px solid #38bdf8' }}>
                  <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Mois de début du Cumul Annuel</label>
                  <div className="input-mock">Janvier (Recommandé)</div>
                </div>
                <div className="box" style={{ borderLeft: '4px solid #a855f7' }}>
                  <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Avantages en nature par défaut</label>
                  <div className="input-mock">0</div>
                </div>
              </div>
            </div>

            <p style={{ margin: '0 0 15px 0', lineHeight: '1.6', fontSize: '1.05rem' }}>
              Cette section vous permet de configurer le bas du bulletin de paie.
            </p>
            <ul style={{ fontSize: '1.05rem', lineHeight: '1.8', paddingLeft: '20px' }}>
              <li><strong>Mois de début du Cumul Annuel :</strong> Le système additionne automatiquement tous les bulletins archivés de l'année pour former le cumul. Vous pouvez choisir ici le mois à partir duquel les compteurs de l'année redémarrent à zéro (généralement Janvier).</li>
              <li><strong>Avantages en nature par défaut :</strong> Si vous saisissez un montant ici, il apparaîtra par défaut dans la colonne "Avantage en nature" de la fiche de paie et sera cumulé mensuellement pour chaque agent. Laissez à 0 si non applicable.</li>
            </ul>
          </div>

        </div>
        <div className="no-print" style={{ padding: '15px 25px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(255,255,255,0.02)' }}>
          <button onClick={onClose} style={{
            background: 'linear-gradient(135deg, #38bdf8, #a855f7)', color: 'white', border: 'none',
            padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'
          }}>
            J'ai compris, fermer le manuel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationManualModal;

