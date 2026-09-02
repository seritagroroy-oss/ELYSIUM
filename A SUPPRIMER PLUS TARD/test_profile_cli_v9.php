<?php
try {
    $sqlite = new PDO('mysql:host=127.0.0.1;dbname=elysium;charset=utf8mb4', 'root', '');
    $stmt = $sqlite->prepare("
            SELECT sub.name as subsite, s.name as site 
            FROM agents a
            LEFT JOIN subsites sub ON a.subsite_id = sub.id
            LEFT JOIN sites s ON sub.site_id = s.id
            WHERE a.name = ? AND a.company_id = ? AND (a.exit_date IS NULL OR a.exit_date = '')
        ");
    $stmt->execute(['SALI NO', 'comp_bb90668e']);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $sites = [];
    foreach ($rows as $r) {
        $siteName = $r['subsite'] ? $r['subsite'] : $r['site'];
        if (!$siteName) $siteName = "Service Indépendant";
        if (!in_array($siteName, $sites)) {
            $sites[] = $siteName;
        }
    }
    file_put_contents('c:/laragon/www/pontage/sali_no_data.txt', print_r(['rows' => $rows, 'sites' => $sites], true));
} catch(Exception $e) {
    file_put_contents('c:/laragon/www/pontage/sali_no_data.txt', $e->getMessage());
}
