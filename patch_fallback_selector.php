<?php
$file = 'c:/laragon/www/pontage/frontend/src/hooks/useDashboardActions.jsx';
$content = file_get_contents($file);

$search_targetId = <<<EOT
        const el = document.getElementById(`zone-container-\${targetId}`);
EOT;
$replace_targetId = <<<EOT
        // Fallback: capture the main dashboard area if the specific zone container doesn't have an ID
        let el = document.getElementById(`zone-container-\${targetId}`);
        if (!el) {
            el = document.querySelector('.dashboard-content') || document.querySelector('table') || document.body;
        }
EOT;
$content = str_replace($search_targetId, $replace_targetId, $content);
file_put_contents($file, $content);
echo "useDashboardActions.jsx patched for fallback element\n";
