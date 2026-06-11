<?php
require 'backend/database.php';
$sqlite = getDb();

$services_stmt = $sqlite->query("SELECT id FROM services");
$services = $services_stmt->fetchAll(PDO::FETCH_ASSOC);

$default_sites = [
    [
        'id' => 'site_extras',
        'name' => '🌟 Vivier des Extras',
        'subsite_id' => 'site_extras_1',
        'subsite_name' => 'Agents Disponibles'
    ],
    [
        'id' => 'site_releves',
        'name' => '🔄 Vivier des relèves',
        'subsite_id' => 'site_releves_1',
        'subsite_name' => 'Agents Disponibles'
    ],
    [
        'id' => 'site_administration',
        'name' => '🏢 Administration',
        'subsite_id' => 'site_admin_1',
        'subsite_name' => 'Bureau'
    ]
];

$inserted = 0;
foreach ($services as $service) {
    $service_id = $service['id'];
    
    foreach ($default_sites as $ds) {
        $site_id = $service_id . '_' . $ds['id']; // Unique site ID per service to avoid PK conflicts if needed? Wait! SQLite sites table schema has "id" TEXT PRIMARY KEY!
        
        // Let's check if the site exists for this service
        $stmt = $sqlite->prepare("SELECT id FROM sites WHERE id = ?");
        $stmt->execute([$site_id]);
        if (!$stmt->fetch()) {
            $stmtInsert = $sqlite->prepare("INSERT INTO sites (id, service_id, name) VALUES (?, ?, ?)");
            $stmtInsert->execute([$site_id, $service_id, $ds['name']]);
            $inserted++;
            
            // Insert subsite
            $subsite_id = $service_id . '_' . $ds['subsite_id'];
            $stmtSubInsert = $sqlite->prepare("INSERT INTO subsites (id, site_id, name) VALUES (?, ?, ?)");
            $stmtSubInsert->execute([$subsite_id, $site_id, $ds['subsite_name']]);
        }
    }
}
echo "Inserted $inserted default sites.\n";
