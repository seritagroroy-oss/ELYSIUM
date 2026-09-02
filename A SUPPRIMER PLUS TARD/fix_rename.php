<?php
$filePath = __DIR__ . '/frontend/src/components/Dashboard.jsx';
$lines = file($filePath);

// 1. Remove states
$stateIdx1 = 492 - 1;
$stateIdx2 = 493 - 1; // renameSiteName
// Assuming they are exactly these lines
if (strpos($lines[$stateIdx1], 'showRenameSiteModal') !== false && strpos($lines[$stateIdx2], 'renameSiteName') !== false) {
    array_splice($lines, $stateIdx1, 2);
}

// 2. Remove handleRenameSite
$startHandle = -1;
$endHandle = -1;
for ($i = 0; $i < count($lines); $i++) {
    if (strpos($lines[$i], 'const handleRenameSite =') !== false) {
        $startHandle = $i;
    }
    if ($startHandle !== -1 && $i > $startHandle && strpos($lines[$i], '};') !== false) {
        $endHandle = $i;
        break;
    }
}
if ($startHandle !== -1 && $endHandle !== -1) {
    array_splice($lines, $startHandle, $endHandle - $startHandle + 1);
}

// 3. Fix onClick
for ($i = 0; $i < count($lines); $i++) {
    if (strpos($lines[$i], 'setShowRenameSiteModal(true);') !== false) {
        // This is inside the onClick.
        // It looks like:
        // setRenameSiteName(siteContextMenu.siteName);
        // setShowRenameSiteModal(true);
        // setSiteContextMenu({ ...siteContextMenu, visible: false });
        
        $lines[$i - 1] = "                setRenameModalData({ siteId: siteContextMenu.siteId, currentName: siteContextMenu.siteName });\n";
        array_splice($lines, $i, 1); // remove setShowRenameSiteModal(true)
        break;
    }
}

// 4. Remove inline modal
$startModal = -1;
$endModal = -1;
for ($i = 0; $i < count($lines); $i++) {
    if (strpos($lines[$i], '{/* MODALE RENOMMER SITE */}') !== false) {
        $startModal = $i;
    }
    if ($startModal !== -1 && $i > $startModal && strpos($lines[$i], ')}') !== false) {
        $endModal = $i;
        break; // Note: Ensure it's the exact closing of this modal
    }
}
// We know it's around 21 lines long
if ($startModal !== -1 && $endModal !== -1) {
    array_splice($lines, $startModal, $endModal - $startModal + 1);
}

file_put_contents($filePath, implode("", $lines));
echo "Successfully cleaned up RenameSiteModal inline code!";
?>
