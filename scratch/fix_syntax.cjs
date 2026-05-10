const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'js', 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the commented out IF statement and other potential issues in ProjectManager.save
content = content.replace(/\/\/ ~5MB.*if \(json\.length > 4 \* 1024 \* 1024\) \{/g, '// ~5MB warning\n            if (json.length > 4 * 1024 * 1024) {');

// Also fix the other mojibake comments that might be hiding code
content = content.replace(/\/\/ .*QuotaExceededError.*if \(e && \(e\.name === 'QuotaExceededError'/g, '// QuotaExceededError handling\n            if (e && (e.name === "QuotaExceededError" || /quota/i.test(e.message))) {');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed.');
