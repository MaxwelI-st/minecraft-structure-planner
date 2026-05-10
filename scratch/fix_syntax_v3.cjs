const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'js', 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all problematic console logs in ProjectManager.save
content = content.replace(/console\.warn\('localStorage 螳ｹ驥剰ｶ.* reduced\.length\);/g, "console.warn('Storage quota exceeded, reduced project count', projects.length, '->', reduced.length);");

// Check for other potential issues
// The error at line 43 was specifically about the string content.

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed line 43.');
