<?php
require 'c:/laragon/www/pontage/backend/bootstrap.php';

try {
    $sqlite = getDb();
    $stmt = $sqlite->prepare("
        SELECT s.*, sub.name as destination_name, r.name as replaced_agent_name,
               a.`function` as agent_poste, a.profile_data
        FROM supplementaires_externes s 
        LEFT JOIN subsites sub ON s.site_destination_id = sub.id 
        LEFT JOIN agents r ON s.agent_remplace = r.id
        LEFT JOIN agents a ON s.agent_id = a.id
        ORDER BY s.id DESC LIMIT 1
    ");
    $stmt->execute();
    print_r($stmt->fetch(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
