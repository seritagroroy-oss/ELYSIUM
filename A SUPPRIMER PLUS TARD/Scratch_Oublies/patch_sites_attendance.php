<?php
$sites_file = __DIR__ . "/../backend/modules/sites_v2.php";
$sites = file_get_contents($sites_file);

// Replace DELETE FROM agents
$sites = preg_replace(
    "/\\\$sqlite->prepare\\(\"DELETE FROM agents WHERE id = \\\?\"\\)->execute\\(\[\\\$agent_id\]\\);/m",
    "\$company_id = resolveCurrentCompanyIdSql();\n        \$sqlite->prepare(\"DELETE FROM agents WHERE id = ? AND company_id = ?\")->execute([\$agent_id, \$company_id]);",
    $sites
);

// Replace DELETE FROM sites
$sites = preg_replace(
    "/\\\$sqlite->prepare\\(\"DELETE FROM sites WHERE id = \\\?\"\\)->execute\\(\[\\\$site_id\]\\);/m",
    "\$company_id = resolveCurrentCompanyIdSql();\n        \$sqlite->prepare(\"DELETE FROM sites WHERE id = ? AND company_id = ?\")->execute([\$site_id, \$company_id]);",
    $sites
);

// Replace DELETE FROM subsites WHERE id = ?
$sites = preg_replace(
    "/\\\$sqlite->prepare\\(\"DELETE FROM subsites WHERE id = \\\?\"\\)->execute\\(\[\\\$subsite_id\]\\);/m",
    "\$company_id = resolveCurrentCompanyIdSql();\n        \$sqlite->prepare(\"DELETE FROM subsites WHERE id = ? AND company_id = ?\")->execute([\$subsite_id, \$company_id]);",
    $sites
);

// Replace UPDATE agents SET profile_data
$sites = preg_replace(
    "/\\\$stmt = \\\$sqlite->prepare\\(\"UPDATE agents SET profile_data = \\\? WHERE id = \\\?\"\\);\s+\\\$stmt->execute\\(\[json_encode\\(\\\$profile_data\\), \\\$agent_id\]\\);/m",
    "\$company_id = resolveCurrentCompanyIdSql();\n        \$stmt = \$sqlite->prepare(\"UPDATE agents SET profile_data = ? WHERE id = ? AND company_id = ?\");\n        \$stmt->execute([json_encode(\$profile_data), \$agent_id, \$company_id]);",
    $sites
);

// Replace UPDATE agents SET name
$sites = preg_replace(
    "/\\\$sqlite->prepare\\(\"UPDATE agents SET name = \\\? WHERE id = \\\?\"\\)->execute\\(\[\\\$data\['name'\], \\\$agent_id\]\\);/m",
    "\$company_id = resolveCurrentCompanyIdSql();\n            \$sqlite->prepare(\"UPDATE agents SET name = ? WHERE id = ? AND company_id = ?\")->execute([\$data['name'], \$agent_id, \$company_id]);",
    $sites
);

// Replace UPDATE agents SET salary
$sites = preg_replace(
    "/\\\$sqlite->prepare\\(\"UPDATE agents SET salary = \\\? WHERE id = \\\?\"\\)->execute\\(\[\\\$data\['salary'\], \\\$agent_id\]\\);/m",
    "\$company_id = resolveCurrentCompanyIdSql();\n            \$sqlite->prepare(\"UPDATE agents SET salary = ? WHERE id = ? AND company_id = ?\")->execute([\$data['salary'], \$agent_id, \$company_id]);",
    $sites
);
$sites = preg_replace(
    "/\\\$sqlite->prepare\\(\"UPDATE agents SET salary = \\\? WHERE id = \\\?\"\\)->execute\\(\[\\\$salary, \\\$agent_id\]\\);/m",
    "\$company_id = resolveCurrentCompanyIdSql();\n        \$sqlite->prepare(\"UPDATE agents SET salary = ? WHERE id = ? AND company_id = ?\")->execute([\$salary, \$agent_id, \$company_id]);",
    $sites
);

