const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("Restoring from desktop...");
execSync('node frontend/do_extract.cjs', { stdio: 'inherit' });
execSync('node frontend/fix_props_3.cjs', { stdio: 'inherit' });
execSync('node frontend/run_cleanup.cjs', { stdio: 'inherit' });
execSync('node frontend/inject_transfer_props.cjs', { stdio: 'inherit' });

console.log("Applying transfer logic perfectly safely...");
const dashboardPath = path.join(__dirname, 'src/components/Dashboard.jsx');
let dCode = fs.readFileSync(dashboardPath, 'utf8');

// Ensure TransferDetailsModal is imported
if (!dCode.includes('import TransferDetailsModal')) {
    dCode = dCode.replace(
        "import TransferModal from './modals/TransferModal';",
        "import TransferModal from './modals/TransferModal';\nimport TransferDetailsModal from './modals/TransferDetailsModal';"
    );
}

// Very safe regex to remove old transferModal using [\s\S]*? up to the next closing tag
const oldModalRegex = /\{transferModal && \([\s\S]*?<TransferModal[\s\S]*?\/>\s*\}\)/;
if (dCode.match(oldModalRegex)) {
    dCode = dCode.replace(oldModalRegex, '');
}

// Add our new state variables if not exist
if (!dCode.includes('const [showTransferModal, setShowTransferModal]')) {
    dCode = dCode.replace(
        "const [viewMode, setViewMode] = useState('current');",
        "const [viewMode, setViewMode] = useState('current');\n  const [showTransferModal, setShowTransferModal] = useState(false);\n  const [transferModalData, setTransferModalData] = useState(null);\n  const [showTransferDetailsModal, setShowTransferDetailsModal] = useState(false);\n  const [transferDetailsData, setTransferDetailsData] = useState(null);"
    );
}

// Inject new modals rendering securely at the end of the file, right before the last </div>
const newModals = `      {showTransferModal && (
        <TransferModal
          data={transferModalData}
          onClose={() => { setShowTransferModal(false); setTransferModalData(null); }}
          onSave={async (mutation) => {
            const { agentId, dateKey, shiftCode, targetSite, replacedAgent, motif } = mutation;
            const newStatus = \`T|\${targetSite}|\${replacedAgent}|\${motif}\`;
            await handleCellClick(agentId, dateKey, shiftCode, '', newStatus);
            setShowTransferModal(false);
            setTransferModalData(null);
          }}
        />
      )}
      
      {showTransferDetailsModal && (
        <TransferDetailsModal
          data={transferDetailsData}
          onClose={() => { setShowTransferDetailsModal(false); setTransferDetailsData(null); }}
          onDelete={async (data) => {
             await handleCellClick(data.agentId, data.dateKey, data.shiftCode, 'T', '1');
             setShowTransferDetailsModal(false);
             setTransferDetailsData(null);
          }}
        />
      )}
    </div>
  );
}`;
dCode = dCode.replace(/<\/div>\s*\);\s*}\s*$/, newModals);

// Update onAction handler
if (!dCode.includes("code === 'T'")) {
    dCode = dCode.replace(
        "if (code === 'RENAME_AGENT') {",
        `if (code === 'T') {
              if (agent) {
                setTransferModalData({ agentId: ctx.agentId, dateKey: ctx.dateKey, shiftCode: ctx.shiftCode, agentName: agent.name });
                setShowTransferModal(true);
              }
            } else if (code === 'RENAME_AGENT') {`
    );
}

fs.writeFileSync(dashboardPath, dCode, 'utf8');

const tablePath = path.join(__dirname, 'src/components/tables/DashboardTable.jsx');
let tCode = fs.readFileSync(tablePath, 'utf8');

if (!tCode.includes("status.startsWith('T')")) {
    tCode = tCode.replace(
        "} else if (status === 'T') {",
        "} else if (status && status.startsWith('T')) {"
    );
}
if (!tCode.includes("const isTransfere = status && status.startsWith('T')")) {
    tCode = tCode.replace(
        "const isAbsence = status === 'A';",
        "const isAbsence = status === 'A';\n                                      const isTransfere = status && status.startsWith('T');\n                                      let transferTarget = '', transferReplaced = '', transferMotif = '';\n                                      if (isTransfere) {\n                                        const parts = status.split('|');\n                                        if (parts.length > 1) transferTarget = parts[1];\n                                        if (parts.length > 2) transferReplaced = parts[2];\n                                        if (parts.length > 3) transferMotif = parts[3];\n                                      }"
    );

    tCode = tCode.replace(
        "onClick={(e) => {",
        "onClick={(e) => {\n                                        if (isTransfere) return; // Blocked"
    );

    tCode = tCode.replace(
        "onContextMenu={(e) => {",
        "onContextMenu={(e) => {\n                                        if (isTransfere) {\n                                          e.preventDefault();\n                                          setTransferDetailsData({ agentId: agent.id, agentName: agent.name, dateKey: dk, shiftCode: sc, targetSite: transferTarget, replacedAgent: transferReplaced, motif: transferMotif });\n                                          setShowTransferDetailsModal(true);\n                                          return;\n                                        }"
    );
}

fs.writeFileSync(tablePath, tCode, 'utf8');

console.log('ALL DONE! Compilation should now work flawlessly.');
