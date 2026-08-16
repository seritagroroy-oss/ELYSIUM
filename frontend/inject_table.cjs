const fs = require('fs');
const path = require('path');

const tablePath = path.join(__dirname, 'src/components/tables/DashboardTable.jsx');
let tableCode = fs.readFileSync(tablePath, 'utf8');

// 1. Color mapping for 'T|...'
if (!tableCode.includes("status.startsWith('T|')")) {
    tableCode = tableCode.replace(
        "if (status === 'P') return '#ff0000';",
        "if (status === 'P') return '#ff0000';\n    if (status.startsWith('T|')) return '#f97316';" // orange
    );
}

if (!tableCode.includes("status.startsWith('T|') ? 'white'")) {
    tableCode = tableCode.replace(
        "if (status === 'A' || status === 'P' || status === 'M') return 'white';",
        "if (status === 'A' || status === 'P' || status === 'M' || status.startsWith('T|')) return 'white';"
    );
}

// 2. Block left click and right click
if (!tableCode.includes("const isTransfere = status.startsWith('T|');")) {
    // Find the cell rendering block. This usually starts where cell content is defined.
    // In DashboardTable.jsx: 
    // const cellContent = ...
    // Let's inject logic where onClick and onContextMenu are defined for the cell.
    
    tableCode = tableCode.replace(
        "const isAbsence = status === 'A';",
        "const isAbsence = status === 'A';\n                                      const isTransfere = status.startsWith('T|');\n                                      let transferTarget = '', transferReplaced = '', transferMotif = '';\n                                      if (isTransfere) {\n                                        const parts = status.split('|');\n                                        if (parts.length > 1) transferTarget = parts[1];\n                                        if (parts.length > 2) transferReplaced = parts[2];\n                                        if (parts.length > 3) transferMotif = parts[3];\n                                      }"
    );

    tableCode = tableCode.replace(
        "onClick={(e) => {",
        "onClick={(e) => {\n                                        if (isTransfere) return; // Blocked"
    );

    tableCode = tableCode.replace(
        "onContextMenu={(e) => {",
        "onContextMenu={(e) => {\n                                        if (isTransfere) {\n                                          e.preventDefault();\n                                          setTransferDetailsData({ agentId: agent.id, agentName: agent.name, dateKey: dk, shiftCode: sc, targetSite: transferTarget, replacedAgent: transferReplaced, motif: transferMotif });\n                                          setShowTransferDetailsModal(true);\n                                          return;\n                                        }"
    );
}

fs.writeFileSync(tablePath, tableCode, 'utf8');
console.log('Injected logic into DashboardTable.jsx');
