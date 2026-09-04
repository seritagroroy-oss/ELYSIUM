<?php
$file = 'c:/laragon/www/pontage/frontend/src/hooks/useDashboardActions.jsx';
$content = file_get_contents($file);

$search_screenshot = <<<EOT
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
EOT;

$replace_screenshot = <<<EOT
    // 0. Capture snapshot BEFORE removing from DOM (incluant les dates de l'en-tête)
    let screenshotData = null;
    try {
        const el = document.getElementById(`agent-row-\${agentId}`);
        if (el) {
            const table = el.closest('table');
            const thead = table ? table.querySelector('thead') : null;
            
            if (thead) {
                // Créer un conteneur temporaire hors écran
                const tempDiv = document.createElement('div');
                tempDiv.style.position = 'absolute';
                tempDiv.style.left = '-9999px';
                tempDiv.style.top = '0';
                tempDiv.style.width = 'max-content';
                tempDiv.style.background = '#0b1220';
                tempDiv.style.padding = '10px';
                tempDiv.style.borderRadius = '8px';
                
                const wrapper = document.createElement('table');
                wrapper.style.borderCollapse = 'collapse';
                wrapper.style.width = 'max-content';
                wrapper.style.color = '#fff';
                wrapper.style.fontFamily = 'Inter, sans-serif'; // Assuming standard font
                
                // Clone de l'en-tête et suppression du position sticky pour éviter les bugs html2canvas
                const clonedThead = thead.cloneNode(true);
                clonedThead.querySelectorAll('th').forEach(th => {
                    th.style.position = 'static';
                });
                wrapper.appendChild(clonedThead);
                
                // Clone du corps avec l'agent
                const tbody = document.createElement('tbody');
                const clonedAgentRow = el.cloneNode(true);
                clonedAgentRow.querySelectorAll('td').forEach(td => {
                    td.style.position = 'static';
                });
                tbody.appendChild(clonedAgentRow);
                wrapper.appendChild(tbody);
                
                tempDiv.appendChild(wrapper);
                document.body.appendChild(tempDiv);
                
                const canvas = await html2canvas(tempDiv, { 
                    backgroundColor: '#0f172a',
                    scale: 2, // Pour une meilleure résolution (évite que ce soit trop petit/flou)
                    windowWidth: tempDiv.scrollWidth,
                    windowHeight: tempDiv.scrollHeight
                });
                screenshotData = canvas.toDataURL('image/png');
                
                document.body.removeChild(tempDiv);
            } else {
                // Fallback normal
                const canvas = await html2canvas(el, { backgroundColor: '#0f172a', scale: 2 });
                screenshotData = canvas.toDataURL('image/png');
            }
        }
    } catch(err) {
        console.error("Screenshot failed", err);
    }
EOT;

$content = str_replace(str_replace("\r\n", "\n", $search_screenshot), $replace_screenshot, $content);
file_put_contents($file, $content);
echo "useDashboardActions.jsx updated with header logic\n";
