const fs = require('fs');
const path = 'js/app.js';

try {
    let js = fs.readFileSync(path, 'utf8');
    
    // 1. btn-replace-add の修正
    const oldAddCode = "this._toast(`置換追加: ${from.replace('minecraft:','')} ↁE${to.replace('minecraft:','')}`);";
    const newAddCode = `this._toast(\`置換追加: \${from.replace('minecraft:','')} -> \${to.replace('minecraft:','')}\`);
            
            // UIのリセット
            $('replace-to').value = '';
            $('replace-to-name').textContent = '選択してください...';
            $('replace-to-icon').src = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2270%22>📦</text></svg>";`;
            
    if (js.includes(oldAddCode)) {
        js = js.replace(oldAddCode, newAddCode);
        console.log('Fixed btn-replace-add UI reset.');
    } else {
        // 文字化けバージョンも試す
        const mojibakeCode = "this._toast(`置換追加: ${from.replace('minecraft:','')} ↁE${to.replace('minecraft:','')}`);";
        if (js.includes(mojibakeCode)) {
            js = js.replace(mojibakeCode, newAddCode);
            console.log('Fixed btn-replace-add UI reset (mojibake version).');
        }
    }

    fs.writeFileSync(path, js, 'utf8');
} catch (err) {
    console.error(err);
}
