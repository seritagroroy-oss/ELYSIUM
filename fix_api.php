<?php
$content = file_get_contents('api.php');
$content = str_replace('PDO::FETCH_ASSOC', '', $content);
// for PDO::FETCH_COLUMN, we need to be careful because fetchAll() without arguments returns associative array, while PDO::FETCH_COLUMN returns a flat array!
file_put_contents('api.php', $content);
echo "Fixed PDO::FETCH_ASSOC in api.php\n";
