<?php
// Function to save base64 screenshot
function saveScreenshot(\$base64) {
    if (empty(\$base64)) return null;
    if (preg_match('/^data:image\/(\w+);base64,/', \$base64, \$type)) {
        \$base64 = substr(\$base64, strpos(\$base64, ',') + 1);
        \$type = strtolower(\$type[1]);
        if (!in_array(\$type, ['jpg', 'jpeg', 'png', 'gif'])) return null;
        \$base64 = str_replace(' ', '+', \$base64);
        \$data = base64_decode(\$base64);
        if (\$data === false) return null;
        \$filename = uniqid('snap_') . '.' . \$type;
        \$filepath = __DIR__ . '/uploads/snapshots/' . \$filename;
        if (!is_dir(dirname(\$filepath))) mkdir(dirname(\$filepath), 0777, true);
        file_put_contents(\$filepath, \$data);
        return 'uploads/snapshots/' . \$filename;
    }
    return null;
}
