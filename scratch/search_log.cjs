const fs = require('fs');
const log = fs.readFileSync('scratch/prev_log.txt', 'utf8');

// "selector" または "picker" という言葉を含むコードブロックを探す
const lines = log.split('\n');
let results = [];
for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes('selector') || lines[i].toLowerCase().includes('picker')) {
        results.push(`Line ${i}: ${lines[i].substring(0, 200)}`);
    }
}

fs.writeFileSync('scratch/log_search_results.txt', results.join('\n'), 'utf8');
console.log('Found', results.length, 'potential matches.');
