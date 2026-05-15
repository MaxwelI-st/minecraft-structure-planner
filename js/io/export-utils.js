import { NBTParser, NBTWriter, decompressIfNeeded } from './nbt-reader.js';

/**
 * export-utils.js — 出力処理層
 * CSV, Markdown, mcstructure (NBT) などへの変換・ダウンロード処理。
 * App インスタンスへの依存なし。純粋なデータ→ファイル変換のみ。
 */

/**
 * 合計素材リストを CSV としてダウンロードする
 * @param {Array}  integratedMaterials  ProjectManager.getIntegrated() の戻り値
 * @param {Object} langData             ブロックID→日本語名マップ
 * @param {string} projectName          ダウンロードファイル名に使うプロジェクト名
 */
export function exportCsv(integratedMaterials, langData, projectName) {
    if (!integratedMaterials) return;
    const lines = [];
    lines.push('id,name_ja,count,stacks,remainder,slots,category');
    for (const r of integratedMaterials) {
        const ja = langData[r.id] || r.id.replace('minecraft:', '');
        lines.push([
            r.id,
            '"' + ja.replace(/"/g, '""') + '"',
            r.count,
            r.stacks,
            r.remainder,
            r.slots,
            r.category,
        ].join(','));
    }
    const bom = '\ufeff';
    const csv = bom + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (projectName || 'materials') + '_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
}

/**
 * 合計素材リストを Markdown チェックリストとしてクリップボードへコピーする
 * @param {Array}   integratedMaterials  ProjectManager.getIntegrated() の戻り値
 * @param {Object}  langData             ブロックID→日本語名マップ
 * @param {Object}  project              現在のプロジェクトオブジェクト
 * @param {Element} btn                  コピー完了フィードバック用ボタン要素（省略可）
 * @returns {Promise<string>}            生成した Markdown テキスト
 */
export async function copyAsMarkdown(integratedMaterials, langData, project, btn) {
    if (!integratedMaterials || integratedMaterials.length === 0) {
        throw new Error('合計素材がありません');
    }
    const lines = [];
    lines.push(`### 🏰 ${project?.name || '建築'} 必要素材リスト`);
    const totalBlocks = integratedMaterials.reduce((a, r) => a + r.count, 0);
    const totalSlots = integratedMaterials.reduce((a, r) => a + r.slots, 0);
    const totalShulkers = Math.ceil(totalSlots / 27);
    lines.push(`> 合計: **${totalBlocks.toLocaleString()}ブロック / ${integratedMaterials.length}種類 / シュルカー箱 約${totalShulkers}個**`);
    lines.push('');
    for (const r of integratedMaterials) {
        const ja = langData[r.id] || r.id.replace('minecraft:', '');
        const sh = Math.floor(r.slots / 27);
        const shRem = r.slots % 27;
        const detail = sh > 0
            ? `${sh}シュルカー + ${shRem}スタック残 + ${r.remainder}個`
            : `${r.stacks}スタック + ${r.remainder}個`;
        lines.push(`- [ ] **${ja}**: ${r.count.toLocaleString()}個 (${detail})`);
    }
    if (project && project.structures.length > 1) {
        lines.push('');
        lines.push('### 📋 構造別内訳');
        for (const s of project.structures) {
            const mult = s.multiplier || 1;
            lines.push(`- **${s.name}** ×${mult}: ${(s.totalCount * mult).toLocaleString()}ブロック / ${s.uniqueCount || '?'}種類`);
        }
    }
    const text = lines.join('\n');
    try {
        await navigator.clipboard.writeText(text);
        if (btn) {
            const orig = btn.innerHTML;
            btn.innerHTML = '✅ コピー完了';
            btn.disabled = true;
            setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 1500);
        }
    } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    }
    return text;
}

/**
 * 全プロジェクトデータを JSON ファイルとしてエクスポートする
 * @param {Array} projects  プロジェクト配列
 */
export function exportAllProjects(projects) {
    const data = JSON.stringify({ projects, version: 2 }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mc_planner_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
}

/**
 * 置換を適用した .mcstructure (NBT) をダウンロードする
 * @param {ArrayBuffer} buf           元の mcstructure ArrayBuffer
 * @param {Map}         repMap        置換マップ <fromId, toId>
 * @param {string}      structureName ダウンロードファイル名に使う構造名
 * @returns {Promise<number>}         適用した置換件数
 */
export async function exportMcStructure(buf, repMap, structureName) {
    const data = await decompressIfNeeded(buf);
    const parser = new NBTParser(data, 'le');
    const parsed = parser.parse();

    const palette = parsed.value?.structure?.palette?.default?.block_palette;
    if (!palette) throw new Error('palette が見つかりません');

    let replacedCount = 0;
    if (repMap && repMap.size > 0) {
        for (const entry of palette) {
            const newName = repMap.get(entry.name);
            if (newName) {
                entry.name = newName;
                if (newName === 'minecraft:air') {
                    entry.states = {};
                }
                replacedCount++;
            }
        }
    }

    const writer = new NBTWriter('le');
    writer.writeRoot(parsed);
    const out = writer.toArrayBuffer();

    const blob = new Blob([out], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (structureName || 'structure') + '_modified.mcstructure';
    a.click();
    URL.revokeObjectURL(a.href);

    return replacedCount;
}
