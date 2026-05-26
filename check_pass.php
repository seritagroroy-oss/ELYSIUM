<?php
$hash = '$2y$12$cEC7zG4sUEDnpCpfjBybDOfbdw24leqODTrt1kboiWph6jHa/0jHG';
if (password_verify('admin123', $hash)) {
    echo "password is admin123\n";
} else {
    echo "password is NOT admin123\n";
}
