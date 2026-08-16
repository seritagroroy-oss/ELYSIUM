const fs = require('fs');
const path = require('path');

const newProps = [
    'enableAnimations',
    'setEnableAnimations',
    'clipboardWeek',
    'setClipboardWeek',
    'pasteConfirmModal',
    'setPasteConfirmModal',
    'handleCopyWeek',
    'handlePasteWeek',
    'handleConfirmPaste',
    'cancelPaste',
    'isZenMode',
    'setIsZenMode',
    'statsCardScale',
    'setStatsCardScale',
    'showAgentCountHover'
];

const dashboardPath = path.join(__dirname, 'src/components/Dashboard.jsx');
const tablePath = path.join(__dirname, 'src/components/tables/DashboardTable.jsx');

let dashboardCode = fs.readFileSync(dashboardPath, 'utf8');
let tableCode = fs.readFileSync(tablePath, 'utf8');

// 1. Add to DashboardTable.jsx signature
const startTable = 'export default function DashboardTable({';
const endTable = '}) {';
const sigStartIndex = tableCode.indexOf(startTable) + startTable.length;
const sigEndIndex = tableCode.indexOf(endTable, sigStartIndex);

let signature = tableCode.substring(sigStartIndex, sigEndIndex);
const existingPropsTable = signature.split(',').map(s => s.trim());

newProps.forEach(prop => {
    if (!existingPropsTable.includes(prop)) {
        signature += `, ${prop}`;
    }
});

tableCode = tableCode.substring(0, sigStartIndex) + '\n  ' + signature.trim() + '\n' + tableCode.substring(sigEndIndex);
fs.writeFileSync(tablePath, tableCode, 'utf8');

// 2. Add to Dashboard.jsx <DashboardTable ... />
const startTag = '<DashboardTable';
const endTag = '/>';
const tagStartIndex = dashboardCode.indexOf(startTag);
const tagEndIndex = dashboardCode.indexOf(endTag, tagStartIndex);

let tagContent = dashboardCode.substring(tagStartIndex, tagEndIndex);

newProps.forEach(prop => {
    if (!tagContent.includes(`${prop}=`)) {
        tagContent += `            ${prop}={${prop}}\n`;
    }
});

dashboardCode = dashboardCode.substring(0, tagStartIndex) + tagContent + dashboardCode.substring(tagEndIndex);
fs.writeFileSync(dashboardPath, dashboardCode, 'utf8');

console.log('Added missing props to Dashboard.jsx and DashboardTable.jsx');
