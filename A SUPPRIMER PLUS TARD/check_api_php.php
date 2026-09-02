<?php
$content = file_get_contents('c:\laragon\www\pontage\api.php');
if (strpos($content, 'import_payment_methods') !== false) {
    echo "Found in api.php";
} else {
    echo "Not found";
}
