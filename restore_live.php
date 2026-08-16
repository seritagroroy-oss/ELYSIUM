<?php
header('Content-Type: application/json; charset=UTF-8');
set_time_limit(0);
require_once __DIR__ . '/backend/database.php';

$sqlite = getDb();
$company_id = 'comp_cf66d02f';
$period = '2026-07';

try {

    
    // 1. Get the full archive from the `archives` table
    $stmt = $sqlite->prepare("SELECT data FROM archives WHERE company_id = ? AND period = ?");
    $stmt->execute([$company_id, $period]);
    $archive_master = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$archive_master) {
        die(json_encode(["error" => "No master archive found"]));
    }

    $master_data = json_decode($archive_master['data'], true);
    
    $restored_subsites = 0;
    $restored_agents = 0;
    $restored_attendance = 0;
    
    // 2. Loop through the sites and restore EXTRA SUR SITE and EXTRA BUREAU
    foreach ($master_data['sites'] as $site) {
        if ($site['id'] === 'site_extras_sur_site' || $site['id'] === 'site_extras') {
            
            foreach ($site['subsites'] as $sub) {
                // Check if subsite exists
                $stmtCheckSub = $sqlite->prepare("SELECT id FROM subsites WHERE id = ?");
                $stmtCheckSub->execute([$sub['id']]);
                if (!$stmtCheckSub->fetch()) {
                    // Restore subsite
                    $stmtInsSub = $sqlite->prepare("INSERT INTO subsites (id, name, site_id, service_id, company_id) VALUES (?, ?, ?, ?, ?)");
                    $stmtInsSub->execute([
                        $sub['id'], 
                        $sub['name'], 
                        $site['id'], 
                        'svc_52f7a282', 
                        $company_id
                    ]);
                    $restored_subsites++;
                }
                
                foreach ($sub['agents'] as $agent) {
                    // Check if agent exists
                    $stmtCheckAg = $sqlite->prepare("SELECT id FROM agents WHERE id = ?");
                    $stmtCheckAg->execute([$agent['id']]);
                    if (!$stmtCheckAg->fetch()) {
                        // Restore agent
                        $stmtInsAg = $sqlite->prepare("INSERT INTO agents (
                            id, name, `function`, subsite_id, service_id, company_id,
                            has_sp, created_at, shift_type,
                            shift_history, profile_data, salary
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                        
                        $stmtInsAg->execute([
                            $agent['id'],
                            $agent['name'],
                            $agent['function'] ?? '',
                            $sub['id'], 
                            'svc_52f7a282',
                            $company_id,
                            $agent['has_sp'] ?? 0,
                            $agent['created_at'] ?? date('Y-m-d H:i:s'),
                            $agent['shift_type'] ?? 'Jour',
                            isset($agent['shift_history']) ? json_encode($agent['shift_history']) : '[]',
                            isset($agent['profile_data']) ? json_encode($agent['profile_data']) : '{}',
                            $agent['monthly_salary'] ?? 0
                        ]);
                        $restored_agents++;
                    }
                    
                    // Restore attendance
                    if (isset($agent['attendance']) && is_array($agent['attendance'])) {
                        foreach ($agent['attendance'] as $att) {
                            $stmtCheckAtt = $sqlite->prepare("SELECT date FROM attendance WHERE agent_id = ? AND date = ?");
                            $stmtCheckAtt->execute([$agent['id'], $att['date']]);
                            if (!$stmtCheckAtt->fetch()) {
                                $stmtInsAtt = $sqlite->prepare("INSERT INTO attendance (
                                    agent_id, date, shift_code, status, service_id, company_id, period
                                ) VALUES (?, ?, ?, ?, ?, ?, ?)");
                                $stmtInsAtt->execute([
                                    $agent['id'],
                                    $att['date'],
                                    $att['shift'] ?? 'J',
                                    $att['status'] ?? '',
                                    'svc_52f7a282',
                                    $company_id,
                                    $period
                                ]);
                                $restored_attendance++;
                            }
                        }
                    }
                }
            }
        }
    }
    
    
    echo json_encode([
        "status" => "success",
        "message" => "Restored into live database",
        "restored_subsites" => $restored_subsites,
        "restored_agents" => $restored_agents,
        "restored_attendance" => $restored_attendance
    ]);
    
} catch (Exception $e) {
    $err = json_encode(["error" => $e->getMessage(), "line" => $e->getLine(), "file" => $e->getFile()]);
    file_put_contents(__DIR__ . '/restore_error.log', $err);
    echo $err;
}
