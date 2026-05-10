const fs = require('fs');
const path = 'js/app.js';

try {
    let js = fs.readFileSync(path, 'utf8');
    
    // btn-replace-add の修正
    // 正規表現でトーストの行を狙い撃ち
    const regex = /this\._toast\(`置換追加: \${from\.replace\('minecraft:',''\)} .*?\${to\.replace\('minecraft:',''\)}`\);/;
    
    const newAddCode = `this._toast(\`置換追加: \${from.replace('minecraft:','')} -> \${to.replace('minecraft:','')}\`);
            
            // UIのリセット
            $('replace-to').value = '';
            $('replace-to-name').textContent = '選択してください...';
            $('replace-to-icon').src = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2270%22>📦</text></svg>";`;
            
    if (regex.test(js)) {
        js = js.replace(regex, newAddCode);
        console.log('Fixed btn-replace-add UI reset via regex.');
    } else {
        console.log('Could not find toast line even with regex.');
    }

    fs.writeFileSync(path, js, 'utf8');
} catch (err) {
    console.error(err);
}
