const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'src/components/Dashboard.jsx');
let code = fs.readFileSync(dashboardPath, 'utf8');

if (!code.includes('import TransferDetailsModal')) {
    code = code.replace(
        "import TransferModal from './modals/TransferModal';",
        "import TransferModal from './modals/TransferModal';\nimport TransferDetailsModal from './modals/TransferDetailsModal';"
    );
}

if (!code.includes('const [showTransferModal')) {
    code = code.replace(
        "const [viewMode, setViewMode] = useState('current');",
        "const [viewMode, setViewMode] = useState('current');\n  const [showTransferModal, setShowTransferModal] = useState(false);\n  const [transferModalData, setTransferModalData] = useState(null);\n  const [showTransferDetailsModal, setShowTransferDetailsModal] = useState(false);\n  const [transferDetailsData, setTransferDetailsData] = useState(null);"
    );
}

if (!code.includes('<TransferDetailsModal')) {
    code = code.replace(
        "{showDeployExtra && (",
        `{showTransferModal && (
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
             // Effacer = revenir à Présent (1)
             await handleCellClick(data.agentId, data.dateKey, data.shiftCode, '', '1');
             setShowTransferDetailsModal(false);
             setTransferDetailsData(null);
          }}
        />
      )}
      
      {showDeployExtra && (`
    );
}

if (!code.includes("code === 'T'")) {
    code = code.replace(
        "if (code === 'RENAME_AGENT') {",
        `if (code === 'T') {
              if (agent) {
                setTransferModalData({ agentId: ctx.agentId, dateKey: ctx.dateKey, shiftCode: ctx.shiftCode, agentName: agent.name });
                setShowTransferModal(true);
              }
            } else if (code === 'RENAME_AGENT') {`
    );
}

// Add state propagation for showTransferDetailsModal
// Wait, I need to pass setTransferDetailsModalData and setShowTransferDetailsModal to DashboardTable!
// Dashboard.jsx passes setTransferModalData ? No, DashboardTable will just call setTransferDetailsModal!
// Wait! I need to update Dashboard.jsx to pass `setTransferDetailsData` and `setShowTransferDetailsModal`
// Since DashboardTable props are injected by fix_props, I just need to add them to fix_props_3 list!

fs.writeFileSync(dashboardPath, code, 'utf8');
console.log("Safe injection completed!");