// Replace SELECT * FROM agents
$sites = preg_replace(
    "/\\\$stmt = \\\$sqlite->prepare\\(\"SELECT \\\* FROM agents WHERE id = \\\?\"\\);\s+\\\$stmt->execute\\(\[\\\$agent_id\]\\);/m",
    "\$company_id = resolveCurrentCompanyIdSql();\n        \$stmt = \$sqlite->prepare(\"SELECT * FROM agents WHERE id = ? AND company_id = ?\");\n        \$stmt->execute([\$agent_id, \$company_id]);",
    $sites
);

// Replace UPDATE subsites SET costume_enabled
$sites = preg_replace(
    "/\\\$stmt = \\\$sqlite->prepare\\(\"UPDATE subsites SET costume_enabled = \\\?, enabled_functions = \\\?, contract_end_date = \\\?, contract_end_motif = \\\?, contract_end_updated_at = CURRENT_TIMESTAMP, closure_notified = 0, closure_last_reminder_at = NULL WHERE id = \\\?\"\\);\s+\\\$stmt->execute\\(\[\\\$costume_enabled, \\\$enabled_functions, \\\$contract_end_date, \\\$contract_end_motif, \\\$subsite_id\]\\);/m",
    "\$company_id = resolveCurrentCompanyIdSql();\n            \$stmt = \$sqlite->prepare(\"UPDATE subsites SET costume_enabled = ?, enabled_functions = ?, contract_end_date = ?, contract_end_motif = ?, contract_end_updated_at = CURRENT_TIMESTAMP, closure_notified = 0, closure_last_reminder_at = NULL WHERE id = ? AND company_id = ?\");\n            \$stmt->execute([\$costume_enabled, \$enabled_functions, \$contract_end_date, \$contract_end_motif, \$subsite_id, \$company_id]);",
    $sites
);
$sites = preg_replace(
    "/\\\$stmt = \\\$sqlite->prepare\\(\"UPDATE subsites SET costume_enabled = \\\?, enabled_functions = \\\?, contract_end_date = \\\?, contract_end_motif = \\\? WHERE id = \\\?\"\\);\s+\\\$stmt->execute\\(\[\\\$costume_enabled, \\\$enabled_functions, \\\$contract_end_date, \\\$contract_end_motif, \\\$subsite_id\]\\);/m",
    "\$company_id = resolveCurrentCompanyIdSql();\n            \$stmt = \$sqlite->prepare(\"UPDATE subsites SET costume_enabled = ?, enabled_functions = ?, contract_end_date = ?, contract_end_motif = ? WHERE id = ? AND company_id = ?\");\n            \$stmt->execute([\$costume_enabled, \$enabled_functions, \$contract_end_date, \$contract_end_motif, \$subsite_id, \$company_id]);",
    $sites
);

file_put_contents($sites_file, $sites);
echo "Patched sites_v2.php\n";

// Now Attendance
$att_file = __DIR__ . "/../backend/modules/attendance.php";
if (file_exists($att_file)) {
    $att = file_get_contents($att_file);
    // Replace DELETE FROM attendance WHERE id = ?
    $att = preg_replace(
        "/\\\$deleteStmt = \\\$sqlite->prepare\\(\"DELETE FROM attendance WHERE id = \\\?\"\\);/m",
        "\$company_id = resolveCurrentCompanyIdSql();\n        \$deleteStmt = \$sqlite->prepare(\"DELETE FROM attendance WHERE id = ? AND company_id = '\$company_id'\");",
        $att
    );
    // Replace UPDATE attendance SET status = ? WHERE id = ?
    $att = preg_replace(
        "/\\\$updateStmt = \\\$sqlite->prepare\\(\"UPDATE attendance SET status = \\\? WHERE id = \\\?\"\\);/m",
        "\$company_id = resolveCurrentCompanyIdSql();\n        \$updateStmt = \$sqlite->prepare(\"UPDATE attendance SET status = ? WHERE id = ? AND company_id = '\$company_id'\");",
        $att
    );
    file_put_contents($att_file, $att);
    echo "Patched attendance.php\n";
} else {
    echo "attendance.php not found\n";
}
