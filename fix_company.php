<?php
$db = new SQLite3('backend/elysium.db');
$db->busyTimeout(5000);

// Update users
$stmt = $db->prepare("UPDATE users SET company_id = 'comp_default_1' WHERE company_id = 'comp_20837e85' OR company_id = 'comp_480ef24c'");
$stmt->execute();

// Update services
$stmt = $db->prepare("UPDATE services SET company_id = 'comp_default_1' WHERE company_id = 'comp_20837e85' OR company_id = 'comp_480ef24c'");
$stmt->execute();

echo "Mise à jour réussie !";
