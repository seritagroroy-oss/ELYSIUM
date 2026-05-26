import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Printer, FileText, CheckSquare, Square, Check, 
  Trash2, Eye, Settings, Upload, Mail, Sparkles, 
  Send, Scissors, Search, CalendarDays, Building, 
  ArrowLeft, CheckCircle2, AlertCircle, MessageSquare,
  LayoutGrid, ChevronRight, Award, Flame, Palette,
  CheckSquare2
} from 'lucide-react';

const InlineInput = ({ value, onChange, isEditable, style, multiline }) => {
  if (!isEditable) {
    return <div style={{ whiteSpace: multiline ? 'pre-wrap' : 'normal', ...style }}>{value}</div>;
  }
  
  if (multiline) {
    return (
      <textarea 
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          background: 'rgba(52, 211, 153, 0.05)',
          border: '1px dashed #34d399',
          outline: 'none',
          color: 'inherit',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          fontWeight: 'inherit',
          resize: 'vertical',
          padding: '2px',
          ...style
        }}
        rows={(value || '').split('\n').length || 1}
      />
    );
  }

  return (
    <input 
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%',
        background: 'rgba(52, 211, 153, 0.05)',
        border: '1px dashed #34d399',
        outline: 'none',
        color: 'inherit',
        fontFamily: 'inherit',
        fontSize: 'inherit',
        fontWeight: 'inherit',
        padding: '1px 2px',
        textAlign: 'inherit',
        ...style
      }}
    />
  );
};

