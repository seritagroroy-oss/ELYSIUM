<?php
$file_sites = 'c:/laragon/www/pontage/backend/modules/sites_v2.php';
$content_sites = file_get_contents($file_sites);

// The previous replace was:
$search_old = <<<EOT
        \$subsite_id = \$data['subsite_id'] ?? '';
        \$site_name_to_log = \$subsite_id;
        if (\$subsite_id) {
            \$stmt = getDb()->prepare("SELECT name FROM subsites WHERE id = ?");
            \$stmt->execute([\$subsite_id]);
            \$res = \$stmt->fetch();
            if (\$res && !empty(\$res['name'])) \$site_name_to_log = \$res['name'];
        }
EOT;

$replace_new = <<<EOT
        \$subsite_id = \$data['subsite_id'] ?? '';
        \$site_name_to_log = \$subsite_id;
        if (\$subsite_id) {
            // Récupère à la fois le nom de la zone et le nom du site parent
            \$stmt = getDb()->prepare("SELECT sub.name as subsite_name, s.name as site_name FROM subsites sub LEFT JOIN sites s ON sub.site_id = s.id WHERE sub.id = ?");
            \$stmt->execute([\$subsite_id]);
            \$res = \$stmt->fetch();
            if (\$res) {
                \$parent_name = !empty(\$res['site_name']) ? \$res['site_name'] : '';
                \$zone_name = !empty(\$res['subsite_name']) ? \$res['subsite_name'] : '';
                
                if (\$parent_name && \$zone_name) {
                    \$site_name_to_log = \$parent_name . ' / ' . \$zone_name;
                } elseif (\$zone_name) {
                    \$site_name_to_log = \$zone_name;
                }
            }
        }
EOT;

$content_sites = str_replace(str_replace("\r\n", "\n", $search_old), $replace_new, str_replace("\r\n", "\n", $content_sites));
file_put_contents($file_sites, $content_sites);
echo "Backend sites_v2 patched for parent/zone\n";

$file_frontend = 'c:/laragon/www/pontage/frontend/src/components/BlacklistModal.jsx';
$content_frontend = file_get_contents($file_frontend);

$search_frontend = <<<EOT
                        <div style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '4px' }}>
                          {log.details}
                        </div>
EOT;

$replace_frontend = <<<EOT
                        <div style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '4px' }}>
                          {(() => {
                            if (log.action_type === 'DELETE_SUBSITE' && log.details.includes(' / ')) {
                              const parts = log.details.split(' / ');
                              const zone = parts.pop();
                              const parent = parts.join(' / ');
                              return (
                                <>
                                  {parent} / <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{zone}</span>
                                </>
                              );
                            }
                            return log.details;
                          })()}
                        </div>
EOT;

$content_frontend = str_replace(str_replace("\r\n", "\n", $search_frontend), $replace_frontend, str_replace("\r\n", "\n", $content_frontend));
file_put_contents($file_frontend, $content_frontend);
echo "Frontend patched\n";
