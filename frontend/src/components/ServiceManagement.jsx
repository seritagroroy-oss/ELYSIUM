import React, { useState, useEffect } from 'react';
import { apiCall } from '../api';
import { ShieldAlert, Plus, Users, Loader2, KeyRound, CheckCircle2, Pencil, X } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function ServiceManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [role, setRole] = useState('user');
  const [companies, setCompanies] = useState([]);
  const [permissions, setPermissions] = useState({
    dashboard: true,
    verification: true,
    payroll: true,
    kiosk: true,
    salaries: true,
    fluctuation: true,
    archives: true,
    communication: true,
    services: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  // Edit user state
  const [editingUser, setEditingUser] = useState(null);
  const [editPerms, setEditPerms] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiCall('get_all_users', {}, 'GET');
      if (res.success && res.users) {
        setUsers(res.users);
      }
      if (user?.role === 'super_admin') {
        const compRes = await apiCall('get_all_companies', {}, 'GET');
        if (compRes.success && compRes.companies) {
          setCompanies(compRes.companies);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'super_admin' || user?.role === 'admin') {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    setSuccess(false);

    try {
      const selectedPermissions = Object.keys(permissions).filter(k => permissions[k]);
      
      const res = await apiCall('admin_create_account', {
        email,
        password,
        name,
        service_name: serviceName,
        role,
        permissions: selectedPermissions
      });

      if (res.success) {
        setSuccess(true);
        setMessage(res.message);
        setEmail('');
        setPassword('');
        setName('');
        setServiceName('');
        setRole('user');
        setPermissions({ dashboard: true, verification: true, payroll: true, kiosk: true, salaries: true, fluctuation: true, archives: true, communication: true, services: false });
        fetchUsers();
      } else {
        setMessage(res.message || 'Erreur lors de la création');
      }
    } catch (e) {
      setMessage('Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to check if the user has the services permission
  const hasServicesPermission = user?.role === 'super_admin' || 
    (Array.isArray(user?.permissions) ? user.permissions.includes('services') : 
    (user?.permissions ? Object.values(user.permissions).includes('services') || !!user.permissions['services'] : false));

  if (!hasServicesPermission) {
    return (
      <div className="alert alert-danger" style={{ margin: '20px' }}>
        Accès refusé. Vous n'avez pas les droits pour gérer les services.
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="top-bar glass-panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={28} style={{ color: '#38bdf8' }} />
          <div>
            <h2 style={{ fontSize: '1.4rem', margin: 0, color: 'white' }}>Gestion des Services et Espaces de Travail</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '4px 0 0 0' }}>
              Interface d'administration pour la gestion Multi-Tenant (création de comptes pour les autres services).
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* Colonne de gauche : Formulaire de création */}
        <div className="glass-panel" style={{ alignSelf: 'start' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} style={{ color: 'var(--b)' }} />
            Créer un nouveau compte
          </h3>

          {message && (
            <div className={`alert ${success ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '20px' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Nom Complet</label>
              <input 
                type="text" 
                className="form-input" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                placeholder="Ex: Jean Dupont"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email (Identifiant)</label>
              <input 
                type="email" 
                className="form-input" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="jean.dupont@entreprise.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mot de passe provisoire</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  style={{ paddingLeft: '36px' }}
                  placeholder="Mot de passe sécurisé"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nom du Service (Espace de travail)</label>
              <input 
                type="text" 
                className="form-input" 
                value={serviceName} 
                onChange={e => setServiceName(e.target.value)} 
                required 
                placeholder="Ex: Ressources Humaines, Exploitation..."
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                Si le service n'existe pas, un nouvel espace de travail cloisonné sera automatiquement créé.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Niveau de Privilège (Rôle)</label>
              <select 
                className="form-input" 
                value={role} 
                onChange={e => setRole(e.target.value)}
              >
                <option value="user">Agent (Employé standard)</option>
                <option value="admin">Propriétaire (Admin de l'entreprise)</option>
                {user?.role === 'super_admin' && (
                  <option value="super_admin">Directeur Général (Super Admin global)</option>
                )}
              </select>
            </div>

            {/* Checkboxes pour les permissions */}
            <div className="form-group" style={{ background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <label className="form-label" style={{ marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                Autorisations d'accès (Modules)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {Object.keys(permissions).map((key) => {
                  const labels = {
                    dashboard: "Plannings & Pointage",
                    verification: "Traitement du pointage",
                    payroll: "État de Paie",
                    kiosk: "Mode Kiosque",
                    salaries: "Calcul Salaires",
                    fluctuation: "Fluctuation Salariale",
                    archives: "Archives Rapports",
                    communication: "Chat & Tickets",
                    services: "Gestion des Services"
                  };
                  return (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text)' }}>
                      <input 
                        type="checkbox" 
                        checked={permissions[key]} 
                        onChange={(e) => setPermissions(prev => ({ ...prev, [key]: e.target.checked }))}
                        style={{ width: '16px', height: '16px', accentColor: '#38bdf8' }}
                      />
                      {labels[key]}
                    </label>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '10px', padding: '12px' }}>
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              <span>{submitting ? 'Création en cours...' : 'Créer le compte'}</span>
            </button>
          </form>
        </div>

        {/* Colonne de droite : Liste des utilisateurs existants */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} style={{ color: 'var(--b)' }} />
            Comptes Existants
          </h3>
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader2 className="animate-spin" size={32} style={{ color: 'var(--b)' }} />
            </div>
          ) : (user?.role !== 'super_admin' && user?.role !== 'admin') ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
              Seul le Propriétaire ou le Directeur Général peut visualiser la liste complète des comptes.
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--muted)' }}>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Utilisateur</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Service (Workspace)</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Rôle</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                        Aucun utilisateur trouvé
                      </td>
                    </tr>
                  ) : (
                    users.map((u, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}>
                        <td style={{ padding: '12px 8px', fontWeight: 500, color: 'white' }}>{u.name}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--muted)' }}>{u.email}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ 
                            background: 'rgba(56, 189, 248, 0.1)', 
                            color: '#38bdf8', 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '0.8rem',
                            fontWeight: 600 
                          }}>
                            {u.service}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ 
                            background: u.role === 'super_admin' ? 'rgba(244, 63, 94, 0.1)' : u.role === 'admin' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(255,255,255,0.05)', 
                            color: u.role === 'super_admin' ? '#f43f5e' : u.role === 'admin' ? '#f97316' : 'var(--text)', 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '0.8rem' 
                          }}>
                            {u.role_display_name || u.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <button 
                            onClick={() => {
                              setEditingUser(u);
                              // Build permission state from user data
                              const allMods = ['dashboard','verification','payroll','kiosk','salaries','fluctuation','archives','communication','services'];
                              const p = {};
                              allMods.forEach(m => {
                                if (Array.isArray(u.permissions)) {
                                  p[m] = u.permissions.includes(m);
                                } else if (u.permissions && typeof u.permissions === 'object') {
                                  p[m] = !!u.permissions[m] || Object.values(u.permissions).includes(m);
                                } else {
                                  p[m] = false;
                                }
                              });
                              setEditPerms(p);
                            }}
                            style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 600 }}
                          >
                            <Pencil size={14} /> Modifier
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {user?.role === 'super_admin' && (
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} style={{ color: 'var(--b)' }} />
                Entreprises Enregistrées (Plateforme SaaS)
              </h3>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--muted)' }}>
                      <th style={{ padding: '12px 8px', fontWeight: 600 }}>Nom Entreprise</th>
                      <th style={{ padding: '12px 8px', fontWeight: 600 }}>Propriétaire (Email)</th>
                      <th style={{ padding: '12px 8px', fontWeight: 600 }}>Date Inscription</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>Aucune entreprise trouvée</td>
                      </tr>
                    ) : (
                      companies.map((c, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '12px 8px', fontWeight: 500, color: 'white' }}>{c.name}</td>
                          <td style={{ padding: '12px 8px', color: 'var(--muted)' }}>{c.owner_email}</td>
                          <td style={{ padding: '12px 8px' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Modal Modifier Permissions */}
      {editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Modifier les permissions</h3>
              <button onClick={() => setEditingUser(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(56,189,248,0.1)', borderRadius: '8px', fontSize: '0.9rem' }}>
              <b>{editingUser.name}</b> ({editingUser.email})<br />
              <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Service : {editingUser.service} | Rôle : {editingUser.role_display_name || editingUser.role}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {Object.keys(editPerms).map((key) => {
                const labels = {
                  dashboard: "Plannings & Pointage",
                  verification: "Traitement du pointage",
                  payroll: "État de Paie",
                  kiosk: "Mode Kiosque",
                  salaries: "Calcul Salaires",
                  fluctuation: "Fluctuation Salariale",
                  archives: "Archives Rapports",
                  communication: "Chat & Tickets",
                  services: "Gestion des Services"
                };
                return (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input 
                      type="checkbox" 
                      checked={editPerms[key]} 
                      onChange={(e) => setEditPerms(prev => ({ ...prev, [key]: e.target.checked }))}
                      style={{ width: '16px', height: '16px', accentColor: '#38bdf8' }}
                    />
                    {labels[key] || key}
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn" onClick={() => setEditingUser(null)} style={{ background: 'transparent', border: '1px solid var(--border)' }}>
                Annuler
              </button>
              <button 
                className="btn btn-primary" 
                disabled={editSaving}
                onClick={async () => {
                  setEditSaving(true);
                  try {
                    const selectedPerms = Object.keys(editPerms).filter(k => editPerms[k]);
                    const res = await apiCall('update_user_permissions', {
                      email: editingUser.email,
                      permissions: selectedPerms
                    });
                    if (res.success) {
                      setEditingUser(null);
                      fetchUsers();
                    } else {
                      alert(res.message || 'Erreur');
                    }
                  } catch (e) {
                    alert('Erreur réseau');
                  } finally {
                    setEditSaving(false);
                  }
                }}
              >
                {editSaving ? <Loader2 className="animate-spin" size={18} /> : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
