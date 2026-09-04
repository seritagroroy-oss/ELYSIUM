<?php
$file = 'c:/laragon/www/pontage/frontend/src/components/BlacklistModal.jsx';
$content = file_get_contents($file);

$search_json = <<<EOT
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <pre style={{ margin: 0, color: '#a78bfa', fontSize: '0.85rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                {JSON.stringify(selectedSnapshot.data, null, 2)}
              </pre>
            </div>
EOT;

$replace_json = <<<EOT
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

// Wait, the previous logic parsed JSON: setSelectedSnapshot({ type: log.action_type, data: JSON.parse(log.snapshot_data) })
// But if it's a file path, JSON.parse will fail!
$search_button = <<<EOT
                        <button 
                          onClick={() => setSelectedSnapshot({ type: log.action_type, data: JSON.parse(log.snapshot_data) })}
EOT;
$replace_button = <<<EOT
                        <button 
                          onClick={() => {
                            let parsedData = log.snapshot_data;
                            try {
                               if (log.snapshot_data.startsWith('{') || log.snapshot_data.startsWith('[')) {
                                  parsedData = JSON.parse(log.snapshot_data);
                               }
                            } catch(e) {}
                            setSelectedSnapshot({ type: log.action_type, data: parsedData });
                          }}
EOT;

$content = str_replace(str_replace("\r\n", "\n", $search_json), $replace_json, $content);
$content = str_replace(str_replace("\r\n", "\n", $search_button), $replace_button, $content);

file_put_contents($file, $content);
echo "BlacklistModal.jsx patched\n";
