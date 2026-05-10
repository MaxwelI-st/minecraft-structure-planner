const fs = require('fs');
const logPath = "C:\\Users\\maita\\.gemini\\antigravity\\brain\\df64e5f4-a47b-44b3-8ead-a69a43e7222d\\.system_generated\\logs\\overview.txt";

try {
    const log = fs.readFileSync(logPath, 'utf8');
    
    // ログ内では "const BLOCK_CATALOG = [" のようにエスケープされた改行を含む形式で入っている
    // 最も長い BLOCK_CATALOG らしき区間を抽出
    const regex = /const BLOCK_CATALOG = \[(.*?)\];/g;
    let match;
    let bestMatch = '';

    while ((match = regex.exec(log)) !== null) {
        if (match[0].length > bestMatch.length) {
            bestMatch = match[0];
        }
    }

    if (bestMatch) {
        // アンエスケープ処理
        let catalog = bestMatch
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
            .replace(/\\r/g, ''); // 万が一の \r 対策

        fs.writeFileSync('scratch/extracted_catalog.js', catalog, 'utf8');
        console.log('Extracted best catalog via Regex. Length:', catalog.length);
    } else {
        console.log('Could not find BLOCK_CATALOG with regex.');
        
        // 最終手段: "BLOCK_CATALOG" という文字列を含む巨大な行を探す
        const lines = log.split('\n');
        for (let line of lines) {
            if (line.length > 5000 && line.includes('BLOCK_CATALOG')) {
                console.log('Found a massive line containing BLOCK_CATALOG. Analyzing...');
                const start = line.indexOf('const BLOCK_CATALOG = [');
                if (start !== -1) {
                    const end = line.indexOf('];', start);
                    if (end !== -1) {
                        let catalog = line.substring(start, end + 2)
                            .replace(/\\n/g, '\n')
                            .replace(/\\"/g, '"')
                            .replace(/\\\\/g, '\\');
                        fs.writeFileSync('scratch/extracted_catalog.js', catalog, 'utf8');
                        console.log('Extracted massive catalog. Length:', catalog.length);
                        break;
                    }
                }
            }
        }
    }
} catch (err) {
    console.error('Error:', err);
}
