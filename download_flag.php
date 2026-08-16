<?php
$url = 'https://flagcdn.com/w40/ci.png';
$data = file_get_contents($url);
if ($data !== false) {
    file_put_contents(__DIR__ . '/ci.png', $data);
    file_put_contents(__DIR__ . '/frontend/public/ci.png', $data);
    file_put_contents(__DIR__ . '/dist/ci.png', $data);
    echo "Success!";
} else {
    echo "Failed to download.";
}
?>
