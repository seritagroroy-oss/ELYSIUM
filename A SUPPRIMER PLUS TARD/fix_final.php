<?php
$filePath = __DIR__ . '/frontend/src/components/Dashboard.jsx';
$lines = file($filePath);

$startIdx = 4532 - 1;
$endIdx = 4569 - 1;

$replacement = [
    "        {/* Modal Première Connexion */}\n",
    "        <FirstVisitModal\n",
    "          showFirstVisitModal={showFirstVisitModal}\n",
    "          period={period}\n",
    "          getSafePeriod={getSafePeriod}\n",
    "          handleFirstVisitNon={handleFirstVisitNon}\n",
    "          handleFirstVisitOui={handleFirstVisitOui}\n",
    "        />\n",
    "\n",
    "        {/* CONTEXT MENU SITE */}\n",
    "        {siteContextMenu.visible && (\n",
    "          <div\n",
    "            style={{\n",
    "              position: 'fixed',\n",
    "              left: siteContextMenu.x,\n",
    "              top: siteContextMenu.y,\n",
    "              background: 'rgba(15, 23, 42, 0.95)',\n",
    "              backdropFilter: 'blur(10px)',\n",
    "              border: '1px solid rgba(255,255,255,0.1)',\n",
    "              borderRadius: '8px',\n",
    "              padding: '4px',\n",
    "              zIndex: 9999,\n",
    "              minWidth: '150px',\n",
    "              boxShadow: '0 10px 25px rgba(0,0,0,0.5)'\n",
    "            }}\n",
    "            onMouseLeave={() => setSiteContextMenu({ ...siteContextMenu, visible: false })}\n",
    "          >\n",
    "            <div style={{ padding: '8px', fontSize: '0.8rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '4px' }}>\n",
    "              Site: {siteContextMenu.siteName}\n",
    "            </div>\n",
    "            <button\n",
    "              className=\"btn\"\n",
    "              style={{ textAlign: 'left', padding: '8px 12px', width: '100%', background: 'transparent', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}\n",
    "              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}\n",
    "              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}\n",
    "              onClick={() => {\n",
    "                setRenameModalData({ siteId: siteContextMenu.siteId, currentName: siteContextMenu.siteName });\n",
    "                setSiteContextMenu({ ...siteContextMenu, visible: false });\n",
    "              }}\n",
    "            >\n",
    "              <Edit size={14} /> Renommer\n",
    "            </button>\n",
    "            <button\n",
    "              className=\"btn\"\n",
    "              style={{ textAlign: 'left', padding: '8px 12px', width: '100%', background: 'transparent', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}\n",
    "              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}\n",
    "              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}\n",
    "              onClick={() => {\n",
    "                setShowDeleteSiteModal(true);\n",
    "                setSiteContextMenu({ ...siteContextMenu, visible: false });\n",
    "              }}\n",
    "            >\n",
    "              <Trash size={14} /> Supprimer\n",
    "            </button>\n",
    "          </div>\n",
    "        )}\n"
];

array_splice($lines, $startIdx, $endIdx - $startIdx + 1, $replacement);
file_put_contents($filePath, implode("", $lines));
echo "Successfully repaired Dashboard.jsx around line 4532-4569!";
?>
