<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

try {
    $stmt = $db->prepare("DELETE FROM sites WHERE id = 'site_extras'");
    $stmt->execute();
    echo "Site 'site_extras' deleted successfully. Rows affected: " . $stmt->rowCount() . "\n";
} catch (Exception $e) {
    echo "ERREUR: " . $e->getMessage();
}
?>
