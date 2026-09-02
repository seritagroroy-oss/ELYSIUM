<?php
$db = new PDO('mysql:host=127.0.0.1;dbname=elysium', 'root', '');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $db->query("
    SELECT COUNT(a.id) as agent_count_total 
    FROM agents a
    JOIN subsites s ON a.subsite_id = s.id
    WHERE s.site_id = 'site_itc'
");
$result_total = $stmt->fetch(PDO::FETCH_ASSOC);

$stmt2 = $db->query("
    SELECT COUNT(a.id) as agent_count_company 
    FROM agents a
    JOIN subsites s ON a.subsite_id = s.id
    WHERE s.site_id = 'site_itc' AND a.company_id = 'comp_cf66d02f'
");
$result_company = $stmt2->fetch(PDO::FETCH_ASSOC);

echo "Total agents in site_itc (all companies): " . $result_total['agent_count_total'] . "\n";
echo "Agents in site_itc (for your company): " . $result_company['agent_count_company'] . "\n";
?>
