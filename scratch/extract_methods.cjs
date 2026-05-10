const fs = require('fs');
const logPath = 'scratch/prev_log.txt';

try {
    const log = fs.readFileSync(logPath, 'utf8');
    
    // メソッド抽出用のパターン
    const methods = ['_openBlockSelector', '_renderBlockSelectorGrid'];
    let extracted = {};

    methods.forEach(method => {
        // メソッド名から始まり、次のメソッドまたはクラスの終わりまでを抽出
        // ログ内では \n や \" がエスケープされている
        const regex = new RegExp(`${method}\\\\s*\\\\(.*?\\\\)\\\\s*\\\\{(.*?)\\\\n\\\\s{4}_|${method}\\\\s*\\\\(.*?\\\\)\\\\s*\\\\{(.*?)\\\\n\\\\s{4}\\}`, 's');
        
        // 単純にキーワードを含む巨大なチャンクを探す
        const lines = log.split('\n');
        for (let line of lines) {
            if (line.includes(method)) {
                // ツールコールの引数の中から抽出を試みる
                const start = line.indexOf(`${method}(`);
                if (start !== -1) {
                    const end = line.indexOf('}', start + 100); // 簡易的な終端
                    if (end !== -1) {
                        let code = line.substring(start, end + 1)
                            .replace(/\\n/g, '\n')
                            .replace(/\\"/g, '"')
                            .replace(/\\\\/g, '\\');
                        extracted[method] = code;
                    }
                }
            }
        }
    });

    if (Object.keys(extracted).length > 0) {
        fs.writeFileSync('scratch/extracted_methods.js', JSON.stringify(extracted, null, 2), 'utf8');
        console.log('Extracted methods:', Object.keys(extracted));
    } else {
        console.log('Could not extract methods via simple search. Trying more aggressive approach...');
        // ログ全体からメソッド定義を力技で探す
        const content = log.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        methods.forEach(method => {
            const start = content.lastIndexOf(`    ${method}(`);
            if (start !== -1) {
                // 次のメソッドまたはクラス終了 } まで
                const end = content.indexOf('\n    _', start + 10);
                if (end !== -1) {
                    extracted[method] = content.substring(start, end);
                } else {
                    // クラスの最後かもしれない
                    const classEnd = content.indexOf('\n}', start);
                    if (classEnd !== -1) extracted[method] = content.substring(start, classEnd);
                }
            }
        });
        fs.writeFileSync('scratch/extracted_methods.js', JSON.stringify(extracted, null, 2), 'utf8');
        console.log('Aggressive extraction results:', Object.keys(extracted));
    }
} catch (err) {
    console.error('Error:', err);
}
