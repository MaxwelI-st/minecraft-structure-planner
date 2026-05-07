const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'js', 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove the event listeners in _setup3DViewTab
// We look for the block I added
const patternToRemove = /\s+\/\/\s*───\s*置換元・置換先ピッカー\s*───[\s\S]*?this\._openBlockDropdown\('to'\);\s*\}\);/g;

if (content.match(patternToRemove)) {
    content = content.replace(patternToRemove, '');
    console.log('Removed event listeners.');
} else {
    console.log('Could not find event listeners pattern.');
}

// 2. Remove the _openBlockDropdown method
const methodPattern = /\/\*\*[\s\S]*?_openBlockDropdown\(mode\) \{[\s\S]*?\n    \}/g;

if (content.match(methodPattern)) {
    content = content.replace(methodPattern, '');
    console.log('Removed _openBlockDropdown method.');
} else {
    console.log('Could not find _openBlockDropdown method pattern.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done.');
