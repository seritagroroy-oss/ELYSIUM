const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/components/tables/DashboardTable.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

const target = `                                        if (status === 'P' && lockedPermissions[agent.id]) return;
                                        if (status && status.startsWith('Suppl')) return;
                                        if (status === 'T' || (status && status.startsWith('T|'))) return;`;

const replacement = `                                        if (status === 'P' && lockedPermissions[agent.id]) return;
                                        if (status === 'A' && lockedAbsences[agent.id]) return;
                                        if (status === 'MAP' && lockedMaps[agent.id]) return;
                                        if (status && status.startsWith('Suppl')) return;
                                        if (status === 'T' || (status && status.startsWith('T|'))) return;`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log("Successfully restored locked checks!");
} else {
  console.log("Could not find the target string.");
}
