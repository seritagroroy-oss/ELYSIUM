import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

const AutocompleteDeclarantInput = ({ label, field, placeholder, required, formData, onChange, radioSignatures }) => {
  const [query, setQuery] = useState(formData[field] || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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

  const handleSelect = (sig) => {
    setQuery(sig.nom);
    setShowDropdown(false);
    
    onChange(field, sig.nom || '');
    onChange('declarant_prenom', sig.prenom || '');
    onChange('declarant_matricule', sig.matricule || '');
    onChange('declarant_fonction', sig.fonction || '');
    onChange('declarant_service', sig.service || '');
  };

  const filteredOptions = query 
    ? radioSignatures.filter(s => (s.nom && s.nom.toLowerCase().includes(query.toLowerCase())) || (s.code && s.code.toLowerCase().includes(query.toLowerCase())))
    : radioSignatures;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }} ref={dropdownRef}>
      <label style={{ color: 'white', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </label>
      
      <div style={{ position: 'relative' }}>
        <input 
          required={required} 
          type="text" 
          placeholder={placeholder} 
          value={query} 
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
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
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          onMouseEnter={e => e.target.style.borderColor = '#38bdf8'}
        />
        <Search size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
      </div>

      {showDropdown && filteredOptions.length > 0 && (
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
          {filteredOptions.map((sig, i) => (
            <div 
              key={sig.code || i}
              onClick={() => handleSelect(sig)}
              style={{
                padding: '12px 16px',
                borderBottom: i === filteredOptions.length - 1 ? 'none' : '1px solid #f1f5f9',
                cursor: 'pointer',
                transition: 'background 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              <div style={{ fontWeight: 'bold', color: '#0f172a' }}>
                {sig.nom} {sig.prenom} 
                <span style={{ fontWeight: 'normal', color: '#64748b', fontSize: '0.9em', marginLeft: '8px' }}>({sig.code})</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '8px' }}>
                {sig.matricule && <span>Matricule: {sig.matricule}</span>}
                {sig.fonction && <span>• {sig.fonction}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutocompleteDeclarantInput;
