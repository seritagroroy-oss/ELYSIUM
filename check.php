<?php
exec("php -l c:/laragon/www/pontage/backend/core/functions.php", $out, $ret);
echo implode("\n", $out);
