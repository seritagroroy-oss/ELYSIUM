const fs = require('fs');
const path = require('path');

const hookPath = path.join(__dirname, '..', 'hooks', 'useDashboardActions.js');
const dashboardPath = path.join(__dirname, 'Dashboard.jsx');

const hookCode = fs.readFileSync(hookPath, 'utf8');
const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');

// 1. Get all variables exported/defined inside useDashboardActions
const definedVars = new Set();
const definedRegex = /(?:const|let|var|function)\s+([a-zA-Z0-9_$]+)\b/g;
let match;
while ((match = definedRegex.exec(hookCode)) !== null) {
  definedVars.add(match[1]);
}

// Add parameters and inside destructurings manually identified inside hook if any (but we are looking for undefined)

// 2. Find all words in useDashboardActions
const allWords = new Set(hookCode.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g));

const ignoreList = new Set([
  'import', 'from', 'const', 'let', 'var', 'if', 'else', 'return', 'true', 'false', 'null', 'undefined',
  'function', 'async', 'await', 'React', 'useState', 'useEffect', 'useMemo', 'useCallback', 'useRef',
  'className', 'style', 'onClick', 'onChange', 'onMouseEnter', 'onMouseLeave', 'onDragStart', 'onDragOver', 'onDragEnd',
  'div', 'span', 'button', 'input', 'label', 'form', 'h1', 'h2', 'h3', 'h4', 'p', 'strong', 'em',
  'map', 'filter', 'reduce', 'forEach', 'some', 'every', 'find', 'includes', 'push', 'pop', 'slice', 'splice', 'findIndex', 'flatMap',
  'length', 'String', 'Number', 'Boolean', 'Object', 'Array', 'Date', 'Math', 'JSON', 'console', 'window', 'document',
  'localStorage', 'sessionStorage', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Promise', 'Error',
  'e', 'ev', 'event', 'target', 'value', 'checked', 'clientX', 'clientY', 'stopPropagation', 'preventDefault', 'dataTransfer', 'setData', 'effectAllowed',
  'id', 'name', 'type', 'key', 'index', 'idx', 'item', 'site', 'agent', 'zone', 'period', 'action', 'state', 'actions', 'props',
  'flex', 'padding', 'margin', 'background', 'color', 'border', 'borderRadius', 'boxShadow', 'transform', 'transition',
  'require', 'module', 'exports', 'process', 'env', 'log', 'error', 'warn', 'info',
  'catch', 'then', 'finally', 'try', 'throw', 'new', 'this', 'super', 'class', 'extends', 'constructor',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent',
  'toLocaleDateString', 'toISOString', 'padStart', 'padEnd', 'toLowerCase', 'toUpperCase', 'trim', 'split', 'join',
  'replace', 'match', 'test', 'exec', 'search', 'substring', 'substr', 'charAt', 'charCodeAt', 'indexOf', 'lastIndexOf',
  'keys', 'values', 'entries', 'assign', 'freeze', 'seal', 'defineProperty', 'defineProperties', 'hasOwnProperty',
  'isPrototypeOf', 'propertyIsEnumerable', 'toString', 'toLocaleString', 'valueOf', 'prototype', '__proto__',
  'useDashboardActions', 'apiCall', 'getCyclePeriodForDate', 'alert', 'navigator', 'clipboard', 'writeText', 'Math', 'round', 'min', 'max'
]);

const missingVars = [];

for (const word of allWords) {
  if (ignoreList.has(word)) continue;
  if (definedVars.has(word)) continue;
  
  // Is it defined in Dashboard.jsx? (as state)
  // Usually the state variables are inside Dashboard.jsx before line 264, or inside useDashboardState
  if (dashboardCode.includes(` ${word},`) || dashboardCode.includes(` ${word} `) || dashboardCode.includes(`${word}:`) || dashboardCode.includes(`[${word},`)) {
      missingVars.push(word);
  }
}

// Deduplicate
const uniqueMissingVars = [...new Set(missingVars)].sort();

fs.writeFileSync(path.join(__dirname, 'missing_actions_props.txt'), uniqueMissingVars.join('\n'));
console.log('Props to inject found:', uniqueMissingVars.length);
