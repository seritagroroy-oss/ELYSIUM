<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $db->query("SELECT * FROM sites WHERE id = 'site_administration'");
$sites = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (!empty($sites)) {
    echo "Found site_administration in DB. Deleting it...\n";
    $db->query("DELETE FROM sites WHERE id = 'site_administration'");
    echo "Deleted from DB.\n";
} else {
    echo "site_administration not found in DB.\n";
}
?>
