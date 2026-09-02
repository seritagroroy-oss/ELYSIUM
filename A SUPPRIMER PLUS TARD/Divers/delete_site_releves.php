<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $db->query("SELECT * FROM sites WHERE id = 'site_releves'");
$sites = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (!empty($sites)) {
    echo "Found site_releves in DB. Deleting it...\n";
    $db->query("DELETE FROM sites WHERE id = 'site_releves'");
    echo "Deleted.\n";
} else {
    echo "Not found in DB.\n";
}
?>
