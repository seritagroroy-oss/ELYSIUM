<?php
try {
    $dbPath = __DIR__ . '/data/database.sqlite';
    $sqlite = new PDO('sqlite:' . $dbPath);
    $sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Test the exact query
    $company_id = 'comp_default_1';
    $agent_id = 'alice';
    $date = '2027-12-23'; 
    
    $stmt = $sqlite->prepare("
        SELECT s.*, sub.name as destination_name, r.name as replaced_agent_name,
               a.`function` as agent_poste, a.profile_data
        FROM supplementaires_externes s 
        LEFT JOIN subsites sub ON s.site_destination_id = sub.id 
        LEFT JOIN agents r ON s.agent_remplace = r.id
        LEFT JOIN agents a ON s.agent_id = a.id
        WHERE s.agent_id = ? 
        AND (
            s.date_supp = ?
            OR (s.vacation = '48H' AND ? = date(s.date_supp, '+1 day'))
            OR (s.vacation = '72H' AND ? IN (date(s.date_supp, '+1 day'), date(s.date_supp, '+2 days')))
        )
        ORDER BY s.created_at DESC LIMIT 1
    ");
    $stmt->execute([$agent_id, $date, $date, $date]);
    $res = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($res) {
        $poste = $res['agent_poste'];
        $stmtGrid = $sqlite->prepare("SELECT taux_horaire FROM salary_grid WHERE company_id = ? AND poste = ?");
        $stmtGrid->execute([$company_id, $poste]);
        $base = $stmtGrid->fetchColumn();
        
        $settingsStmt = $sqlite->prepare("SELECT data_value FROM service_data WHERE service_id IN (?, ?) AND data_key = 'payroll_settings' ORDER BY service_id DESC LIMIT 1");
        $settingsStmt->execute(["company::" . $company_id, $company_id]);
        $settingsRow = $settingsStmt->fetchColumn();
        
        echo json_encode(['res' => $res, 'base' => $base, 'settingsRow' => substr((string)$settingsRow, 0, 50)]);
    } else {
        echo "No record found for alice on $date.\n";
        $stmt2 = $sqlite->query("SELECT * FROM supplementaires_externes WHERE agent_id = 'alice' ORDER BY date_supp DESC LIMIT 5");
        echo json_encode($stmt2->fetchAll(PDO::FETCH_ASSOC));
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
