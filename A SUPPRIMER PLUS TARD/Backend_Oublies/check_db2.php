<?php
try {
    $path = __DIR__ . '/elysium.db';
    $sqlite = new PDO('sqlite:' . $path);
    $sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt2 = $sqlite->query("SELECT id, name, site_id FROM subsites WHERE name LIKE '%AAA%' OR name LIKE '%BBB%' OR name LIKE '%CCCC%'");
    $subsites = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    echo "\nSUBSITES:\n";
    print_r($subsites);

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
