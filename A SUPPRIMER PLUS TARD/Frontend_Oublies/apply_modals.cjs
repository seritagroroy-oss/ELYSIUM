const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'src/components/Dashboard.jsx');
let dCode = fs.readFileSync(dashboardPath, 'utf8');

// Imports to add
const imports = `import ReposConfirmModal from './modals/ReposConfirmModal';
import ZoneConfigModal from './modals/ZoneConfigModal';
import RenameAgentModal from './modals/RenameAgentModal';
import ReadOnlyAlert from './modals/ReadOnlyAlert';\n`;

if (!dCode.includes("import ReposConfirmModal")) {
    dCode = dCode.replace(
        "import DeployReleveModal from './modals/DeployReleveModal';",
        "import DeployReleveModal from './modals/DeployReleveModal';\n" + imports
    );
}

// 1. ReposConfirmModal
const reposRegex = /\{reposConfirmData && \([\s\S]*?<div className="modal-overlay"[\s\S]*?Confirmer<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;
if (dCode.match(reposRegex)) {
    dCode = dCode.replace(reposRegex, `{reposConfirmData && (
        <ReposConfirmModal
          reposConfirmData={reposConfirmData}
          setReposConfirmData={setReposConfirmData}
          executeAssignRepos={executeAssignRepos}
        />
      )}`);
}

// 2. ZoneConfigModal
const zoneRegex = /\{zoneConfigModalData && \([\s\S]*?Configuration de la zone[\s\S]*?Enregistrer<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;
if (dCode.match(zoneRegex)) {
    dCode = dCode.replace(zoneRegex, `{zoneConfigModalData && (
        <ZoneConfigModal
          zoneConfigModalData={zoneConfigModalData}
          setZoneConfigModalData={setZoneConfigModalData}
          functions={functions}
          setShowManageFunctionsModal={setShowManageFunctionsModal}
          handleUpdateSubsiteConfig={handleUpdateSubsiteConfig}
        />
      )}`);
}

// 3. RenameAgentModal
const renameRegex = /\{showRenameAgentModal && \([\s\S]*?Modifier le nom de l'agent[\s\S]*?Enregistrer\s*<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;
if (dCode.match(renameRegex)) {
    dCode = dCode.replace(renameRegex, `{showRenameAgentModal && (
        <RenameAgentModal
          renameAgentTarget={renameAgentTarget}
          renameAgentNewName={renameAgentNewName}
          setRenameAgentNewName={setRenameAgentNewName}
          onClose={() => setShowRenameAgentModal(false)}
          onSubmit={async () => {
            if (!renameAgentNewName.trim()) { alert("Le nom ne peut pas être vide"); return; }
            try {
              const { apiCall } = require('../api');
              const res = await apiCall('update_agent_info', {
                agent_id: renameAgentTarget.id, field: 'name', value: renameAgentNewName.trim(), period: period
              });
              if (res.success) { loadDashboardData(); setShowRenameAgentModal(false); }
              else { alert("Erreur lors de la modification du nom : " + (res.message || res.error || 'Erreur inconnue')); }
            } catch (e) { console.error(e); alert("Erreur de connexion"); }
          }}
        />
      )}`);
}

// 4. ReadOnlyAlert
const readOnlyRegex = /\{showReadOnlyAlert && \([\s\S]*?Mode Lecture activé[\s\S]*?J'ai compris\s*<\/button>\s*<\/div>\s*<\/div>\s*\)\}/;
if (dCode.match(readOnlyRegex)) {
    dCode = dCode.replace(readOnlyRegex, `{showReadOnlyAlert && (
        <ReadOnlyAlert setShowReadOnlyAlert={setShowReadOnlyAlert} />
      )}`);
}

fs.writeFileSync(dashboardPath, dCode, 'utf8');
console.log("Les 4 modales ont ete extraites et remplacees dans Dashboard.jsx avec succes !");
