<?php
$file = __DIR__ . '/frontend/src/components/Dashboard.jsx';
$lines = file($file);

$found = false;

// 1. Add import
foreach ($lines as $i => $line) {
    if (strpos($line, "import ReleveScheduleModal from './modals/ReleveScheduleModal';") !== false) {
        $lines[$i] = "import ReleveScheduleModal from './modals/ReleveScheduleModal';\nimport ClosedMonthModal from './modals/ClosedMonthModal';\n";
        break;
    }
}

// 2. Add state
foreach ($lines as $i => $line) {
    if (strpos($line, "const [extraAgents, setExtraAgents] = useState([]);") !== false) {
        $lines[$i] = "  const [extraAgents, setExtraAgents] = useState([]);\n  const [showClosedMonthModal, setShowClosedMonthModal] = useState(false);\n";
        break;
    }
}

// 3. handleMapSubmit
foreach ($lines as $i => $line) {
    if (strpos($line, "const handleMapSubmit = async") !== false) {
        for ($j = $i; $j < $i + 20; $j++) {
            if (strpos($lines[$j], "alert('La date de début doit être avant la date de fin.');") !== false) {
                $lines[$j+1] = "      return;\n    }\n    const mapEndPeriod = mapEndDate.substring(0, 7);\n    if (mapEndPeriod < period) {\n      setShowClosedMonthModal(true);\n      return;\n";
                break 2;
            }
        }
    }
}

// 4. handlePermissionSubmit
foreach ($lines as $i => $line) {
    if (strpos($line, "const handlePermissionSubmit = async") !== false) {
        for ($j = $i; $j < $i + 20; $j++) {
            if (strpos($lines[$j], "alert('La date de début doit être avant la date de fin.');") !== false) {
                $lines[$j+1] = "      return;\n    }\n    const permEndPeriod = permissionEndDate.substring(0, 7);\n    if (permEndPeriod < period) {\n      setShowClosedMonthModal(true);\n      return;\n";
                break 2;
            }
        }
    }
}

// 5. handleCpSubmit
foreach ($lines as $i => $line) {
    if (strpos($line, "const handleCpSubmit = async") !== false) {
        for ($j = $i; $j < $i + 20; $j++) {
            if (strpos($lines[$j], "alert('Veuillez sélectionner les dates de début et de fin du congé.');") !== false) {
                $lines[$j+1] = "      return;\n    }\n    const cpEndPeriod = cpEndDate.substring(0, 7);\n    if (cpEndPeriod < period) {\n      setShowClosedMonthModal(true);\n      return;\n";
                break 2;
            }
        }
    }
}

// 6. handleConfirmEntrant
foreach ($lines as $i => $line) {
    if (strpos($line, "const handleConfirmEntrant = async") !== false) {
        for ($j = $i; $j < $i + 20; $j++) {
            if (strpos($lines[$j], "alert('Veuillez sélectionner la date de début.');") !== false) {
                $lines[$j+1] = "      return;\n    }\n    const entrantEndPeriod = entrantDate.substring(0, 7);\n    if (entrantEndPeriod < period) {\n      setShowClosedMonthModal(true);\n      return;\n";
                break 2;
            }
        }
    }
}

// 7. handleConfirmSortant
foreach ($lines as $i => $line) {
    if (strpos($line, "const handleConfirmSortant = async") !== false) {
        for ($j = $i; $j < $i + 20; $j++) {
            if (strpos($lines[$j], "alert('Veuillez sélectionner la date.');") !== false) {
                $lines[$j+1] = "      return;\n    }\n    const sortantEndPeriod = sortantDate.substring(0, 7);\n    if (sortantEndPeriod < period) {\n      setShowClosedMonthModal(true);\n      return;\n";
                break 2;
            }
        }
    }
}

// 8. Add modal
for ($i = count($lines) - 1; $i >= 0; $i--) {
    if (strpos($lines[$i], "{showTransferModal && (") !== false) {
        $lines[$i] = "      {showClosedMonthModal && (\n        <ClosedMonthModal \n          onClose={() => setShowClosedMonthModal(false)} \n        />\n      )}\n\n" . $lines[$i];
        break;
    }
}

file_put_contents($file, implode("", $lines));
echo "Modifications completed by lines!";
?>
