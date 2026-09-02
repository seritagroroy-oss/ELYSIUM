<?php
if (!is_dir('c:\\laragon\\www\\pontage\\sauvegard')) {
    mkdir('c:\\laragon\\www\\pontage\\sauvegard', 0777, true);
}
copy('c:\\laragon\\www\\pontage\\backend\\modules\\pointage.php', 'c:\\laragon\\www\\pontage\\sauvegard\\pointage.php');
echo "Sauvegarde reussie.";
