const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'js', 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

// Use a more surgical approach
content = content.replace(/if \(e && \(e\.name === "QuotaExceededError" \|\| \/quota\/i\.test\(e\.message\)\)\) \{ \|\| \/quota\/i\.test\(e\.message\)\)\) \{/g, 'if (e && (e.name === "QuotaExceededError" || /quota/i.test(e.message))) {');

// Fix the other one if it's doubled too
content = content.replace(/if \(json\.length > 4 \* 1024 \* 1024\) \{ if \(json\.length > 4 \* 1024 \* 1024\) \{/g, 'if (json.length > 4 * 1024 * 1024) {');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed again.');
