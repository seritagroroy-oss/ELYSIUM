<?php
$content = file_get_contents('api.php');
// Fix line 1247: $t['tags'] = $stmtTags->fetchAll(PDO::FETCH_COLUMN);
$content = preg_replace(
    '/\$t\[\'tags\'\] = \$stmtTags->fetchAll\(PDO::FETCH_COLUMN\);/',
    "\$tags_rows = \$stmtTags->fetchAll(); \$t['tags'] = array_map(fn(\$r) => array_values(\$r)[0], \$tags_rows);",
    $content
);
// Fix line 3731: $subsite_ids = $stmtSub->fetchAll(PDO::FETCH_COLUMN) ?: [];
$content = preg_replace(
    '/\$subsite_ids = \$stmtSub->fetchAll\(PDO::FETCH_COLUMN\) \?: \[\];/',
    "\$sub_rows = \$stmtSub->fetchAll(); \$subsite_ids = array_map(fn(\$r) => array_values(\$r)[0], \$sub_rows) ?: [];",
    $content
);
file_put_contents('api.php', $content);
echo "Fixed PDO::FETCH_COLUMN in api.php\n";
