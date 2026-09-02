<?php
$filePath = __DIR__ . '/frontend/src/components/Dashboard.jsx';
$content = file_get_contents($filePath);
if (!$content) {
    die("Error: File is missing.");
}

echo "Found PublishSuccessModal: " . (strpos($content, "const PublishSuccessModal = React.lazy(() => import('./modals/PublishSuccessModal'));") !== false ? "YES" : "NO") . "<br>";
echo "Found FaqModal start: " . (strpos($content, '{/* ============ MODAL FAQ (INLINED) ============ */}') !== false ? "YES" : "NO") . "<br>";
echo "Found AddSiteModal start: " . (strpos($content, '{/* Modal : Ajouter Site */}') !== false ? "YES" : "NO") . "<br>";
echo "Found PasteConfirmModal start: " . (strpos($content, '{/* MODALE CONFIRMATION COLLAGE */}') !== false ? "YES" : "NO") . "<br>";
echo "Found DeleteSiteModal start: " . (strpos($content, '{/* MODALE SUPPRIMER SITE */}') !== false ? "YES" : "NO") . "<br>";
?>
