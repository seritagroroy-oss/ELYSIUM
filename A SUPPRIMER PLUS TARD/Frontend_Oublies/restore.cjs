const { execSync } = require('child_process');

console.log("Restoring from desktop...");
execSync('node frontend/do_extract.cjs', { stdio: 'inherit' });

console.log("Injecting props...");
execSync('node frontend/fix_props_3.cjs', { stdio: 'inherit' });

console.log("Cleaning props...");
execSync('node frontend/run_cleanup.cjs', { stdio: 'inherit' });

console.log("ALL RESTORED!");
