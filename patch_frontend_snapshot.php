<?php
$file = 'c:/laragon/www/pontage/frontend/src/components/BlacklistModal.jsx';
$content = file_get_contents($file);

// 1. Add Eye to imports
$search1 = "import { X, Search, ShieldAlert, ShieldCheck, MapPinOff, Calendar } from 'lucide-react';";
$replace1 = "import { X, Search, ShieldAlert, ShieldCheck, MapPinOff, Calendar, Eye } from 'lucide-react';";
$content = str_replace($search1, $replace1, $content);

// 2. Add selectedSnapshot state
$search2 = "const [searchTerm, setSearchTerm] = useState('');";
$replace2 = "const [searchTerm, setSearchTerm] = useState('');\n  const [selectedSnapshot, setSelectedSnapshot] = useState(null);";
$content = str_replace($search2, $replace2, $content);

// 3. Add button in logs
$search3 = <<<EOT
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                          Par: {log.user} | Période: {log.period}
                        </div>
                      </div>
                    </div>
EOT;
$replace3 = <<<EOT
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                          Par: {log.user} | Période: {log.period}
                        </div>
                      </div>
                      {log.snapshot_data && (
                        <button 
                          onClick={() => setSelectedSnapshot({ type: log.action_type, data: JSON.parse(log.snapshot_data) })}
                          style={{
                            background: 'rgba(139, 92, 246, 0.2)',
                            border: '1px solid rgba(139, 92, 246, 0.4)',
                            color: '#c4b5fd',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.85rem'
                          }}
                        >
                          <Eye size={14} /> Voir l'état
                        </button>
                      )}
                    </div>
EOT;
$content = str_replace(str_replace("\r\n", "\n", $search3), $replace3, str_replace("\r\n", "\n", $content));

// 4. Add the modal at the end before final closing div
$search4 = <<<EOT
        </div>
      </div>
    </div>
  );
};

export default BlacklistModal;
EOT;

$replace4 = <<<EOT
        </div>
      </div>

      {selectedSnapshot && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', padding: '20px', borderRadius: '12px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#c4b5fd', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={20} /> État avant suppression
              </h3>
              <button onClick={() => setSelectedSnapshot(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <pre style={{ margin: 0, color: '#a78bfa', fontSize: '0.85rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                {JSON.stringify(selectedSnapshot.data, null, 2)}
              </pre>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default BlacklistModal;
EOT;
$content = str_replace(str_replace("\r\n", "\n", $search4), $replace4, $content);

file_put_contents($file, $content);
echo "BlacklistModal patched\n";
