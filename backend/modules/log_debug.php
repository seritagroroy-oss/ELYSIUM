<?php
$data = json_decode(file_get_contents('php://input'), true);
if ($data) {
    file_put_contents(__DIR__ . '/../../frontend_debug.log', date('Y-m-d H:i:s') . ' - ' . json_encode($data) . "\n", FILE_APPEND);
}
echo json_encode(['success' => true]);