export default function PayslipPrintView({ onClose }) {
  // Periods list helper (last 6 months)
  const periods = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    periods.push(date.toISOString().slice(0, 7));
  }

  // --- States ---
  const [period, setPeriod] = useState(periods[0]);
  const [selectedSite, setSelectedSite] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [agentsData, setAgentsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgentIds, setSelectedAgentIds] = useState([]);
  
  // Printing settings & Advanced Modal Cockpit
  const [selectedTemplate, setSelectedTemplate] = useState('classic'); // Selected active template ID
  const [showSettingsModal, setShowSettingsModal] = useState(false); // Settings Panel Modal
  const [activeSettingsTab, setActiveSettingsTab] = useState('templates'); // 'templates' or 'custom_builder'
  
  const [ecoMode, setEcoMode] = useState(false);
  const [includeSignature, setIncludeSignature] = useState(true);
  const [customSignature, setCustomSignature] = useState(null); // base64 uploaded signature
  const [showPreviewModal, setShowPreviewModal] = useState(null); // agent object if previewing
  const [toast, setToast] = useState(null); // { message, type }
  
  // Vault notification modal
  const [notifyingAgent, setNotifyingAgent] = useState(null);
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  // Auto-activate custom template when entering custom builder tab
  useEffect(() => {
    if (activeSettingsTab === 'custom_builder') {
      setSelectedTemplate('custom');
    }
  }, [activeSettingsTab]);

  // --- CUSTOM TEMPLATE BUILDER CONFIG STATE (Supports direct inline editing) ---
  const [customConfig, setCustomConfig] = useState({
    primaryColor: '#0d9488',
    secondaryColor: '#14b8a6',
    accentColor: '#db2777',
    fontFamily: 'sans-serif',
    layout: 'standard',
    
    // Toggles for suppressing things
    showEmployerInfo: true,
    showEmployeeInfo: true,
    showVacationGrid: true,
    showDetailedContributions: true, // If false, shows single simplified total cotisations row
    showPASBox: true,
    showLegalFooter: true,
    showEmployerStamp: true,
    
    // Custom Injections (Adding things / Direct inline editable)
    headerNotice: 'BULLETIN DE PAIE',
    employerName: 'POINTAGE PRO SECURITY',
    employerDetails: '5 Avenue de la République, Abidjan\nSiret : 438 889 004 00012\nRCCM : CI-ABJ-03-2026-B12-00425\nCNPS : 1845620-A\nConvention Collective : Sécurité et Gardiennage',
    
    employeeName: 'Agent Démonstration',
    employeeDetails: 'Adresse : Zone d\'Affectation SITE INTERNE\nEMPLOI : VIGILE SUPERVISEUR\nQUALIFICATION : Agent de Sécurité Qualifié\nCoef : 190 | Date d\'entrée : 01/01/2025\nN° SS : 1 85 12 99 345 120 42',
    
    footerNotice: 'Dans votre intérêt et pour faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée.',
    customBadgeLabel: 'Net à payer après PAS',
    doubleBorders: false,
  });

  // Load custom template from backend on mount
  useEffect(() => {
    fetch('../../api.php?action=get_payslip_template')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.template && Object.keys(data.template).length > 0) {
          setCustomConfig(prev => ({ ...prev, ...data.template }));
        }
      })
      .catch(console.error);
  }, []);

  // Save custom template to backend
  const handleSaveSettings = () => {
    fetch('../../api.php?action=save_payslip_template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template: customConfig })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        if (window.showToast) window.showToast("Modèle personnalisé sauvegardé avec succès !", "success");
      } else {
        console.error("Save failed:", data.message);
      }
    })
    .catch(console.error);
    
    setShowSettingsModal(false);
  };


  // --- CATALOG OF 50 PREMIUM PAYSLIP TEMPLATES ---
  const templatesList = [
    { id: 'classic', name: '1. Modèle Classique Français 🇫🇷', desc: 'Standard traditionnel avec en-têtes bleu roi et surbrillances roses.', primary: '#1e40af', secondary: '#2563eb', font: 'sans-serif', layout: 'standard', accent: '#ec4899', border: '1px solid #cbd5e1' },
    { id: 'minimal', name: '2. Modèle Minimaliste Moderne 💎', desc: 'Épuré sans bordures lourdes, typographie aérée et tons gris perle.', primary: '#475569', secondary: '#64748b', font: 'sans-serif', layout: 'minimal', accent: '#334155', border: '1px solid #e2e8f0' },
    { id: 'dark_luxury', name: '3. Modèle Dark Luxury 🌌', desc: 'Tons sombres corporate avec liserés or dorés pour collaborateurs exécutifs.', primary: '#0f172a', secondary: '#1e293b', font: 'sans-serif', layout: 'standard', accent: '#b45309', border: '1px solid #d97706' },
    { id: 'eco_compact', name: '4. Modèle Eco-Compact 🍃', desc: 'Marges ultra-fines et polices resserrées pour économiser le papier (A5 idéal).', primary: '#15803d', secondary: '#166534', font: 'sans-serif', layout: 'standard', accent: '#15803d', border: '1px solid #d1d5db' },
    { id: 'emerald', name: '5. Modèle Émeraude Écologique 🟢', desc: 'Thème vert forêt célébrant l\'engagement social et environnemental.', primary: '#059669', secondary: '#10b981', font: 'sans-serif', layout: 'standard', accent: '#047857', border: '1px solid #a7f3d0' },
    { id: 'pointage_pro', name: '6. Modèle Pointage Pro Standard 💠', desc: 'Le modèle aux couleurs turquoise emblématique de notre marque Pointage Pro.', primary: '#0d9488', secondary: '#14b8a6', font: 'sans-serif', layout: 'standard', accent: '#0f766e', border: '1px solid #99f6e4' },
    { id: 'swiss', name: '7. Modèle Suisse Haute Précision 🇨🇭', desc: 'Quadrillages détaillés et contrastes rouges pour une clarté comptable.', primary: '#b91c1c', secondary: '#dc2626', font: 'monospace', layout: 'standard', accent: '#991b1b', border: '1px solid #cbd5e1' },
    { id: 'anglo_saxon', name: '8. Modèle Anglo-Saxon Split 🇬🇧', desc: 'Structure modifiée présentant les Gains à gauche et les Retenues à droite.', primary: '#0f172a', secondary: '#1e293b', font: 'sans-serif', layout: 'split', accent: '#b91c1c', border: '1px solid #cbd5e1' },
    { id: 'startup', name: '9. Modèle Start-Up Innovante 🦄', desc: 'Dégradé de couleurs violet/rose moderne avec badges nets arrondis.', primary: '#7c3aed', secondary: '#8b5cf6', font: 'sans-serif', layout: 'standard', accent: '#db2777', border: '1px solid #e9d5ff' },
    { id: 'executive', name: '10. Modèle Exécutif Premium 👑', desc: 'Bordures doubles couleur bronze, filigrane et sections élargies.', primary: '#78350f', secondary: '#92400e', font: 'sans-serif', layout: 'standard', accent: '#78350f', border: '2px double #b45309' },
    
    // 11 to 20
    { id: 'riviera', name: '11. Modèle Riviera Riviera 🏖️', desc: 'Inspiré des tons azur et sable chaud pour une ambiance méditerranéenne.', primary: '#0284c7', secondary: '#0ea5e9', font: 'sans-serif', layout: 'standard', accent: '#f59e0b', border: '1px solid #bae6fd' },
    { id: 'cyberpunk', name: '12. Modèle Cyberpunk Neon ⚡', desc: 'Contraste électrique avec en-têtes noirs et accents néon rose & cyan.', primary: '#090d16', secondary: '#1e293b', font: 'monospace', layout: 'standard', accent: '#db2777', border: '2px solid #06b6d4' },
    { id: 'ebony', name: '13. Modèle Ébène Corporate 🪵', desc: 'Tons bois sombre précieux et ivoire pour un rendu artisanal haut de gamme.', primary: '#451a03', secondary: '#78350f', font: 'serif', layout: 'standard', accent: '#b45309', border: '1px solid #fed7aa' },
    { id: 'vintage', name: '14. Modèle Vintage Typewriter 📜', desc: 'Police avec empattement vintage pour un style dactylographié d\'époque.', primary: '#1e293b', secondary: '#475569', font: 'serif', layout: 'standard', accent: '#854d0e', border: '1px dashed #ca8a04' },
    { id: 'royal_gold', name: '15. Modèle Royal Gold ⚜️', desc: 'Bleu royal impérial marié à des bordures dorées de prestige.', primary: '#1d4ed8', secondary: '#1e40af', font: 'sans-serif', layout: 'standard', accent: '#ca8a04', border: '2px solid #fbbf24' },
    { id: 'indigo_tech', name: '16. Modèle Indigo Tech 💻', desc: 'Un style inspiré du monde de la tech avec des tons indigo électriques.', primary: '#4f46e5', secondary: '#6366f1', font: 'sans-serif', layout: 'standard', accent: '#8b5cf6', border: '1px solid #c7d2fe' },
    { id: 'crimson', name: '17. Modèle Crimson Bold 🔴', desc: 'Bandeaux rouge carmin intenses pour marquer la puissance et l\'autorité.', primary: '#991b1b', secondary: '#be123c', font: 'sans-serif', layout: 'standard', accent: '#991b1b', border: '1px solid #fca5a5' },
    { id: 'nordic', name: '18. Modèle Nordique Scandi ❄️', desc: 'Tons bleutés givrés scandinaves très calmes et minimalistes.', primary: '#0369a1', secondary: '#0284c7', font: 'sans-serif', layout: 'minimal', accent: '#0369a1', border: '1px solid #e0f2fe' },
    { id: 'sahara', name: '19. Modèle Sahara Sand 🏜️', desc: 'Tons terre cuite du désert et beige chaud avec des lignes fines.', primary: '#c2410c', secondary: '#ea580c', font: 'sans-serif', layout: 'standard', accent: '#d97706', border: '1px solid #ffedd5' },
    { id: 'bordeaux', name: '20. Modèle Bordeaux Vintage 🍷', desc: 'Couleur lie-de-vin bordeaux raffinée pour les institutions classiques.', primary: '#881337', secondary: '#9f1239', font: 'serif', layout: 'standard', accent: '#881337', border: '1px solid #fecdd3' },

    // 21 to 30
    { id: 'forest_bark', name: '21. Modèle Forest Bark 🌲', desc: 'Tons naturels écorce de sapin et lignes organiques soignées.', primary: '#14532d', secondary: '#166534', font: 'sans-serif', layout: 'standard', accent: '#14532d', border: '1px solid #bbf7d0' },
    { id: 'slate_concrete', name: '22. Modèle Slate & Concrete 🏢', desc: 'Esthétique urbaine brute combinant le gris ciment et les polices droites.', primary: '#334155', secondary: '#475569', font: 'sans-serif', layout: 'minimal', accent: '#334155', border: '1px solid #cbd5e1' },
    { id: 'sakura', name: '23. Modèle Sakura Petal 🌸', desc: 'Nuances florales rose cerisier très douces avec bordures bordeaux.', primary: '#db2777', secondary: '#ec4899', font: 'sans-serif', layout: 'standard', accent: '#be123c', border: '1px solid #fce7f3' },
    { id: 'electric_amber', name: '24. Modèle Electric Amber ⚡', desc: 'Tons orange ambré vifs pour un effet dynamique et moderne.', primary: '#d97706', secondary: '#f59e0b', font: 'sans-serif', layout: 'standard', accent: '#d97706', border: '1px solid #fef3c7' },
    { id: 'ocean', name: '25. Modèle Ocean Breeze 🌊', desc: 'Esthétique côtière avec des tons cyan-océan et des grilles spacieuses.', primary: '#0891b2', secondary: '#06b6d4', font: 'sans-serif', layout: 'standard', accent: '#0369a1', border: '1px solid #cffafe' },
    { id: 'platinum', name: '26. Modèle Platinum Sleek 💿', desc: 'Tons platine et argent avec lettrage noir haute définition.', primary: '#111827', secondary: '#374151', font: 'sans-serif', layout: 'minimal', accent: '#111827', border: '1px solid #e5e7eb' },
    { id: 'chocolate', name: '27. Modèle Chocolate Mousse 🍫', desc: 'Tons café et crème onctueuse pour un visuel original et chaleureux.', primary: '#3b2314', secondary: '#4a2c1a', font: 'serif', layout: 'standard', accent: '#4a2c1a', border: '1px solid #ede0d4' },
    { id: 'sunset', name: '28. Modèle Sunset Gradient 🌇', desc: 'Dégradé orange à rouge simulant un magnifique coucher de soleil.', primary: '#ea580c', secondary: '#f97316', font: 'sans-serif', layout: 'standard', accent: '#dc2626', border: '1px solid #ffedd5' },
    { id: 'mint', name: '29. Modèle Mint Refresh 🍃', desc: 'Tons menthe à l\'eau légers et vivifiants pour un bulletin aéré.', primary: '#059669', secondary: '#10b981', font: 'sans-serif', layout: 'minimal', accent: '#059669', border: '1px solid #d1fae5' },
    { id: 'nebula', name: '30. Modèle Cosmic Nebula 🌌', desc: 'Un thème spatial alliant violet néon et starlight pink audacieux.', primary: '#581c87', secondary: '#701a75', font: 'sans-serif', layout: 'standard', accent: '#db2777', border: '1px solid #fae8ff' },

    // 31 to 50
    { id: 'steel_iron', name: '31. Modèle Steel & Iron 🔩', desc: 'Gris métallisé industriel robuste avec lignes très marquées.', primary: '#374151', secondary: '#4b5563', font: 'sans-serif', layout: 'standard', accent: '#1f2937', border: '2px solid #9ca3af' },
    { id: 'canary', name: '32. Modèle Canary Gold 🐤', desc: 'Fond or canari vif avec des lignes noires contrastées.', primary: '#ca8a04', secondary: '#eab308', font: 'sans-serif', layout: 'standard', accent: '#ca8a04', border: '1px solid #fef08a' },
    { id: 'amethyst', name: '33. Modèle Amethyst Crystal 🔮', desc: 'Tons violet améthyste mystiques pour collaborateurs créatifs.', primary: '#7e22ce', secondary: '#9333ea', font: 'sans-serif', layout: 'standard', accent: '#7e22ce', border: '1px solid #f3e8ff' },
    { id: 'coral', name: '34. Modèle Coral Sunset 🪸', desc: 'Tons corail marin doux et sable blanc pour un visuel décontracté.', primary: '#f97316', secondary: '#fb923c', font: 'sans-serif', layout: 'standard', accent: '#ea580c', border: '1px solid #ffedd5' },
    { id: 'blue_lagoon', name: '35. Modèle Blue Lagoon 🐳', desc: 'Associe le bleu lagon et le blanc immaculé pour un rendu très pro.', primary: '#06b6d4', secondary: '#0891b2', font: 'sans-serif', layout: 'minimal', accent: '#0891b2', border: '1px solid #cffafe' },
    { id: 'olive', name: '36. Modèle Olive Grove 🫒', desc: 'Couleur vert olive traditionnel et détails dorés.', primary: '#65a30d', secondary: '#84cc16', font: 'sans-serif', layout: 'standard', accent: '#4d7c0f', border: '1px solid #ecfccb' },
    { id: 'marble', name: '37. Modèle Marble Premium 🏛️', desc: 'Imitation marbre blanc poli avec d\'élégantes lignes gris clair.', primary: '#1f2937', secondary: '#374151', font: 'serif', layout: 'minimal', accent: '#1f2937', border: '1px solid #cbd5e1' },
    { id: 'charcoal', name: '38. Modèle Charcoal Slate 🔌', desc: 'Gris anthracite sophistiqué marié à des lignes fines de haute précision.', primary: '#1f2937', secondary: '#111827', font: 'sans-serif', layout: 'standard', accent: '#111827', border: '1px solid #cbd5e1' },
    { id: 'orange_juice', name: '39. Modèle Orange Juice 🍊', desc: 'Vibrant orange tonique pour une énergie visuelle décuplée.', primary: '#ea580c', secondary: '#f97316', font: 'sans-serif', layout: 'minimal', accent: '#ea580c', border: '1px solid #ffedd5' },
    { id: 'red_velvet', name: '40. Modèle Red Velvet 🎂', desc: 'Bordeaux velouté combiné avec des lignes gris métallisées.', primary: '#be123c', secondary: '#be123c', font: 'sans-serif', layout: 'standard', accent: '#9f1239', border: '1px solid #ffe4e6' },
    { id: 'midnight_blue', name: '41. Modèle Midnight Blue 🌃', desc: 'Bleu nuit étoilé profond allié à des incrustations d\'or.', primary: '#1e3a8a', secondary: '#1d4ed8', font: 'sans-serif', layout: 'standard', accent: '#b45309', border: '2px solid #fde047' },
    { id: 'lavender', name: '42. Modèle Lavender Dream 🪻', desc: 'Tons lavande provençaux doux propices à la sérénité.', primary: '#6d28d9', secondary: '#7c3aed', font: 'sans-serif', layout: 'minimal', accent: '#6d28d9', border: '1px solid #f3e8ff' },
    { id: 'copper', name: '43. Modèle Copper Metal 🪙', desc: 'Effet cuivre brossé avec lignes marron foncé rustiques.', primary: '#9a3412', secondary: '#c2410c', font: 'sans-serif', layout: 'standard', accent: '#9a3412', border: '1px solid #ffedd5' },
    { id: 'cyber_cyan', name: '44. Modèle Cyber Cyan 👾', desc: 'Cyan électrique ultra contrasté pour un look robotique.', primary: '#0891b2', secondary: '#0e7490', font: 'monospace', layout: 'standard', accent: '#0891b2', border: '2px solid #22d3ee' },
    { id: 'peach', name: '45. Modèle Soft Peach 🍑', desc: 'Tons pêche doux de saison avec lettrage terre cuite.', primary: '#ea580c', secondary: '#f97316', font: 'sans-serif', layout: 'minimal', accent: '#c2410c', border: '1px solid #ffedd5' },
    { id: 'cobalt', name: '46. Modèle Cobalt Shield 🛡️', desc: 'Bleu cobalt intense assurant une présence institutionnelle forte.', primary: '#1d4ed8', secondary: '#1e40af', font: 'sans-serif', layout: 'standard', accent: '#1d4ed8', border: '1px solid #dbeafe' },
    { id: 'lime_zest', name: '47. Modèle Lime Zest 🍋', desc: 'Vert citron acide combiné à du noir mat pour un rendu pop.', primary: '#4d7c0f', secondary: '#65a30d', font: 'sans-serif', layout: 'standard', accent: '#84cc16', border: '1px solid #ecfccb' },
    { id: 'truffle', name: '48. Modèle Truffle Luxury 🍄', desc: 'Tons truffe chocolat noir raffinés mariés au bronze.', primary: '#27150a', secondary: '#3b2314', font: 'serif', layout: 'standard', accent: '#78350f', border: '1px solid #d6d3d1' },
    { id: 'pearl_satin', name: '49. Modèle Pearl Satin 🐚', desc: 'Fond blanc nacré satiné doux avec fines lignes de démarcation noires.', primary: '#1f2937', secondary: '#374151', font: 'serif', layout: 'minimal', accent: '#111827', border: '1px solid #cbd5e1' },
    { id: 'matrix', name: '50. Modèle Matrix Grid 📟', desc: 'Thème rétro vert matrix sur fond blanc dactylo d\'antan.', primary: '#15803d', secondary: '#166534', font: 'monospace', layout: 'standard', accent: '#166534', border: '1px solid #bbf7d0' }
  ];

  // --- Fetch Salaries and Agents Data ---
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiCall('get_fluctuation_analytics', { period }, 'GET');
      if (res && res.agents) {
        const list = res.agents.map(ag => {
          if (res.manual_adjustments) {
            const agentAdjs = res.manual_adjustments.filter(a => a.agent_id === ag.id);
            ag.primes = agentAdjs.filter(a => a.category === 'GAIN').reduce((s, a) => s + a.value, 0);
            ag.acomptes = agentAdjs.filter(a => a.category === 'LOSS').reduce((s, a) => s + a.value, 0);
          } else {
            ag.primes = 0;
            ag.acomptes = 0;
          }

          const randomAbs = Math.max(0, Math.floor(Math.sin(ag.name.length) * 3));
          const randomSP = Math.max(0, Math.floor(Math.cos(ag.name.length) * 4));
          
          const baseSalary = ag.base_salary || 75000;
          const dailyRate = Math.round(baseSalary / 30);
          const deductions = randomAbs * dailyRate;
          const spGains = randomSP * dailyRate * 1.25; 
          
          const cnps = Math.round(baseSalary * 0.055); 
          const brut = baseSalary + spGains + ag.primes;
          const totalDeductions = deductions + ag.acomptes + cnps;
          const netToPay = brut - totalDeductions;

          return {
            ...ag,
            baseSalary,
            absDays: randomAbs,
            spCount: randomSP,
            deductions,
            spGains,
            cnps,
            brut,
            totalDeductions,
            netToPay
          };
        });

        setAgentsData(list);
        setSelectedAgentIds(list.map(a => a.id));
      }
    } catch (e) {
      console.error(e);
      showToast("Erreur lors de la récupération des agents", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  // --- Filtering ---
  const filteredAgents = agentsData.filter(ag => {
    const matchSite = selectedSite === 'ALL' || ag.site === selectedSite;
    const matchSearch = ag.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        ag.function.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSite && matchSearch;
  });

  const uniqueSites = ['ALL', ...new Set(agentsData.map(a => a.site))];

  // Checkbox helpers
  const handleToggleSelectAll = () => {
    if (selectedAgentIds.length === filteredAgents.length) {
      setSelectedAgentIds([]);
    } else {
      setSelectedAgentIds(filteredAgents.map(a => a.id));
    }
  };

  const handleToggleSelectAgent = (id) => {
    if (selectedAgentIds.includes(id)) {
      setSelectedAgentIds(selectedAgentIds.filter(x => x !== id));
    } else {
      setSelectedAgentIds([...selectedAgentIds, id]);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Signature upload helper
  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomSignature(reader.result);
        showToast("Cachet & Signature personnalisés importés !", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  // Mock Notification trigger
  const handleSendNotification = (agent) => {
    setNotifyingAgent(agent);
  };

  const triggerMockNotification = () => {
    setIsSendingNotification(true);
    setTimeout(() => {
      setIsSendingNotification(false);
      setNotifyingAgent(null);
      showToast(`Notification de fiche de paie envoyée avec succès à ${notifyingAgent.name} par SMS/WhatsApp !`, "success");
    }, 2000);
  };

  const executePrint = () => {
    if (selectedAgentIds.length === 0) {
      showToast("Veuillez sélectionner au moins un agent pour l'impression !", "error");
      return;
    }
    window.print();
  };

  // --- Dynamic Dates helpers ---
  const getPeriodRangeLabel = (p) => {
    const year = p.split('-')[0];
    const month = p.split('-')[1];
    const lastDay = new Date(year, month, 0).getDate();
    return `PAYE DU 01/${month}/${year} AU ${lastDay}/${month}/${year}`;
  };

  const getPaymentDateLabel = (p) => {
    const year = p.split('-')[0];
    const month = p.split('-')[1];
    const lastDay = new Date(year, month, 0).getDate();
    return `Payé le ${lastDay}/${month}/${year}`;
  };

  // --- COMPUTE DETAILED FRENCH PAYROLL VARIABLES ---
  const computeDetailedPayroll = (agent) => {
    const brut = agent.brut || 100000;
    const baseVal = agent.baseSalary || 75000;
    const spCountVal = agent.spCount || 0;
    const spGainsVal = agent.spGains || 0;
    const primesVal = agent.primes || 0;

    // Cotisations Salariales
    const csgBase = Math.round(brut * 0.9825);
    const csgNonImp = Math.round(csgBase * 0.068);
    const csgImp = Math.round(csgBase * 0.029);

    const retraitePlaf = Math.round(brut * 0.069);
    const retraiteDepl = Math.round(brut * 0.004);
    const retraiteTr1 = Math.round(brut * 0.0492);
    const mutuelleSal = 3090;

    // Total charges salariales
    const totalSalarialCharges = csgNonImp + csgImp + retraitePlaf + retraiteDepl + retraiteTr1 + mutuelleSal;

    // Cotisations Patronales
    const santePat = Math.round(brut * 0.07);
    const mutuellePat = 3090;
    const atPat = Math.round(brut * 0.012);
    const retraitePlafPat = Math.round(brut * 0.0855);
    const retraiteDeplPat = Math.round(brut * 0.019);
    const retraiteTr1Pat = Math.round(brut * 0.0738);
    const famillePat = Math.round(brut * 0.0345);
    const chomagePat = Math.round(brut * 0.0405);
    const autresPat = Math.round(brut * 0.015);

    const totalPatronalCharges = santePat + mutuellePat + atPat + retraitePlafPat + retraiteDeplPat + retraiteTr1Pat + famillePat + chomagePat + autresPat;

    const netSocial = brut - totalSalarialCharges;
    const netAvantImpots = netSocial;

    const netImposable = Math.round(brut - (retraitePlaf + retraiteDepl + retraiteTr1) + csgImp + mutuellePat);
    
    // Impot a la source (PAS) at 2.0%
    const pasRate = 2.0;
    const pasAmount = Math.round(netImposable * 0.02);

    const netAPayerPAS = netAvantImpots - pasAmount - agent.deductions - agent.acomptes;

    return {
      brut,
      baseVal,
      spCountVal,
      spGainsVal,
      primesVal,
      csgBase,
      csgNonImp,
      csgImp,
      retraitePlaf,
      retraiteDepl,
      retraiteTr1,
      mutuelleSal,
      totalSalarialCharges,
      santePat,
      mutuellePat,
      atPat,
      retraitePlafPat,
      retraiteDeplPat,
      retraiteTr1Pat,
      famillePat,
      chomagePat,
      autresPat,
      totalPatronalCharges,
      netSocial,
      netAvantImpots,
      netImposable,
      pasRate,
      pasAmount,
      netAPayerPAS
    };
  };

  // --- REUSABLE BULLETINS LAYOUT COMPONENT ---
  const renderFrenchPayslipCard = (agent, isPreview) => {
    const pay = computeDetailedPayroll(agent);

    // Dynamic Variables based on active configuration
    let themeColor = '#1e40af';
    let headerBg = '#1e40af';
    let secondaryHeaderBg = '#2563eb';
    let cardBorder = '1px solid #cbd5e1';
    let totalsRowBg = '#fef08a';
    let netSocialBg = '#e2e8f0';
    let netAvantPASBg = '#16a34a';
    let netAPayerPASBorder = '3px solid #ec4899';
    let netAPayerPASBg = '#ffffff';
    let netAPayerPASText = '#ec4899';
    let customFont = "'Outfit', sans-serif";
    
    // Header & Badge Label & Footer Notice Injections
    let docHeaderTitle = 'BULLETIN DE PAIE';
    let employerNameLabel = 'POINTAGE PRO SECURITY';
    let employerDetailsText = `5 Avenue de la République, Abidjan\nSiret : 438 889 004 00012\nRCCM : CI-ABJ-03-2026-B12-00425\nCNPS : 1845620-A\nConvention Collective : Sécurité et Gardiennage`;
    
    let employeeNameLabel = agent.name;
    let employeeDetailsText = `Adresse : Zone d'Affectation ${agent.site}\nEMPLOI : ${agent.function}\nQUALIFICATION : Agent de Sécurité Qualifié\nCoef : 190 | Date d'entrée : ${agent.hire_date || '01/01/2025'}\nN° SS : 1 85 12 99 345 120 42`;
    
    let badgeTextLabel = 'Net à payer après PAS';
    let bottomLegalText = 'Dans votre intérêt et pour faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée.';
    
    // Element Toggles (Suppressions)
    let showEmployer = true;
    let showEmployee = true;
    let showVacation = true;
    let showDetailedCotis = true;
    let showPAS = true;
    let showLegalFtr = true;
    let showStampSeal = true;
    let isSplitLayout = false;
    let isCompact = ecoMode;

    if (selectedTemplate === 'custom') {
      // CUSTOM BUILDER ACTIVE - Injecting all user choices
      themeColor = customConfig.primaryColor;
      headerBg = customConfig.primaryColor;
      secondaryHeaderBg = customConfig.secondaryColor;
      netAPayerPASText = customConfig.accentColor;
      netAPayerPASBorder = customConfig.doubleBorders ? `3px double ${customConfig.accentColor}` : `3px solid ${customConfig.accentColor}`;
      netAPayerPASBg = '#fffdfd';
      cardBorder = `1px solid ${customConfig.secondaryColor}`;
      totalsRowBg = '#f1f5f9';
      netSocialBg = '#f8fafc';
      netAvantPASBg = customConfig.primaryColor;
      
      // Inject customized texts from editable state
      docHeaderTitle = customConfig.headerNotice || 'BULLETIN DE PAIE';
      employerNameLabel = customConfig.employerName || 'POINTAGE PRO SECURITY';
      employerDetailsText = customConfig.employerDetails || '';
      
      employeeNameLabel = customConfig.employeeName || agent.name;
      employeeDetailsText = customConfig.employeeDetails || '';
      
      badgeTextLabel = customConfig.customBadgeLabel || 'Net à payer après PAS';
      bottomLegalText = customConfig.footerNotice || '';

      if (customConfig.fontFamily === 'monospace') {
        customFont = "'Courier New', Courier, monospace";
      } else if (customConfig.fontFamily === 'serif') {
        customFont = "'Georgia', serif";
      }

      // Suppress elements toggles
      showEmployer = customConfig.showEmployerInfo;
      showEmployee = customConfig.showEmployeeInfo;
      showVacation = customConfig.showVacationGrid;
      showDetailedCotis = customConfig.showDetailedContributions;
      showPAS = customConfig.showPASBox;
      showLegalFtr = customConfig.showLegalFooter;
      showStampSeal = customConfig.showEmployerStamp;

      isSplitLayout = customConfig.layout === 'split';

    } else {
      // STANDARD PRE-DESIGNED TEMPLATE ACTIVE
      const activeConf = templatesList.find(t => t.id === selectedTemplate) || templatesList[0];
      themeColor = activeConf.primary;
      headerBg = activeConf.primary;
      secondaryHeaderBg = activeConf.secondary;
      cardBorder = activeConf.border;
      totalsRowBg = activeConf.id === 'minimal' ? '#f8fafc' : '#fef08a';
      netSocialBg = '#e2e8f0';
      netAvantPASBg = activeConf.id === 'minimal' ? '#475569' : '#16a34a';
      netAPayerPASBorder = `3px solid ${activeConf.accent}`;
      netAPayerPASText = activeConf.accent;
      
      if (activeConf.font === 'monospace') {
        customFont = "'Courier New', Courier, monospace";
      } else if (activeConf.font === 'serif') {
        customFont = "'Georgia', serif";
      }

      isSplitLayout = activeConf.layout === 'split';
      isCompact = isCompact || activeConf.id === 'eco_compact';
    }

    const isEditable = selectedTemplate === 'custom' && isPreview;

    const renderLabel = (defaultText, keyName, additionalStyles = {}) => {
      return (
        <InlineInput
          isEditable={isEditable}
          value={customConfig[keyName] ?? defaultText}
          onChange={(val) => setCustomConfig({ ...customConfig, [keyName]: val })}
          style={{ display: 'inline-block', ...additionalStyles }}
        />
      );
    };

    return (
      <div className="french-payslip-stub" style={{
        background: '#ffffff',
        color: '#000000',
        padding: isPreview ? '1.5rem' : (isCompact ? '0.8cm 0.8cm 0.6cm 0.8cm' : '1.5cm 1.2cm 1cm 1.2cm'),
        fontFamily: customFont,
        fontSize: isCompact ? '9.5px' : '11px',
        lineHeight: isCompact ? '1.25' : '1.4',
        border: isPreview ? '1px solid #e2e8f0' : 'none',
        borderRadius: isPreview ? '16px' : '0',
        width: '100%',
        maxWidth: isPreview ? '780px' : 'none',
        margin: '0 auto',
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        
        {/* Helper edit badge shown only on custom preview */}
        {isEditable && (
          <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#34d399', color: '#0f172a', fontSize: '8px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', zIndex: 10 }}>
            ✏️ MODE ÉDITION EN DIRECT : CLIQUEZ SUR LES TEXTES POUR MODIFIER
          </div>
        )}

        {/* Eco mode scissor guide inside print canvas */}
        {!isPreview && ecoMode && (
          <div style={{ fontSize: '7px', color: '#94a3b8', borderBottom: '1px dashed #cbd5e1', paddingBottom: '3px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <Scissors size={8} /> Mode Éco - Ligne de découpe A5
          </div>
        )}

        {/* 1. Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: headerBg, color: '#ffffff', padding: '10px 15px', borderRadius: '4px', marginBottom: '15px' }}>
          <InlineInput 
            isEditable={isEditable}
            value={docHeaderTitle}
            onChange={(val) => setCustomConfig({...customConfig, headerNotice: val})}
            style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', letterSpacing: '0.05em' }}
          />
          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{getPeriodRangeLabel(period)}</span>
        </div>

        {/* 2. Top Info boxes */}
        {(showEmployer || showEmployee) && (
          <div style={{ display: 'grid', gridTemplateColumns: showEmployer && showEmployee ? '1fr 1fr' : '1fr', gap: '15px', marginBottom: '15px' }}>
            
            {/* Left Employer info box */}
            {showEmployer && (
              <div style={{ border: cardBorder, borderRadius: '4px', padding: '8px 12px', minHeight: '95px' }}>
                <InlineInput
                  isEditable={isEditable}
                  value={employerNameLabel}
                  onChange={(val) => setCustomConfig({...customConfig, employerName: val})}
                  style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '3px' }}
                />
                <InlineInput
                  isEditable={isEditable}
                  multiline={true}
                  value={employerDetailsText}
                  onChange={(val) => setCustomConfig({...customConfig, employerDetails: val})}
                  style={{ color: '#475569', fontSize: '10px' }}
                />
              </div>
            )}

            {/* Right Employee info box */}
            {showEmployee && (
              <div style={{ border: cardBorder, borderRadius: '4px', padding: '8px 12px', minHeight: '95px' }}>
                <InlineInput
                  isEditable={isEditable}
                  value={employeeNameLabel}
                  onChange={(val) => setCustomConfig({...customConfig, employeeName: val})}
                  style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}
                />
                <InlineInput
                  isEditable={isEditable}
                  multiline={true}
                  value={employeeDetailsText}
                  onChange={(val) => setCustomConfig({...customConfig, employeeDetails: val})}
                  style={{ color: '#475569', fontSize: '10px' }}
                />
              </div>
            )}
          </div>
        )}

        {/* 3. Date and Conges panel */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#1e293b', paddingTop: '4px' }}>
            {renderLabel('Payé le', 'lblPaymentDate', { width: 'auto', display: 'inline' })} {renderLabel(getPaymentDateLabel(period).replace('Payé le ', ''), 'lblPaymentDateVal', { width: 'auto', display: 'inline' })}
          </div>
          
          {/* Vacation Box */}
          {showVacation && (
            <table style={{ width: '220px', borderCollapse: 'collapse', fontSize: '9px', border: cardBorder }}>
              <thead>
                <tr style={{ background: themeColor, color: 'white' }}>
                  <th colSpan="3" style={{ padding: '2px 4px', fontSize: '9px', textTransform: 'uppercase', textAlign: 'center' }}>{renderLabel('Congés', 'lblCongesTitle', {textAlign: 'center'})}</th>
                </tr>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '2px 4px', border: cardBorder, textAlign: 'center' }}>{renderLabel('Acquis', 'lblCongAcq', {textAlign: 'center'})}</th>
                  <th style={{ padding: '2px 4px', border: cardBorder, textAlign: 'center' }}>{renderLabel('Pris', 'lblCongPris', {textAlign: 'center'})}</th>
                  <th style={{ padding: '2px 4px', border: cardBorder, textAlign: 'center' }}>{renderLabel('Restant', 'lblCongRest', {textAlign: 'center'})}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '2px 4px', border: cardBorder, textAlign: 'center', fontWeight: 'bold' }}>{renderLabel('15,00', 'lblCongAcqVal', {textAlign: 'center'})}</td>
                  <td style={{ padding: '2px 4px', border: cardBorder, textAlign: 'center' }}>{renderLabel(agent.absDays > 0 ? (agent.absDays).toFixed(2) : '0,00', 'lblCongPrisVal', {textAlign: 'center'})}</td>
                  <td style={{ padding: '2px 4px', border: cardBorder, textAlign: 'center', fontWeight: 'bold' }}>{renderLabel((15.00 - (agent.absDays || 0)).toFixed(2), 'lblCongRestVal', {textAlign: 'center'})}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* 4. Main Calculations Table */}
        {isSplitLayout ? (
          /* SPLIT-COLUMN LAYOUT */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            {/* Gains / Earnings (Left) */}
            <div style={{ border: cardBorder, borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ background: themeColor, color: 'white', fontWeight: 'bold', padding: '6px 10px', fontSize: '10px' }}>GAINS ET RÉMUNÉRATIONS (+)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: cardBorder }}>
                    <th style={{ padding: '5px 8px', textAlign: 'left' }}>Désignation</th>
                    <th style={{ padding: '5px 4px', textAlign: 'right' }}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '5px 8px', borderBottom: '1px solid #f1f5f9' }}>Salaire de base mensuel</td>
                    <td style={{ padding: '5px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 'bold' }}>{pay.baseVal.toLocaleString()}</td>
                  </tr>
                  {pay.spCountVal > 0 && (
                    <tr>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #f1f5f9' }}>Heures Supps ({pay.spCountVal} shifts)</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{pay.spGainsVal.toLocaleString()}</td>
                    </tr>
                  )}
                  {pay.primesVal > 0 && (
                    <tr>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #f1f5f9' }}>Primes exceptionnelles</td>
                      <td style={{ padding: '5px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{pay.primesVal.toLocaleString()}</td>
                    </tr>
                  )}
                  <tr style={{ background: totalsRowBg, fontWeight: 'bold' }}>
                    <td style={{ padding: '6px 8px' }}>TOTAL BRUT</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{pay.brut.toLocaleString()} CFA</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Retenues / Deductions (Right) */}
            <div style={{ border: cardBorder, borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ background: '#b91c1c', color: 'white', fontWeight: 'bold', padding: '6px 10px', fontSize: '10px' }}>CHARGES ET DÉDUCTIONS (-)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: cardBorder }}>
                    <th style={{ padding: '5px 8px', textAlign: 'left' }}>Désignation</th>
                    <th style={{ padding: '5px 4px', textAlign: 'right' }}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #f1f5f9' }}>Cotisation Retraite CNPS</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{pay.retraitePlaf.toLocaleString()}</td>
                  </tr>
                  {showDetailedCotis ? (
                    <>
                      <tr>
                        <td style={{ padding: '4px 8px', borderBottom: '1px solid #f1f5f9' }}>CSG & CRDS</td>
                        <td style={{ padding: '4px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{(pay.csgNonImp + pay.csgImp).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 8px', borderBottom: '1px solid #f1f5f9' }}>Complémentaire / Mutuelle</td>
                        <td style={{ padding: '4px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{pay.mutuelleSal.toLocaleString()}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #f1f5f9' }}>Autres Cotisations Synthétisées</td>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{(pay.totalSalarialCharges - pay.retraitePlaf).toLocaleString()}</td>
                    </tr>
                  )}
                  {agent.absDays > 0 && (
                    <tr>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #f1f5f9', color: '#ef4444' }}>Retenues Absences</td>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', color: '#ef4444' }}>{agent.deductions.toLocaleString()}</td>
                    </tr>
                  )}
                  {agent.acomptes > 0 && (
                    <tr>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #f1f5f9', color: '#fbbf24' }}>Avances / Acomptes reçus</td>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', color: '#fbbf24' }}>{agent.acomptes.toLocaleString()}</td>
                    </tr>
                  )}
                  <tr style={{ background: '#fee2e2', fontWeight: 'bold' }}>
                    <td style={{ padding: '6px 8px' }}>TOTAL RETENUES</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{(pay.totalSalarialCharges + agent.deductions + agent.acomptes).toLocaleString()} CFA</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        ) : (
          /* STANDARD STACKED FRENCH TABLE */
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '15px' }}>
            <thead>
              <tr style={{ background: headerBg, color: '#ffffff' }}>
                <th rowSpan="2" style={{ padding: '5px 8px', border: cardBorder, textAlign: 'left', width: '38%' }}>{renderLabel('Rubriques', 'lblRubriques')}</th>
                <th rowSpan="2" style={{ padding: '5px 4px', border: cardBorder, textAlign: 'center', width: '8%' }}>{renderLabel('Nombre', 'lblNombre', {textAlign: 'center'})}</th>
                <th rowSpan="2" style={{ padding: '5px 4px', border: cardBorder, textAlign: 'center', width: '10%' }}>{renderLabel('Base', 'lblBase', {textAlign: 'center'})}</th>
                <th rowSpan="2" style={{ padding: '5px 4px', border: cardBorder, textAlign: 'center', width: '10%' }}>{renderLabel('Taux', 'lblTaux', {textAlign: 'center'})}</th>
                <th colSpan="2" style={{ padding: '3px 4px', border: cardBorder, textAlign: 'center', width: '22%' }}>{renderLabel('Part Salariale', 'lblPartSal', {textAlign: 'center'})}</th>
                <th rowSpan="2" style={{ padding: '5px 4px', border: cardBorder, textAlign: 'center', width: '12%' }}>{renderLabel('Part Patr.', 'lblPartPat', {textAlign: 'center'})}</th>
              </tr>
              <tr style={{ background: secondaryHeaderBg, color: '#ffffff' }}>
                <th style={{ padding: '2px 4px', border: cardBorder, textAlign: 'right' }}>{renderLabel('Gain(+)', 'lblGainPlus', {textAlign: 'right'})}</th>
                <th style={{ padding: '2px 4px', border: cardBorder, textAlign: 'right' }}>{renderLabel('Retenue(-)', 'lblRetenueMinus', {textAlign: 'right'})}</th>
              </tr>
            </thead>
            <tbody>
              {/* SALAIRE BRUT SECTION */}
              <tr>
                <td style={{ padding: '4px 8px', borderLeft: cardBorder, borderRight: cardBorder }}>{renderLabel('Salaire de base mensuel 151.67h', 'lblBaseSal')}</td>
                <td style={{ padding: '4px 4px', borderRight: cardBorder, textAlign: 'center' }}>{renderLabel('151,67', 'lblBaseNombre', {textAlign: 'center'})}</td>
                <td style={{ padding: '4px 4px', borderRight: cardBorder, textAlign: 'center' }}>{renderLabel((pay.baseVal / 151.67).toFixed(2), 'lblBaseBase', {textAlign: 'center'})}</td>
                <td style={{ padding: '4px 4px', borderRight: cardBorder, textAlign: 'center' }}>{renderLabel('1,000', 'lblBaseTaux', {textAlign: 'center'})}</td>
                <td style={{ padding: '4px 4px', borderRight: cardBorder, textAlign: 'right', fontWeight: 'bold' }}>{renderLabel(pay.baseVal.toLocaleString(), 'lblBaseMontant', {textAlign: 'right'})}</td>
                <td style={{ padding: '4px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                <td style={{ padding: '4px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
              </tr>
              {pay.spCountVal > 0 && (
                <tr>
                  <td style={{ padding: '4px 8px', borderLeft: cardBorder, borderRight: cardBorder }}>{renderLabel('Heures Supplémentaires (Shifts Pointage)', 'lblHeuresSup')}</td>
                  <td style={{ padding: '4px 4px', borderRight: cardBorder, textAlign: 'center' }}>{renderLabel(pay.spCountVal.toString(), 'lblHSSupNombre', {textAlign: 'center'})}</td>
                  <td style={{ padding: '4px 4px', borderRight: cardBorder, textAlign: 'center' }}>{renderLabel((pay.spGainsVal / pay.spCountVal).toFixed(2), 'lblHSSupBase', {textAlign: 'center'})}</td>
                  <td style={{ padding: '4px 4px', borderRight: cardBorder, textAlign: 'center' }}>{renderLabel('1,250', 'lblHSSupTaux', {textAlign: 'center'})}</td>
                  <td style={{ padding: '4px 4px', borderRight: cardBorder, textAlign: 'right' }}>{renderLabel(pay.spGainsVal.toLocaleString(), 'lblHSSupMontant', {textAlign: 'right'})}</td>
                  <td style={{ padding: '4px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                  <td style={{ padding: '4px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                </tr>
              )}
              {pay.primesVal > 0 && (
                <tr>
                  <td style={{ padding: '4px 8px', borderLeft: cardBorder, borderRight: cardBorder }}>{renderLabel('Prime Exceptionnelle / Assiduité', 'lblPrimeExc')}</td>
                  <td style={{ padding: '4px 4px', borderRight: cardBorder, textAlign: 'center' }}>—</td>
                  <td style={{ padding: '4px 4px', borderRight: cardBorder, textAlign: 'center' }}>—</td>
                  <td style={{ padding: '4px 4px', borderRight: cardBorder, textAlign: 'center' }}>—</td>
                  <td style={{ padding: '4px 4px', borderRight: cardBorder, textAlign: 'right' }}>{renderLabel(pay.primesVal.toLocaleString(), 'lblPrimeMontant', {textAlign: 'right'})}</td>
                  <td style={{ padding: '4px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                  <td style={{ padding: '4px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                </tr>
              )}

              {/* TOTAL BRUT ROW */}
              <tr style={{ background: totalsRowBg, fontWeight: 'bold' }}>
                <td style={{ padding: '5px 8px', borderLeft: cardBorder, borderRight: cardBorder }}>{renderLabel('Total Brut', 'lblTotalBrut')}</td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder }}></td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder }}></td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder }}></td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder, textAlign: 'right' }}>{renderLabel(pay.brut.toLocaleString(), 'lblTotalBrutMontant', {textAlign: 'right'})}</td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
              </tr>

              {/* SOCIAL CONTRIBUTIONS SECTION */}
              {showDetailedCotis ? (
                <>
                  <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                    <td colSpan="7" style={{ padding: '3px 8px', borderLeft: cardBorder, borderRight: cardBorder, fontSize: '9px', textTransform: 'uppercase', color: '#475569' }}>{renderLabel('SANTÉ', 'lblSante')}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 8px', borderLeft: cardBorder, borderRight: cardBorder, paddingLeft: '15px' }}>{renderLabel('Sécurité Sociale - Maladie Maternité', 'lblSSMaladie')}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder }}></td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'center' }}>{renderLabel(pay.brut.toLocaleString(), 'lblSSMalBase', {textAlign: 'center'})}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder }}></td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'right' }}>{renderLabel(pay.santePat.toLocaleString(), 'lblSSMalPat', {textAlign: 'right'})}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 8px', borderLeft: cardBorder, borderRight: cardBorder, paddingLeft: '15px' }}>{renderLabel('Complémentaire Santé / Mutuelle', 'lblMutuelle')}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder }}></td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'center' }}>{renderLabel('150,00', 'lblMutuelleBase', {textAlign: 'center'})}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'center' }}>{renderLabel('50,00%', 'lblMutuelleTaux', {textAlign: 'center'})}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'right' }}>{renderLabel(pay.mutuelleSal.toLocaleString(), 'lblMutuelleSal', {textAlign: 'right'})}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'right' }}>{renderLabel(pay.mutuellePat.toLocaleString(), 'lblMutuellePat', {textAlign: 'right'})}</td>
                  </tr>

                  <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                    <td colSpan="7" style={{ padding: '3px 8px', borderLeft: cardBorder, borderRight: cardBorder, fontSize: '9px', textTransform: 'uppercase', color: '#475569' }}>{renderLabel('RETRAITE', 'lblRetraite')}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 8px', borderLeft: cardBorder, borderRight: cardBorder, paddingLeft: '15px' }}>{renderLabel('Sécurité Sociale Plafonnée', 'lblSSPlanch')}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder }}></td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'center' }}>{renderLabel(pay.brut.toLocaleString(), 'lblSSPlanchBase', {textAlign: 'center'})}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'center' }}>{renderLabel('6,90%', 'lblSSPlanchTaux', {textAlign: 'center'})}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'right' }}>{renderLabel(pay.retraitePlaf.toLocaleString(), 'lblSSPlanchSal', {textAlign: 'right'})}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'right' }}>{renderLabel(pay.retraitePlafPat.toLocaleString(), 'lblSSPlanchPat', {textAlign: 'right'})}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 8px', borderLeft: cardBorder, borderRight: cardBorder, paddingLeft: '15px' }}>{renderLabel('Complémentaire Tranche 1', 'lblCompTr1')}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder }}></td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'center' }}>{renderLabel(pay.brut.toLocaleString(), 'lblCompTr1Base', {textAlign: 'center'})}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'center' }}>{renderLabel('4,92%', 'lblCompTr1Taux', {textAlign: 'center'})}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'right' }}>{renderLabel(pay.retraiteTr1.toLocaleString(), 'lblCompTr1Sal', {textAlign: 'right'})}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'right' }}>{renderLabel(pay.retraiteTr1Pat.toLocaleString(), 'lblCompTr1Pat', {textAlign: 'right'})}</td>
                  </tr>

                  <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                    <td colSpan="7" style={{ padding: '3px 8px', borderLeft: cardBorder, borderRight: cardBorder, fontSize: '9px', textTransform: 'uppercase', color: '#475569' }}>{renderLabel('AUTRES STATUTAIRES', 'lblAutresStat')}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 8px', borderLeft: cardBorder, borderRight: cardBorder, paddingLeft: '15px' }}>{renderLabel('Prestations Familiales & Famille', 'lblFamille')}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder }}></td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'center' }}>{renderLabel(pay.brut.toLocaleString(), 'lblFamilleBase', {textAlign: 'center'})}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'center' }}>{renderLabel('3,45%', 'lblFamilleTaux', {textAlign: 'center'})}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'right' }}>{renderLabel(pay.famillePat.toLocaleString(), 'lblFamillePat', {textAlign: 'right'})}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 8px', borderLeft: cardBorder, borderRight: cardBorder, paddingLeft: '15px' }}>{renderLabel('Assurance Chômage / APE', 'lblChomage')}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder }}></td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'center' }}>{renderLabel(pay.brut.toLocaleString(), 'lblChomageBase', {textAlign: 'center'})}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'center' }}>{renderLabel('4,05%', 'lblChomageTaux', {textAlign: 'center'})}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'right' }}>{renderLabel(pay.chomagePat.toLocaleString(), 'lblChomagePat', {textAlign: 'right'})}</td>
                  </tr>

                  <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                    <td colSpan="7" style={{ padding: '3px 8px', borderLeft: cardBorder, borderRight: cardBorder, fontSize: '9px', textTransform: 'uppercase', color: '#475569' }}>{renderLabel('CSG & CRDS', 'lblCSG')}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 8px', borderLeft: cardBorder, borderRight: cardBorder, paddingLeft: '15px' }}>{renderLabel("CSG non imposable à l'impôt sur le revenu", 'lblCSGNonImp')}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder }}></td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'center' }}>{renderLabel(pay.csgBase.toLocaleString(), 'lblCSGNonImpBase', {textAlign: 'center'})}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'center' }}>{renderLabel('6,80%', 'lblCSGNonImpTaux', {textAlign: 'center'})}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'right' }}>{renderLabel(pay.csgNonImp.toLocaleString(), 'lblCSGNonImpSal', {textAlign: 'right'})}</td>
                    <td style={{ padding: '2px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                  </tr>
                </>
              ) : (
                /* REDUCED SIMPLIFIED SINGLE ROW FOR SOCIAL CONTRIBUTIONS */
                <tr>
                  <td style={{ padding: '6px 8px', borderLeft: cardBorder, borderRight: cardBorder, fontWeight: 'bold', color: '#475569' }}>{renderLabel('Cotisations & Retenues Sociales Salariales (Synthétisées)', 'lblCotisSynthese')}</td>
                  <td style={{ padding: '6px 4px', borderRight: cardBorder, textAlign: 'center' }}>—</td>
                  <td style={{ padding: '6px 4px', borderRight: cardBorder, textAlign: 'center' }}>{pay.brut.toLocaleString()}</td>
                  <td style={{ padding: '6px 4px', borderRight: cardBorder, textAlign: 'center' }}>Globale</td>
                  <td style={{ padding: '6px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                  <td style={{ padding: '6px 4px', borderRight: cardBorder, textAlign: 'right', fontWeight: 'bold', color: '#b91c1c' }}>{pay.totalSalarialCharges.toLocaleString()}</td>
                  <td style={{ padding: '6px 4px', borderRight: cardBorder, textAlign: 'right', fontWeight: 'bold', color: '#1e3a8a' }}>{pay.totalPatronalCharges.toLocaleString()}</td>
                </tr>
              )}

              {/* MANUAL ADJUSTMENTS */}
              {agent.absDays > 0 && (
                <tr>
                  <td style={{ padding: '3px 8px', borderLeft: cardBorder, borderRight: cardBorder, color: '#ef4444', fontWeight: 'bold' }}>{renderLabel('Retenues Absences Injustifiées / Sanctions', 'lblAbsences')}</td>
                  <td style={{ padding: '3px 4px', borderRight: cardBorder, textAlign: 'center', color: '#ef4444' }}>{agent.absDays} j</td>
                  <td style={{ padding: '3px 4px', borderRight: cardBorder, textAlign: 'center' }}>—</td>
                  <td style={{ padding: '3px 4px', borderRight: cardBorder, textAlign: 'center' }}>—</td>
                  <td style={{ padding: '3px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                  <td style={{ padding: '3px 4px', borderRight: cardBorder, textAlign: 'right', color: '#ef4444', fontWeight: 'bold' }}>{agent.deductions.toLocaleString()}</td>
                  <td style={{ padding: '3px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                </tr>
              )}
              {agent.acomptes > 0 && (
                <tr>
                  <td style={{ padding: '3px 8px', borderLeft: cardBorder, borderRight: cardBorder, color: '#f59e0b', fontWeight: 'bold' }}>{renderLabel('Remboursement acompte & avance sur salaire', 'lblAcomptes')}</td>
                  <td style={{ padding: '3px 4px', borderRight: cardBorder, textAlign: 'center' }}>—</td>
                  <td style={{ padding: '3px 4px', borderRight: cardBorder, textAlign: 'center' }}>—</td>
                  <td style={{ padding: '3px 4px', borderRight: cardBorder, textAlign: 'center' }}>—</td>
                  <td style={{ padding: '3px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                  <td style={{ padding: '3px 4px', borderRight: cardBorder, textAlign: 'right', color: '#f59e0b', fontWeight: 'bold' }}>{agent.acomptes.toLocaleString()}</td>
                  <td style={{ padding: '3px 4px', borderRight: cardBorder, textAlign: 'right', color: '#94a3b8' }}>—</td>
                </tr>
              )}

              {/* TOTAL DES COTISATIONS ET CONTRIBUTIONS */}
              <tr style={{ background: themeColor, color: 'white', fontWeight: 'bold' }}>
                <td style={{ padding: '5px 8px', borderLeft: cardBorder, borderRight: cardBorder }}>{renderLabel('Total des cotisations et contributions', 'lblTotalCotis')}</td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder }}></td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder }}></td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder }}></td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder, textAlign: 'right', color: '#93c5fd' }}>—</td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder, textAlign: 'right' }}>{renderLabel(pay.totalSalarialCharges.toLocaleString(), 'lblTotalCotisSal', {textAlign: 'right'})}</td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder, textAlign: 'right' }}>{renderLabel(pay.totalPatronalCharges.toLocaleString(), 'lblTotalCotisPat', {textAlign: 'right'})}</td>
              </tr>

              {/* MONTANT NET SOCIAL */}
              <tr style={{ background: netSocialBg, color: '#000000', fontWeight: 'bold' }}>
                <td style={{ padding: '5px 8px', borderLeft: cardBorder, borderRight: cardBorder }}>{renderLabel('MONTANT NET SOCIAL', 'lblMontantNetSoc')}</td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder }}></td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder }}></td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder }}></td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder, textAlign: 'right' }}>{renderLabel(pay.netSocial.toLocaleString(), 'lblMontantNetSocVal', {textAlign: 'right'})}</td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder, textAlign: 'right', color: '#64748b' }}>—</td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder, textAlign: 'right', color: '#64748b' }}>—</td>
              </tr>

              {/* NET A PAYER AVANT IMPOT SUR LE REVENU */}
              <tr style={{ background: netAvantPASBg, color: 'white', fontWeight: 'bold' }}>
                <td style={{ padding: '5px 8px', borderLeft: cardBorder, borderRight: cardBorder }}>{renderLabel('NET A PAYER AVANT IMPÔT SUR LE REVENU', 'lblNetAvantImp')}</td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder }}></td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder }}></td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder }}></td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder, textAlign: 'right' }}>{renderLabel(pay.netAvantImpots.toLocaleString(), 'lblNetAvantImpVal', {textAlign: 'right'})}</td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder, textAlign: 'right', color: '#86efac' }}>—</td>
                <td style={{ padding: '5px 4px', borderRight: cardBorder, textAlign: 'right', color: '#86efac' }}>—</td>
              </tr>
            </tbody>
          </table>
        )}

        {/* 5. Impot sur le Revenu Section */}
        {showPAS && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px', marginBottom: '15px', border: cardBorder }}>
            <thead>
              <tr style={{ background: '#475569', color: 'white' }}>
                <th style={{ padding: '3px 6px', textAlign: 'left', width: '38%' }}>{renderLabel('IMPÔT SUR LE REVENU', 'lblImpotRev')}</th>
                <th style={{ padding: '3px 4px', textAlign: 'center', width: '15%' }}>{renderLabel('Base', 'lblBaseImp', {textAlign: 'center'})}</th>
                <th style={{ padding: '3px 4px', textAlign: 'center', width: '15%' }}>{renderLabel('Taux', 'lblTauxImp', {textAlign: 'center'})}</th>
                <th style={{ padding: '3px 4px', textAlign: 'right', width: '16%' }}>{renderLabel('Montant', 'lblMontantImp', {textAlign: 'right'})}</th>
                <th style={{ padding: '3px 4px', textAlign: 'right', width: '16%' }}>{renderLabel('Cumul Annuel', 'lblCumulAnnuel', {textAlign: 'right'})}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '3px 6px', border: cardBorder }}>{renderLabel('Impôt sur le revenu prélevé à la source (PAS)', 'lblPASLabel')}</td>
                <td style={{ padding: '3px 4px', border: cardBorder, textAlign: 'center' }}>{renderLabel(pay.netImposable.toLocaleString(), 'lblPASBase', {textAlign: 'center'})}</td>
                <td style={{ padding: '3px 4px', border: cardBorder, textAlign: 'center' }}>{renderLabel(pay.pasRate.toFixed(2) + '%', 'lblPASTaux', {textAlign: 'center'})}</td>
                <td style={{ padding: '3px 4px', border: cardBorder, textAlign: 'right', fontWeight: 'bold' }}>{renderLabel(pay.pasAmount.toLocaleString(), 'lblPASMontant', {textAlign: 'right'})}</td>
                <td style={{ padding: '3px 4px', border: cardBorder, textAlign: 'right' }}>{renderLabel((pay.pasAmount * 5).toLocaleString(), 'lblPASCumul', {textAlign: 'right'})}</td>
              </tr>
            </tbody>
          </table>
        )}

        {/* 6. Footer Summary Box and Big Pink Box */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 230px', gap: '20px', alignItems: 'center' }}>
          {/* Detailed metrics box */}
          <div style={{ border: cardBorder, borderRadius: '4px', padding: '6px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '2px 4px', border: cardBorder }}>{renderLabel('Période', 'lblPeriode')}</th>
                  <th style={{ padding: '2px 4px', border: cardBorder }}>{renderLabel('Heures Travaillées', 'lblHeuresTrav')}</th>
                  <th style={{ padding: '2px 4px', border: cardBorder }}>{renderLabel('Salaire Brut', 'lblSalBrut')}</th>
                  <th style={{ padding: '2px 4px', border: cardBorder }}>{renderLabel('Charges Salariales', 'lblChargSal')}</th>
                  <th style={{ padding: '2px 4px', border: cardBorder }}>{renderLabel('Charges Patronales', 'lblChargPat')}</th>
                  <th style={{ padding: '2px 4px', border: cardBorder }}>{renderLabel('Net Imposable', 'lblNetImp')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '3px 4px', border: cardBorder, fontWeight: 'bold' }}>{renderLabel('Mois', 'lblMois')}</td>
                  <td style={{ padding: '3px 4px', border: cardBorder }}>{renderLabel('151,67 h', 'lblMoisHeures', {textAlign: 'center'})}</td>
                  <td style={{ padding: '3px 4px', border: cardBorder }}>{renderLabel(pay.brut.toLocaleString(), 'lblMoisBrut', {textAlign: 'center'})}</td>
                  <td style={{ padding: '3px 4px', border: cardBorder, color: '#ef4444' }}>{renderLabel('-' + pay.totalSalarialCharges.toLocaleString(), 'lblMoisCharSal', {textAlign: 'center'})}</td>
                  <td style={{ padding: '3px 4px', border: cardBorder, color: '#3b82f6' }}>{renderLabel(pay.totalPatronalCharges.toLocaleString(), 'lblMoisCharPat', {textAlign: 'center'})}</td>
                  <td style={{ padding: '3px 4px', border: cardBorder, fontWeight: 'bold' }}>{renderLabel(pay.netImposable.toLocaleString(), 'lblMoisNetImp', {textAlign: 'center'})}</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 4px', border: cardBorder, fontWeight: 'bold' }}>{renderLabel('Cumul', 'lblCumul')}</td>
                  <td style={{ padding: '3px 4px', border: cardBorder }}>{renderLabel('758,35 h', 'lblCumulHeures', {textAlign: 'center'})}</td>
                  <td style={{ padding: '3px 4px', border: cardBorder }}>{renderLabel((pay.brut * 5).toLocaleString(), 'lblCumulBrut', {textAlign: 'center'})}</td>
                  <td style={{ padding: '3px 4px', border: cardBorder, color: '#ef4444' }}>{renderLabel('-' + (pay.totalSalarialCharges * 5).toLocaleString(), 'lblCumulCharSal', {textAlign: 'center'})}</td>
                  <td style={{ padding: '3px 4px', border: cardBorder, color: '#3b82f6' }}>{renderLabel((pay.totalPatronalCharges * 5).toLocaleString(), 'lblCumulCharPat', {textAlign: 'center'})}</td>
                  <td style={{ padding: '3px 4px', border: cardBorder, fontWeight: 'bold' }}>{renderLabel((pay.netImposable * 5).toLocaleString(), 'lblCumulNetImp', {textAlign: 'center'})}</td>
                </tr>
              </tbody>
            </table>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#475569', marginTop: '6px', fontWeight: 'bold' }}>
              <span>{renderLabel('Allégement des cotisations employeur :', 'lblAllegement', {display:'inline'})} 241,00 CFA</span>
              <span>{renderLabel("Total versé par l'employeur :", 'lblTotalVerse', {display:'inline'})} {(pay.brut + pay.totalPatronalCharges).toLocaleString()} CFA</span>
            </div>
          </div>

          {/* Big Pink Net a Payer Box */}
          <div style={{
            border: netAPayerPASBorder,
            borderRadius: '8px',
            padding: '10px',
            textAlign: 'center',
            background: netAPayerPASBg,
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
          }}>
            <InlineInput
              isEditable={isEditable}
              value={badgeTextLabel}
              onChange={(val) => setCustomConfig({...customConfig, customBadgeLabel: val})}
              style={{
                background: themeColor,
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 'bold',
                padding: '3px 6px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                marginBottom: '6px',
                letterSpacing: '0.05em',
                textAlign: 'center'
              }}
            />
            <div style={{
              fontSize: '18px',
              fontWeight: '900',
              color: netAPayerPASText,
              letterSpacing: '-0.02em',
              fontFamily: "'Courier New', Courier, monospace"
            }}>
              {renderLabel(pay.netAPayerPAS.toLocaleString() + ' CFA', 'lblNetAPayerVal', {textAlign: 'center', width: '100%'})}
            </div>
          </div>
        </div>

        {/* 7. Signatures and Stamp Block */}
        {showStampSeal && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px', borderTop: '1px dashed #cbd5e1', paddingTop: '10px', fontSize: '9px', minHeight: '80px' }}>
            <div>
              <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '4px' }}>{renderLabel("Cachet & Signature de l'Employeur :", 'lblCachet')}</div>
              {includeSignature && (
                <div style={{ marginTop: '5px', width: '100px', height: '50px', display: 'flex', alignItems: 'center' }}>
                  {customSignature ? (
                    <img src={customSignature} alt="Custom stamp" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <svg viewBox="0 0 120 70" style={{ width: '100%', height: '100%' }}>
                      <circle cx="60" cy="35" r="28" fill="none" stroke={themeColor} strokeWidth="2" strokeDasharray="3,3" />
                      <text x="60" y="32" fontSize="5" fontWeight="bold" fill={themeColor} textAnchor="middle">POINTAGE PRO</text>
                      <text x="60" y="42" fontSize="5" fontWeight="bold" fill={themeColor} textAnchor="middle">APPROBATION</text>
                      <path d="M 35 45 C 50 15, 60 55, 85 25" fill="none" stroke={themeColor} strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '4px' }}>{renderLabel('Signature du Salarié ("Bon pour accord") :', 'lblSignatureSal')}</div>
            </div>
          </div>
        )}

        {/* 8. Bottom legal line */}
        {showLegalFtr && bottomLegalText && (
          <InlineInput
            isEditable={isEditable}
            multiline={true}
            value={bottomLegalText}
            onChange={(val) => setCustomConfig({...customConfig, footerNotice: val})}
            style={{ textAlign: 'center', fontSize: '8px', color: '#64748b', fontStyle: 'italic', marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="payslip-manager-container" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', overflow: 'hidden', background: '#0f172a', color: '#f8fafc' }}>
      
      {/* Dynamic Printing Style injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Clean up parent layouts without hiding them */
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .app-layout, .main-content, .payslip-manager-container {
            display: block !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            box-shadow: none !important;
          }

          /* Hide all screen-only controls and sidebars */
          .sidebar, .sidebar-overlay, .no-print, header, nav, button, .btn {
            display: none !important;
          }

          /* Show only the print area */
          .print-payslip-canvas {
            display: block !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-slip-card {
            background: #ffffff !important;
            color: #000000 !important;
            border: 1px solid #1e293b !important;
            padding: 2cm 1.5cm 1.5cm 1.5cm !important;
            margin: 0 auto !important;
            width: 21cm !important;
            height: 29.7cm !important; /* Forces A4 Portrait */
            box-sizing: border-box !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }

          /* ECO MODE PRINTING RULES (2 slips per page) */
          ${ecoMode ? `
            .print-slip-card {
              height: 14.85cm !important; /* Halves to A5 stacked */
              padding: 0.8cm 1cm !important;
              page-break-after: auto !important;
            }
            .print-slip-card:nth-child(even) {
              border-top: 2px dashed #94a3b8 !important;
              page-break-after: always !important;
            }
          ` : ''}

          h2, h3, h4, span, div, p, td, th, strong {
            color: #000000 !important;
            text-shadow: none !important;
          }
        }

        /* Screen only styling */
        .print-payslip-canvas {
          display: none;
        }

        .payslip-preview-box-wrapper {
          background: #ffffff;
          padding: 2.5rem;
          border-radius: 20px;
          box-shadow: 0 25px 70px rgba(0,0,0,0.6);
          max-width: 820px;
          margin: 0 auto;
        }
      `}} />

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: '20px', right: '20px', zIndex: 3000,
              background: toast.type === 'error' ? '#ef4444' : '#22c55e',
              color: 'white', padding: '1rem 1.5rem', borderRadius: '12px',
              display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}
          >
            {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span style={{ fontWeight: 600 }}>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem', marginBottom: '2rem' }} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button className="btn" onClick={onClose} style={{ background: '#1e293b', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={18} /> Retour Accueil
          </button>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.6rem', color: '#f8fafc', textShadow: '0 0 10px rgba(52, 211, 153, 0.3)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText style={{ color: '#34d399' }} size={28} /> Impression des Bulletins
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {/* Settings & Templates Icon Button */}
          <button className="btn" onClick={() => setShowSettingsModal(true)} style={{ background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
            <Settings size={20} className="text-emerald-400" /> Configuration & Modèles
          </button>

          <button className="btn btn-primary" onClick={executePrint} style={{ background: '#34d399', color: '#0f172a', border: 'none', borderRadius: '12px', padding: '12px 24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 20px rgba(52, 211, 153, 0.3)' }}>
            <Printer size={20} /> Imprimer les Bulletins ({selectedAgentIds.length})
          </button>
        </div>
      </header>

      {/* Main Workspace grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '30px', flex: 1, overflow: 'hidden' }} className="no-print">
        
        {/* Left pane: Filter & print settings cockpit */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.75rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 12px 0', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtres Généraux</h3>
            
            {/* Period Selector */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>Mois de Paie</label>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CalendarDays size={18} style={{ color: '#34d399' }} />
                <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ background: 'transparent', color: 'white', border: 'none', outline: 'none', cursor: 'pointer', fontWeight: 600, width: '100%' }}>
                  {periods.map(p => <option key={p} value={p} style={{ background: '#1e293b', color: 'white' }}>{p}</option>)}
                </select>
              </div>
            </div>

            {/* Site selector */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>Site Client principal</label>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building size={18} style={{ color: '#3b82f6' }} />
                <select value={selectedSite} onChange={(e) => setSelectedSite(e.target.value)} style={{ background: 'transparent', color: 'white', border: 'none', outline: 'none', cursor: 'pointer', fontWeight: 600, width: '100%' }}>
                  {uniqueSites.map(s => <option key={s} value={s} style={{ background: '#1e293b', color: 'white' }}>{s === 'ALL' ? 'Tous les sites' : s}</option>)}
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>Nom / Rôle Agent</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Rechercher un vigile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }}
                />
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: 0 }} />

          {/* Configuration Impression Section */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px 0', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Options d'Impression</h3>
            
            {/* Eco Mode Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: '#f8fafc' }}><i className="fas fa-leaf" style={{ color: '#22c55e', marginRight: '6px' }}></i> Mode Éco (A5 ✂️)</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>2 bulletins par page A4</span>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                <input type="checkbox" checked={ecoMode} onChange={() => setEcoMode(!ecoMode)} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: ecoMode ? '#22c55e' : '#334155', borderRadius: '24px', transition: '0.3s' }}>
                  <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: ecoMode ? '22px' : '3px', bottom: '3px', background: 'white', borderRadius: '50%', transition: '0.3s' }}></span>
                </span>
              </label>
            </div>

            {/* Digits Signature Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: '#f8fafc' }}><i className="fas fa-signature" style={{ color: '#3b82f6', marginRight: '6px' }}></i> Cachet & Signature</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Incruster automatiquement</span>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                <input type="checkbox" checked={includeSignature} onChange={() => setIncludeSignature(!includeSignature)} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: includeSignature ? '#3b82f6' : '#334155', borderRadius: '24px', transition: '0.3s' }}>
                  <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: includeSignature ? '22px' : '3px', bottom: '3px', background: 'white', borderRadius: '50%', transition: '0.3s' }}></span>
                </span>
              </label>
            </div>

            {/* Signature Upload input */}
            {includeSignature && (
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                  <Upload size={20} style={{ color: '#94a3b8' }} />
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Téléverser un cachet/signature</span>
                  <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Format PNG transparent</span>
                  <input type="file" accept="image/*" onChange={handleSignatureUpload} style={{ display: 'none' }} />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Right pane: list of agents table */}
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* List Toolbar info */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Agents filtrés : <strong>{filteredAgents.length}</strong> / Total : <strong>{agentsData.length}</strong></span>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Cochez les agents dont vous souhaitez éditer ou imprimer la fiche de paie</div>
            </div>
            
            <button className="btn" onClick={handleToggleSelectAll} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              {selectedAgentIds.length === filteredAgents.length ? <CheckSquare size={16} /> : <Square size={16} />}
              {selectedAgentIds.length === filteredAgents.length ? 'Tout décocher' : 'Tout cocher'}
            </button>
          </div>

          {/* Table Container */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2.5rem', color: '#34d399' }}></i>
              </div>
            ) : filteredAgents.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', gap: '10px' }}>
                <AlertCircle size={32} />
                <span>Aucun agent ne correspond aux filtres appliqués</span>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'left', background: 'rgba(255,255,255,0.01)' }}>
                    <th style={{ padding: '15px 20px', width: '40px' }}></th>
                    <th style={{ padding: '15px 20px' }}>Agent</th>
                    <th style={{ padding: '15px 20px' }}>Site Client / Poste</th>
                    <th style={{ padding: '15px 20px', textAlign: 'right' }}>Heures / SP</th>
                    <th style={{ padding: '15px 20px', textAlign: 'right' }}>Dépôts/Absences</th>
                    <th style={{ padding: '15px 20px', textAlign: 'right', color: '#34d399' }}>Net à Payer</th>
                    <th style={{ padding: '15px 20px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map(ag => {
                    const isSelected = selectedAgentIds.includes(ag.id);
                    return (
                      <tr key={ag.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.95rem', background: isSelected ? 'rgba(52, 211, 153, 0.02)' : 'transparent', transition: 'all 0.2s' }}>
                        <td style={{ padding: '16px 20px', cursor: 'pointer' }} onClick={() => handleToggleSelectAgent(ag.id)}>
                          <span style={{ color: isSelected ? '#34d399' : '#475569' }}>
                            {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 600, color: 'white' }}>{ag.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Matricule: {ag.id.substring(0, 6).toUpperCase()}</div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ color: '#cbd5e1' }}>{ag.site}</div>
                          <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600 }}>{ag.function}</div>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div>160 hrs base</div>
                          <div style={{ fontSize: '0.8rem', color: '#34d399' }}>+{ag.spCount} SP</div>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ color: ag.absDays > 0 ? '#ef4444' : '#64748b' }}>{ag.absDays} jours abs</div>
                          <div style={{ fontSize: '0.8rem', color: ag.acomptes > 0 ? '#fbbf24' : '#64748b' }}>{ag.acomptes.toLocaleString()} Acompte</div>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 700, color: '#34d399', fontSize: '1.05rem' }}>
                          {ag.netToPay.toLocaleString()} CFA
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button className="btn" onClick={() => setShowPreviewModal(ag)} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }} title="Aperçu du bulletin">
                              <Eye size={14} /> Aperçu
                            </button>
                            <button className="btn" onClick={() => handleSendNotification(ag)} style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }} title="Envoyer au coffre-fort">
                              <Send size={14} /> Distribute
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* --- PREVIEW BULLETIN MODAL (Interactive PopUp) --- */}
      <AnimatePresence>
        {showPreviewModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} className="no-print">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ width: '100%', maxWidth: '850px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '90vh' }}>
              <div style={{ padding: '1.5rem', background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}><Eye size={20} style={{ color: '#34d399' }} /> Aperçu Fiche de Paie : {showPreviewModal.name}</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-primary" onClick={() => { window.print(); }} style={{ background: '#34d399', color: '#0f172a', border: 'none', padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <Printer size={16} /> Imprimer ce bulletin
                  </button>
                  <button className="btn" onClick={() => setShowPreviewModal(null)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '10px' }}>Fermer</button>
                </div>
              </div>

              {/* Scrollable Preview body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: '#334155' }}>
                <div className="payslip-preview-box-wrapper">
                  {renderFrenchPayslipCard(showPreviewModal, true)}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MAJESTIC FULL-SCREEN CONFIGURATION & SETTINGS COCKPIT --- */}
      <AnimatePresence>
        {showSettingsModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, background: '#0f172a', display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh' }} className="no-print">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
              
              {/* Majestic Full Screen Header */}
              <div style={{ padding: '1.5rem 3rem', background: '#090d16', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Settings size={28} className="text-emerald-400" /> CONFIGURATION & MODÈLES DE PAIE
                  </h3>
                  
                  {/* Tabs Buttons */}
                  <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <button 
                      onClick={() => setActiveSettingsTab('templates')}
                      style={{
                        background: activeSettingsTab === 'templates' ? '#34d399' : 'transparent',
                        color: activeSettingsTab === 'templates' ? '#0f172a' : '#cbd5e1',
                        border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, transition: '0.2s', fontSize: '0.9rem', cursor: 'pointer'
                      }}
                    >
                      Modèles Prédéfinis (50)
                    </button>
                    <button 
                      onClick={() => setActiveSettingsTab('custom_builder')}
                      style={{
                        background: activeSettingsTab === 'custom_builder' ? '#34d399' : 'transparent',
                        color: activeSettingsTab === 'custom_builder' ? '#0f172a' : '#cbd5e1',
                        border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, transition: '0.2s', fontSize: '0.9rem', cursor: 'pointer'
                      }}
                    >
                      🚀 Créateur de Modèle Personnalisé (Interactif)
                    </button>
                  </div>
                </div>

                <button className="btn btn-primary" onClick={handleSaveSettings} style={{ background: '#34d399', color: '#0f172a', border: 'none', padding: '12px 28px', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(52, 211, 153, 0.3)' }}>
                  <CheckCircle2 size={18} /> Enregistrer les réglages & Fermer
                </button>
              </div>

              {/* Full Screen Content Workspace based on active tab */}
              {activeSettingsTab === 'templates' ? (
                /* TAB 1: Grid of 50 models covering the entire space */
                <div style={{ flex: 1, overflowY: 'auto', padding: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', background: '#0f172a' }}>
                  {templatesList.map(tmpl => {
                    const isActive = selectedTemplate === tmpl.id;
                    return (
                      <motion.div 
                        key={tmpl.id}
                        whileHover={{ scale: 1.03, y: -4 }}
                        onClick={() => {
                          setSelectedTemplate(tmpl.id);
                          showToast(`Modèle activé : ${tmpl.name}`, "success");
                          setShowSettingsModal(false);
                        }}
                        style={{
                          background: isActive ? 'rgba(52, 211, 153, 0.04)' : 'rgba(255,255,255,0.01)',
                          border: isActive ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '20px',
                          padding: '1.5rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '180px',
                          transition: 'all 0.2s',
                          boxShadow: isActive ? '0 12px 30px rgba(52,211,153,0.18)' : 'none'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ background: tmpl.primary, color: 'white', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                              {tmpl.layout === 'split' ? 'S' : 'C'}
                            </div>
                            {isActive && (
                              <span style={{ background: '#34d399', color: '#0f172a', padding: '3px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Actif</span>
                            )}
                          </div>

                          <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 700, color: isActive ? '#34d399' : '#f8fafc' }}>{tmpl.name}</h4>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.3' }}>{tmpl.desc}</p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: tmpl.primary }} />
                            <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: tmpl.accent }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.8rem', color: isActive ? '#34d399' : '#64748b', fontWeight: 700 }}>
                            {isActive ? 'Sélectionné' : 'Activer'} <ChevronRight size={14} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                /* TAB 2: Dynamic Custom creator covering 100% split space */
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '480px 1fr', overflow: 'hidden' }}>
                  
                  {/* Left control panel */}
                  <div style={{ padding: '2rem 3rem', borderRight: '1px solid rgba(255,255,255,0.08)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '25px', background: 'rgba(0,0,0,0.15)' }}>
                    
                    {/* Activation button */}
                    <button 
                      onClick={() => {
                        setSelectedTemplate('custom');
                        showToast("Modèle personnalisé activé et chargé !", "success");
                      }}
                      style={{
                        width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                        background: selectedTemplate === 'custom' ? '#34d399' : 'rgba(52, 211, 153, 0.1)',
                        color: selectedTemplate === 'custom' ? '#0f172a' : '#34d399',
                        fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: '0.2s',
                        boxShadow: selectedTemplate === 'custom' ? '0 10px 25px rgba(52, 211, 153, 0.25)' : 'none'
                      }}
                    >
                      <CheckSquare2 size={18} /> {selectedTemplate === 'custom' ? '✨ Modèle Perso Activé !' : '👉 Activer le Modèle Personnalisé'}
                    </button>

                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: 0 }} />

                    {/* Section 1: Colors selection */}
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>1. Couleurs & Palette</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '4px' }}>Primaire</label>
                          <input type="color" value={customConfig.primaryColor} onChange={(e) => setCustomConfig({ ...customConfig, primaryColor: e.target.value })} style={{ width: '100%', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '4px' }}>Secondaire</label>
                          <input type="color" value={customConfig.secondaryColor} onChange={(e) => setCustomConfig({ ...customConfig, secondaryColor: e.target.value })} style={{ width: '100%', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '4px' }}>Bordure Net</label>
                          <input type="color" value={customConfig.accentColor} onChange={(e) => setCustomConfig({ ...customConfig, accentColor: e.target.value })} style={{ width: '100%', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Structure & Typography */}
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>2. Structure & Police</h4>
                      
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '6px' }}>Style de police typographique</label>
                        <select value={customConfig.fontFamily} onChange={(e) => setCustomConfig({ ...customConfig, fontFamily: e.target.value })} style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}>
                          <option value="sans-serif">Outfit (Moderne Sans-Serif)</option>
                          <option value="monospace">Courier (Précision Monospace)</option>
                          <option value="serif">Georgia (Élégant Serif)</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '6px' }}>Mise en page des tableaux</label>
                        <select value={customConfig.layout} onChange={(e) => setCustomConfig({ ...customConfig, layout: e.target.value })} style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}>
                          <option value="standard">Standard Empilé (Modèle Français)</option>
                          <option value="split">Split Gains & Retenues (Anglo-Saxon)</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setCustomConfig({ ...customConfig, doubleBorders: !customConfig.doubleBorders })}>
                        <span style={{ color: customConfig.doubleBorders ? '#34d399' : '#64748b' }}>
                          {customConfig.doubleBorders ? <CheckSquare size={18} /> : <Square size={18} />}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Doubler les bordures de la boîte Net à Payer</span>
                      </div>
                    </div>

                    {/* Section 3: Suppressions */}
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>3. Activer / Désactiver les Éléments</h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                          { label: "Afficher le bloc Employeur", key: "showEmployerInfo" },
                          { label: "Afficher le bloc Salarié", key: "showEmployeeInfo" },
                          { label: "Afficher le suivi de Congés", key: "showVacationGrid" },
                          { label: "Détailler les charges sociales (Rubriques)", key: "showDetailedContributions" },
                          { label: "Afficher le bloc Impôt Source (PAS)", key: "showPASBox" },
                          { label: "Afficher le cachet signature", key: "showEmployerStamp" },
                          { label: "Afficher la mention légale de bas de page", key: "showLegalFooter" }
                        ].map(item => (
                          <div 
                            key={item.key} 
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                            onClick={() => setCustomConfig({ ...customConfig, [item.key]: !customConfig[item.key] })}
                          >
                            <span style={{ color: customConfig[item.key] ? '#34d399' : '#64748b' }}>
                              {customConfig[item.key] ? <CheckSquare size={16} /> : <Square size={16} />}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Direct dynamic inline editable preview */}
                  <div style={{ flex: 1, padding: '3rem', overflowY: 'auto', background: '#1e293b', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ marginBottom: '20px', color: '#cbd5e1', fontSize: '0.9rem', background: '#0f172a', padding: '12px 24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', maxWidth: '650px', lineHeight: '1.4' }}>
                      ⚡ <strong>Aperçu interactif HD :</strong> Vous pouvez éditer les textes (Titre, Infos Employeur, Infos Salarié, Badge Net à Payer, Mentions légales) **directement en écrivant sur le bulletin ci-dessous** ! Vos saisies sont enregistrées en temps réel.
                    </div>
                    
                    <div className="payslip-preview-box-wrapper" style={{ width: '100%', maxWidth: '780px' }}>
                      {renderFrenchPayslipCard(agentsData[0] || { name: "Agent Démonstration", site: "SITE CLIENT A", function: "VIGILE QUALIFIÉ", baseSalary: 80000, brut: 105000, absDays: 0, spCount: 2, spGains: 10000, cnps: 5200, totalDeductions: 7200, netToPay: 97800 }, true)}
                    </div>
                  </div>

                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- COFFRE FORT DISTRIBUTION MODAL --- */}
      <AnimatePresence>
        {notifyingAgent && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '24px', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px' }}>
                  <MessageSquare size={24} style={{ color: '#60a5fa' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Coffre-fort Agent & Distribution</h3>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Notifier {notifyingAgent.name} par SMS/WhatsApp</span>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '16px' }}>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Aperçu du SMS :</strong>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.5', fontFamily: 'monospace' }}>
                  "Bonjour {notifyingAgent.name}, votre bulletin de paie de {new Date(period + '-02').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} est disponible dans votre espace personnel Pointage Pro.<br />
                  Net à payer : {notifyingAgent.netToPay.toLocaleString()} CFA.<br />
                  Lien sécurisé de téléchargement : secure.pointagepro.com/vault/{notifyingAgent.id.substring(0,8)}"
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button className="btn btn-primary" onClick={triggerMockNotification} disabled={isSendingNotification} style={{ flex: 1, background: '#3b82f6', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {isSendingNotification ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin"></i> Chiffrement & Envoi...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Envoyer maintenant
                    </>
                  )}
                </button>
                <button className="btn" onClick={() => setNotifyingAgent(null)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px' }}>
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PRINT ONLY PHYSICAL CANVAS (FOR PAPER GENERATION) --- */}
      <div className="print-payslip-canvas">
        {agentsData.filter(a => selectedAgentIds.includes(a.id)).map(agent => (
          <div key={agent.id} className="print-slip-card">
            {renderFrenchPayslipCard(agent, false)}
          </div>
        ))}
      </div>

    </div>
  );
}
