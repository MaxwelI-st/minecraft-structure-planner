const fs = require('fs');
const path = 'js/app.js';

try {
    let content = fs.readFileSync(path, 'utf8');
    
    // 98行目の壊れた行を修正
    const brokenLine = "];deepslate_brick_wall', ja: '深層岩レンガの壁E, cat: 'fences' },";
    const fixedLine = "  { id: 'minecraft:deepslate_brick_wall', ja: '深層岩レンガの壁', cat: 'fences' },";
    
    if (content.includes(brokenLine)) {
        content = content.replace(brokenLine, fixedLine);
        fs.writeFileSync(path, content, 'utf8');
        console.log('Fixed line 98.');
    } else {
        console.log('Broken line 98 not found exactly. Trying partial match.');
        // 部分一致で試行
        const regex = /\];deepslate_brick_wall', ja: '深層岩レンガの壁.*?', cat: 'fences' \},/;
        if (regex.test(content)) {
            content = content.replace(regex, fixedLine);
            fs.writeFileSync(path, content, 'utf8');
            console.log('Fixed line 98 using regex.');
        } else {
            console.log('Could not find the broken pattern for line 98.');
        }
    }
} catch (err) {
    console.error('Error:', err);
}
