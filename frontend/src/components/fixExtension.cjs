const fs = require('fs');
const path = require('path');

const hookOldPath = path.join(__dirname, '..', 'hooks', 'useDashboardActions.js');
const hookNewPath = path.join(__dirname, '..', 'hooks', 'useDashboardActions.jsx');
const dashboardPath = path.join(__dirname, 'Dashboard.jsx');

// Rename the hook file
if (fs.existsSync(hookOldPath)) {
    fs.renameSync(hookOldPath, hookNewPath);
    console.log('Renamed useDashboardActions.js to useDashboardActions.jsx');
} else {
    console.log('useDashboardActions.jsx already exists or file is missing.');
}

// Ensure the hook itself imports React
let hookCode = fs.readFileSync(hookNewPath, 'utf8');
if (!hookCode.includes("import React")) {
    hookCode = "import React from 'react';\n" + hookCode;
    fs.writeFileSync(hookNewPath, hookCode);
    console.log('Added import React to useDashboardActions.jsx');
}

// Update the import path in Dashboard.jsx if needed (though usually Vite resolves .jsx automatically without extension, but we should make sure the extension is either omitted or correct)
let dashboardCode = fs.readFileSync(dashboardPath, 'utf8');
if (dashboardCode.includes("import { useDashboardActions } from '../hooks/useDashboardActions.js'")) {
    dashboardCode = dashboardCode.replace(
        "import { useDashboardActions } from '../hooks/useDashboardActions.js'",
        "import { useDashboardActions } from '../hooks/useDashboardActions'"
    );
    fs.writeFileSync(dashboardPath, dashboardCode);
    console.log('Updated import in Dashboard.jsx');
} else if (dashboardCode.includes("import { useDashboardActions } from '../hooks/useDashboardActions'")) {
    console.log('Import in Dashboard.jsx is already correct (extensionless).');
}

