<?php
$db = new PDO('sqlite:' . __DIR__ . '/backend/elysium.db');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $db->query("SELECT id, mois_concerne, statut, montant_estime FROM reclamations");
$recs = $stmt->fetchAll(PDO::FETCH_ASSOC);

$stmt2 = $db->query("SELECT period, reclamations_total FROM fluctuation_history");
$hist = $stmt2->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['reclamations' => $recs, 'history' => $hist], JSON_PRETTY_PRINT);
