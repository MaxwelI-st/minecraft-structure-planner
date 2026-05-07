const fs = require('fs');
const logPath = "C:\\Users\\maita\\.gemini\\antigravity\\brain\\df64e5f4-a47b-44b3-8ead-a69a43e7222d\\.system_generated\\logs\\overview.txt";

try {
    const log = fs.readFileSync(logPath, 'utf8');
    
    // ログは1行ごとのJSONまたは巨大なJSONの可能性がある。
    // overview.txt は各アクションが新しい行で始まることが多い。
    const lines = log.split('\n');
    let bestCatalog = '';
    
    for (let line of lines) {
        if (line.includes('BLOCK_CATALOG')) {
            // エスケープされた改行コードを考慮して抽出
            const start = line.indexOf('const BLOCK_CATALOG = [');
            if (start !== -1) {
                const end = line.indexOf('];', start);
                if (end !== -1) {
                    let catalog = line.substring(start, end + 2);
                    // アンエスケープ
                    catalog = catalog.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                    if (catalog.length > bestCatalog.length) {
                        bestCatalog = catalog;
                    }
                }
            }
        }
    }
    
    if (bestCatalog) {
        fs.writeFileSync('scratch/extracted_catalog.js', bestCatalog, 'utf8');
        console.log('Extracted best catalog. Length:', bestCatalog.length);
    } else {
        console.log('Could not find any valid catalog definition.');
    }
} catch (err) {
    console.error('Error:', err);
}
