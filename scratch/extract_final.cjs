const fs = require('fs');
const logPath = "C:\\Users\\maita\\.gemini\\antigravity\\brain\\df64e5f4-a47b-44b3-8ead-a69a43e7222d\\.system_generated\\logs\\overview.txt";

try {
    const log = fs.readFileSync(logPath, 'utf8');
    const lines = log.split('\n');
    let longestLine = '';
    
    for (let line of lines) {
        if (line.includes('BLOCK_CATALOG') && line.length > longestLine.length) {
            longestLine = line;
        }
    }
    
    if (longestLine) {
        fs.writeFileSync('scratch/massive_line.txt', longestLine, 'utf8');
        console.log('Found massive line. Length:', longestLine.length);
        
        // 解析
        const startMarker = 'const BLOCK_CATALOG = [';
        const endMarker = '];';
        
        let start = longestLine.indexOf(startMarker);
        if (start === -1) {
            // エスケープされている可能性
            const escapedStart = 'const BLOCK_CATALOG = [';
            start = longestLine.indexOf(escapedStart);
        }
        
        if (start !== -1) {
            let end = longestLine.indexOf(endMarker, start);
            if (end !== -1) {
                let catalog = longestLine.substring(start, end + 2)
                    .replace(/\\n/g, '\n')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\');
                fs.writeFileSync('scratch/extracted_catalog.js', catalog, 'utf8');
                console.log('Successfully extracted catalog. Length:', catalog.length);
            } else {
                console.log('Could not find end marker in massive line.');
            }
        } else {
            console.log('Could not find start marker in massive line.');
        }
    } else {
        console.log('No line containing BLOCK_CATALOG found.');
    }
} catch (err) {
    console.error('Error:', err);
}
