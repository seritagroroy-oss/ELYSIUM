<?php
$file = 'c:/laragon/www/pontage/frontend/src/components/BlacklistModal.jsx';
$content = file_get_contents($file);

$search_modal = <<<EOT
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', padding: '20px', borderRadius: '12px', maxHeight: '80vh', overflowY: 'auto' }}>
EOT;

$replace_modal = <<<EOT
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '95%', maxWidth: (typeof selectedSnapshot.data === 'string' && selectedSnapshot.data.startsWith('uploads/snapshots')) ? '1400px' : '600px', padding: '20px', borderRadius: '12px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
EOT;
$content = str_replace(str_replace("\r\n", "\n", $search_modal), $replace_modal, $content);

$search_json = <<<EOT
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center' }}>
              {typeof selectedSnapshot.data === 'string' && selectedSnapshot.data.startsWith('uploads/snapshots') ? (
                <img src={"/" + selectedSnapshot.data} alt="Snapshot" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '6px' }} />
              ) : (
                <pre style={{ margin: 0, color: '#a78bfa', fontSize: '0.85rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {JSON.stringify(selectedSnapshot.data, null, 2)}
                </pre>
              )}
            </div>
EOT;

$replace_json = <<<EOT
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', flex: 1, overflow: 'auto', display: 'flex', justifyContent: typeof selectedSnapshot.data === 'string' && selectedSnapshot.data.startsWith('uploads/snapshots') ? 'flex-start' : 'center' }}>
              {typeof selectedSnapshot.data === 'string' && selectedSnapshot.data.startsWith('uploads/snapshots') ? (
                <img src={"/" + selectedSnapshot.data} alt="Snapshot" style={{ objectFit: 'contain', borderRadius: '6px', maxHeight: '100%' }} />
              ) : (
                <pre style={{ margin: 0, color: '#a78bfa', fontSize: '0.85rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {JSON.stringify(selectedSnapshot.data, null, 2)}
                </pre>
              )}
            </div>
EOT;
$content = str_replace(str_replace("\r\n", "\n", $search_json), $replace_json, $content);

file_put_contents($file, $content);
echo "BlacklistModal.jsx updated for full width\n";
