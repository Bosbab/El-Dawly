const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const out = [];
try { out.push('GIT: ' + execSync('git --version').toString().trim()); } catch(e){ out.push('GIT: NOT FOUND'); }
try { out.push('GH: ' + execSync('gh --version').toString().split('\n')[0]); } catch(e){ out.push('GH: NOT FOUND'); }
try { const r = execSync('git rev-parse --is-inside-work-tree').toString().trim(); out.push('IS_GIT_REPO: ' + r); } catch(e){ out.push('IS_GIT_REPO: ' + e.message); }
try { out.push('REMOTE: ' + execSync('git remote -v').toString().trim()); } catch(e){ out.push('REMOTE: ' + e.message); }

fs.writeFileSync(path.join(__dirname, 'deploy-check.txt'), out.join('\n'));
console.log(out.join('\n'));
