<?php
$file = __DIR__ . '/frontend/src/components/Dashboard.jsx';
$content = file_get_contents($file);

$replacements = [
    [
        "import ReleveScheduleModal from './modals/ReleveScheduleModal';",
        "import ReleveScheduleModal from './modals/ReleveScheduleModal';\nimport ClosedMonthModal from './modals/ClosedMonthModal';"
    ],
    [
        "const [showDeployExtra, setShowDeployExtra] = useState(false);\n  const [extraAgents, setExtraAgents] = useState([]);",
        "const [showDeployExtra, setShowDeployExtra] = useState(false);\n  const [extraAgents, setExtraAgents] = useState([]);\n  const [showClosedMonthModal, setShowClosedMonthModal] = useState(false);"
    ],
    [
        "if (mapStartDate > mapEndDate) {\n      alert('La date de début doit être avant la date de fin.');\n      return;\n    }",
        "if (mapStartDate > mapEndDate) {\n      alert('La date de début doit être avant la date de fin.');\n      return;\n    }\n    const mapEndPeriod = mapEndDate.substring(0, 7);\n    if (mapEndPeriod < period) {\n      setShowClosedMonthModal(true);\n      return;\n    }"
    ],
    [
        "if (permissionStartDate > permissionEndDate) {\n      alert('La date de début doit être avant la date de fin.');\n      return;\n    }",
        "if (permissionStartDate > permissionEndDate) {\n      alert('La date de début doit être avant la date de fin.');\n      return;\n    }\n    const permEndPeriod = permissionEndDate.substring(0, 7);\n    if (permEndPeriod < period) {\n      setShowClosedMonthModal(true);\n      return;\n    }"
    ],
    [
        "if (!cpStartDate || !cpEndDate) {\n      alert('Veuillez sélectionner les dates de début et de fin du congé.');\n      return;\n    }",
        "if (!cpStartDate || !cpEndDate) {\n      alert('Veuillez sélectionner les dates de début et de fin du congé.');\n      return;\n    }\n    const cpEndPeriod = cpEndDate.substring(0, 7);\n    if (cpEndPeriod < period) {\n      setShowClosedMonthModal(true);\n      return;\n    }"
    ],
    [
        "if (!entrantAgentId || !entrantDate) {\n      alert('Veuillez sélectionner la date de début.');\n      return;\n    }",
        "if (!entrantAgentId || !entrantDate) {\n      alert('Veuillez sélectionner la date de début.');\n      return;\n    }\n    const entrantEndPeriod = entrantDate.substring(0, 7);\n    if (entrantEndPeriod < period) {\n      setShowClosedMonthModal(true);\n      return;\n    }"
    ],
    [
        "if (!sortantAgentId || !sortantDate) {\n      alert('Veuillez sélectionner la date.');\n      return;\n    }",
        "if (!sortantAgentId || !sortantDate) {\n      alert('Veuillez sélectionner la date.');\n      return;\n    }\n    const sortantEndPeriod = sortantDate.substring(0, 7);\n    if (sortantEndPeriod < period) {\n      setShowClosedMonthModal(true);\n      return;\n    }"
    ],
    [
        "      )}\n\n          {showTransferModal && (",
        "      )}\n\n      {showClosedMonthModal && (\n        <ClosedMonthModal \n          onClose={() => setShowClosedMonthModal(false)} \n        />\n      )}\n\n          {showTransferModal && ("
    ]
];

foreach ($replacements as $i => $rep) {
    if (strpos($content, $rep[0]) !== false) {
        $content = str_replace($rep[0], $rep[1], $content);
        echo "Replaced chunk $i\n";
    } else {
        echo "Could not find chunk $i\n";
    }
}

file_put_contents($file, $content);
?>
