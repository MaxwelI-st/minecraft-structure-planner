const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'js', 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

// _renderBlockList 内の sources 配列から Wiki URL を削除する
// 修正対象のパターン:
/*
            const sources = iconUrl
                ? [iconUrl]
                : [
                `https://minecraft.wiki/images/Invicon_${wikiName}.png`,
                `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2270%22>📦</text></svg>`
            ];
*/

const pattern = /const sources = iconUrl\s*\? \[iconUrl\]\s*: \[\s*`https:\/\/minecraft\.wiki\/images\/Invicon_\$\{wikiName\}\.png`,\s*(`data:image\/svg\+xml,<svg xmlns=%22http:\/\/www\.w3\.org\/2000\/svg%22 viewBox=%220 0 100 100%22><text y=%22\.9em%22 font-size=%2270%22>📦<\/text><\/svg>`) \];/g;

// シンプルな置換にする（正規表現が複雑すぎると失敗しやすいため）
const targetStr = '`https://minecraft.wiki/images/Invicon_${wikiName}.png`,';
if (content.includes(targetStr)) {
    content = content.replace(targetStr, '');
    console.log('Removed Wiki fallback URL from sources.');
} else {
    console.log('Target Wiki URL not found.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done.');
