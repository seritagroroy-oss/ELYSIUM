const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'src/components/Dashboard.jsx');
let dCode = fs.readFileSync(dashboardPath, 'utf8');

// Imports to add
if (!dCode.includes("import GlobalConfigMenu")) {
    dCode = dCode.replace(
        "import ReadOnlyAlert from './modals/ReadOnlyAlert';",
        "import ReadOnlyAlert from './modals/ReadOnlyAlert';\nimport GlobalConfigMenu from './modals/GlobalConfigMenu';"
    );
}

// GlobalConfigMenu (showSiteSettings)
// We need to safely extract this. It starts with {showSiteSettings && (
// and ends with </div>\n                      )} before the FAQ button.
const globalConfigRegex = /\{showSiteSettings && \([\s\S]*?Trier les sites :[\s\S]*?Tableau individuel[\s\S]*?<\/div>\s*<\/div>\s*\)\}/;
if (dCode.match(globalConfigRegex)) {
    dCode = dCode.replace(globalConfigRegex, `{showSiteSettings && (
                        <GlobalConfigMenu
                          siteSortOrder={siteSortOrder}
                          setSiteSortOrder={setSiteSortOrder}
                          cardDesign={cardDesign}
                          setCardDesign={setCardDesign}
                          showAgentCountHover={showAgentCountHover}
                          setShowAgentCountHover={setShowAgentCountHover}
                          enableAnimations={enableAnimations}
                          setEnableAnimations={setEnableAnimations}
                          editModeBehavior={editModeBehavior}
                          setEditModeBehavior={setEditModeBehavior}
                          setRobustBehavior={setRobustBehavior}
                          setIsEditMode={setIsEditMode}
                          agentTableMode={agentTableMode}
                          setAndSaveAgentTableMode={setAndSaveAgentTableMode}
                        />
                      )}`);
} else {
    console.log("Could not find globalConfigRegex match!");
}

fs.writeFileSync(dashboardPath, dCode, 'utf8');
console.log("GlobalConfigMenu a ete extrait avec succes !");
