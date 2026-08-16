<?php
$source = "d:/Pontage - VRAI 07 07 2026/backend/database.php";
$dest = "C:/laragon/www/pontage/backend/database.php";

if (copy($source, $dest)) {
    echo "Copie réussie !";
} else {
    echo "Échec de la copie.";
}
