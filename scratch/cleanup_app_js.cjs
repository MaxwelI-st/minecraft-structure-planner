const fs = require('fs');
const path = 'js/app.js';

const MAP = {
    '板杁E': '板材',
    'ハEチE': 'ハーフ',
    'ブロチE': 'ブロック',
    'ゲーチE': 'ゲート',
    'ライチE': 'ライト',
    'チェスチE': 'チェスト',
    '本棁E': '本棚',
    '松昁E': '松明',
    '鉁E孁E': '鉄格子',
    '鎁E': '鎖',
    'クォーチE': 'クォーツ',
    'キャチEュ': 'キャッシュ',
    'ロジチE': 'ロジック',
    'チEスチャ': 'テクスチャ',
    'アチEローチE': 'アップロード',
    'リセチE': 'リセット',
    '完亁E': '完了',
    'チEタ': 'データ',
    'プロジェクチE': 'プロジェクト',
    'ぁE': 'い',
    'ぁE': 'あ',
    'E': 'の',
    '': ' ',
    '黁E': '黄色',
    '緁E': '緑',
    '薁EE色': '薄灰色',
    '閁E岩': '閃緑岩',
    '苔Eした': '苔むした',
    '赤ぁE岩': '赤砂岩'
};

try {
    let content = fs.readFileSync(path, 'utf8');
    let count = 0;
    for (const [key, val] of Object.entries(MAP)) {
        const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        if (content.includes(key)) {
            content = content.replace(regex, val);
            count++;
        }
    }
    
    // 特殊ケース: 引用符の直後の改行を削除
    content = content.replace(/ja: '[\r\n]+/g, "ja: '");
    
    fs.writeFileSync(path, content, 'utf8');
    console.log(`Replaced ${count} patterns.`);
} catch (err) {
    console.error('Error:', err);
}
