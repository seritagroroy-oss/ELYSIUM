const fs = require('fs');
const code = fs.readFileSync('dashboard/SiteSelector.jsx', 'utf8');
const tags = code.match(/<([A-Z][a-zA-Z0-9]*)/g).map(t => t.slice(1));
const imports = code.match(/import .* from 'lucide-react'/)[0];
const standardHTML = ['div', 'span', 'h2', 'p', 'button', 'input', 'label', 'select', 'option'];
const missing = Array.from(new Set(tags)).filter(t => !imports.includes(t) && !['SiteSelector', 'RenameSiteModal', 'PointageCalendarModal', 'VerificationModal', 'Suspense'].includes(t) && !standardHTML.includes(t.toLowerCase()));
console.log("Missing imports:", missing);
