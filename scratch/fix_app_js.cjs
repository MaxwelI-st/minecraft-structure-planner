const fs = require('fs');
const path = 'js/app.js';

try {
    let content = fs.readFileSync(path, 'utf8');
    console.log('Original length:', content.length);

    // 8行目の改行崩れを修正
    // ─ が連続した後に何らかの文字があり、その直後に const BLOCK_CATALOG が来ているパターンを想定
    const fixed = content.replace(/\/\/ ─── Constants ─+[\s\S]*?const BLOCK_CATALOG/, "// ─── Constants ───────────────────\nconst BLOCK_CATALOG");

    if (content === fixed) {
        console.log('No change made. Pattern not found.');
        // パターンを少し緩めて再試行
        const fixed2 = content.replace(/\/\/ ─── Constants .*?const BLOCK_CATALOG/, "// ─── Constants ───────────────────\nconst BLOCK_CATALOG");
        if (content !== fixed2) {
            fs.writeFileSync(path, fixed2, 'utf8');
            console.log('Fixed using loose pattern.');
        }
    } else {
        fs.writeFileSync(path, fixed, 'utf8');
        console.log('Fixed using strict pattern.');
    }
} catch (err) {
    console.error('Error:', err);
}
