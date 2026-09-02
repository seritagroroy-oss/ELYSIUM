<?php
$source = 'c:\\laragon\\www\\pontage\\frontend\\src\\components\\tables\\DashboardTable.jsx';
$dest = 'c:\\laragon\\www\\pontage\\sauvegard\\DashboardTable.jsx';
if (copy($source, $dest)) {
    echo "SUCCESS";
} else {
    echo "ERROR";
}
?>
