import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { apiCall } from '../api';

const AutocompleteAgentInput = ({ label, field, placeholder, required, formData, onChange, moisConcerne }) => {
  const [query, setQuery] = useState(formData[field] || '');
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch agents whenever moisConcerne changes (or on mount with default)
  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);
      try {
        const res = await apiCall('get_pointage_agents_for_reclamation', { period: moisConcerne || '' }, 'GET');
        if (res.success && res.agents) {
          setAgents(res.agents);
          setHasFetched(true);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des agents", err);
      }
      setLoading(false);
    };

    fetchAgents();
  }, [moisConcerne]);

  // Sync internal state with formData if it changes externally
  useEffect(() => {
    if (formData[field] !== query && !showDropdown) {
      setQuery(formData[field] || '');
    }
  }, [formData[field]]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(field, val);
    setShowDropdown(true);
  };

  const handleSelectAgent = (agent) => {
    setQuery(agent.nom);
    setShowDropdown(false);
    
    // Autofill fields
    onChange(field, agent.nom);
    onChange('agent_matricule', agent.matricule || '');
    onChange('agent_site', agent.site || '');
    onChange('agent_fonction', agent.fonction || '');
  };

  const filteredAgents = query 
    ? agents.filter(a => a.nom.toLowerCase().includes(query.toLowerCase()))
    : agents;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2', position: 'relative' }} ref={dropdownRef}>
      <label style={{ color: 'white', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
        {loading && <Loader2 size={12} className="animate-spin" style={{ marginLeft: '8px', display: 'inline-block' }} />}
      </label>
      
      <div style={{ position: 'relative' }}>
        <input 
          required={required} 
          type="text" 
          placeholder={placeholder} 
          value={query} 
          onChange={handleInputChange}
          onFocus={() => { if (hasFetched) setShowDropdown(true); }}
          style={{ 
            width: '100%',
            padding: '14px', 
            paddingRight: '40px',
            borderRadius: '10px', 
            border: '1px solid rgba(255,255,255,0.1)', 
            background: 'white', 
            color: '#1e293b', 
            fontSize: '1.05rem', 
            outline: 'none', 
            transition: 'all 0.2s' 
          }} 
          onBlur={e => {
             e.target.style.borderColor = 'rgba(255,255,255,0.1)';
             // Important: Don't hide dropdown immediately on blur, otherwise clicks on suggestions won't register.
             // Rely on mousedown outside to hide it.
          }}
          onMouseEnter={e => e.target.style.borderColor = '#38bdf8'}
        />
        <Search size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
      </div>

      {showDropdown && filteredAgents.length > 0 && (
        <div style={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          right: 0, 
          marginTop: '4px',
          background: 'white', 
          borderRadius: '10px', 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          maxHeight: '250px',
          overflowY: 'auto',
          zIndex: 99999,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {filteredAgents.slice(0, 20).map((agent, i) => (
            <div 
              key={i}
              onClick={() => handleSelectAgent(agent)}
              style={{
                padding: '12px 16px',
                borderBottom: i === filteredAgents.slice(0, 20).length - 1 ? 'none' : '1px solid #f1f5f9',
                cursor: 'pointer',
                transition: 'background 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{agent.nom}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '8px' }}>
                {agent.matricule && <span>Matricule: {agent.matricule}</span>}
                {agent.site && <span>• {agent.site}</span>}
              </div>
            </div>
          ))}
          {filteredAgents.length > 20 && (
            <div style={{ padding: '10px', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', background: '#f8fafc' }}>
              + {filteredAgents.length - 20} autres (affinez la recherche)
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutocompleteAgentInput;
