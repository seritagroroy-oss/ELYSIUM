<?php
$file = 'c:/laragon/www/pontage/frontend/src/hooks/useDashboardActions.jsx';
$content = file_get_contents($file);

// 1. Add html2canvas import if missing
if (strpos($content, 'import html2canvas') === false) {
    $content = str_replace("import { apiCall } from '../api';", "import { apiCall } from '../api';\nimport html2canvas from 'html2canvas';", $content);
}

// 2. Patch confirmDeleteAgent
$search_delete_agent = <<<EOT
    // 1. On ferme la modale immédiatement
    setDeleteAgentConfirm(null);

    // 2. Optimistic update: on retire l'agent de l'écran tout de suite
EOT;
$replace_delete_agent = <<<EOT
    // 0. Capture snapshot BEFORE removing from DOM
    let screenshotData = null;
    try {
        const el = document.getElementById(`agent-row-\${agentId}`);
        if (el) {
            const canvas = await html2canvas(el, { backgroundColor: '#0f172a' });
            screenshotData = canvas.toDataURL('image/png');
        }
    } catch(err) {
        console.error("Screenshot failed", err);
    }

    // 1. On ferme la modale immédiatement
    setDeleteAgentConfirm(null);

    // 2. Optimistic update: on retire l'agent de l'écran tout de suite
EOT;
$content = str_replace(str_replace("\r\n", "\n", $search_delete_agent), $replace_delete_agent, $content);

$search_api_delete_agent = <<<EOT
      const res = await apiCall('delete_agent', { 
          agent_id: agentId, 
          delete_all_sites: deleteAllSites,
          name: agentName 
      });
EOT;
$replace_api_delete_agent = <<<EOT
      const res = await apiCall('delete_agent', { 
          agent_id: agentId, 
          delete_all_sites: deleteAllSites,
          name: agentName,
          screenshot: screenshotData
      });
EOT;
$content = str_replace(str_replace("\r\n", "\n", $search_api_delete_agent), $replace_api_delete_agent, $content);


// 3. Patch executeDeleteSubsite
$search_delete_subsite = <<<EOT
    // Fermeture immédiate de la modale
    setDeleteZoneConfirmId(null);
    
    // Utilisation d'un court délai pour laisser le navigateur effacer la modale de l'écran
    setTimeout(() => {
      // Mise à jour optimiste : on retire la zone du tableau de bord
EOT;
$replace_delete_subsite = <<<EOT
    let screenshotData = null;
    try {
        const el = document.getElementById(`zone-container-\${targetId}`);
        if (el) {
            const canvas = await html2canvas(el, { backgroundColor: '#0f172a' });
            screenshotData = canvas.toDataURL('image/png');
        }
    } catch(err) {
        console.error("Screenshot failed", err);
    }

    // Fermeture immédiate de la modale
    setDeleteZoneConfirmId(null);
    
    // Utilisation d'un court délai pour laisser le navigateur effacer la modale de l'écran
    setTimeout(() => {
      // Mise à jour optimiste : on retire la zone du tableau de bord
EOT;
$content = str_replace(str_replace("\r\n", "\n", $search_delete_subsite), $replace_delete_subsite, $content);

$search_api_delete_subsite = "apiCall('delete_subsite', { subsite_id: targetId }).then(res => {";
$replace_api_delete_subsite = "apiCall('delete_subsite', { subsite_id: targetId, screenshot: screenshotData }).then(res => {";
$content = str_replace($search_api_delete_subsite, $replace_api_delete_subsite, $content);

file_put_contents($file, $content);
echo "useDashboardActions.jsx patched\n";
