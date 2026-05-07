// 素材一覧の sources 配列を修正する
// Bedrockリソースパックからテクスチャが取得された場合、Wikiフォールバックを含めない
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'js', 'app.js');
let content = fs.readFileSync(file, 'utf8');

// \r\n を正規化して検索
const oldPattern = [
    '            const sources = [',
    '                ...(iconUrl ? [iconUrl] : []),',
    '                `https://minecraft.wiki/images/Invicon_${wikiName}.png`,'
].join('\r\n');

const newPattern = [
    '            // リソースパックからテクスチャが見つかった場合はWikiフォールバック不要',
    '            // （Blob URLは常にローカルで読み込めるため、onerrorで上書きされるのを防止）',
    '            const sources = iconUrl',
    '                ? [iconUrl]',
    '                : [',
    '                `https://minecraft.wiki/images/Invicon_${wikiName}.png`,'
].join('\r\n');

if (content.includes(oldPattern)) {
    content = content.replace(oldPattern, newPattern);
    fs.writeFileSync(file, content, 'utf8');
    console.log('OK: sources配列を修正しました');
} else {
    console.log('WARN: パターンが見つかりません');
    const idx = content.indexOf('const sources = [');
    if (idx !== -1) {
        console.log('Context:', JSON.stringify(content.substring(idx, idx + 200)));
    }
}
