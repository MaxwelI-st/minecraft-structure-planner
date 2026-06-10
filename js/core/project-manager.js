import { normalizeId, normalizeBedrockBlock } from '../bedrock_normalize.js';

// ─── Utilities ────────────────────────────────────────────────────────────────
export const uid = () => Math.random().toString(36).slice(2, 10);

// ─── ProjectManager ───────────────────────────────────────────────────────────
export class ProjectManager {
    static KEY = 'mc_planner_v2';
    static MAX_PROJECTS = 20;
    static STORAGE_WARNING_SIZE = 4 * 1024 * 1024; // 4MB

    static load() {
        try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); }
        catch { return []; }
    }

    static save(projects) {
        try {
            const toSave = projects.slice(0, ProjectManager.MAX_PROJECTS).map(p => ({
                ...p,
                structures: p.structures.map(s => {
                    const { coords, rawBuffer, ...rest } = s;
                    return rest;
                })
            }));
            const json = JSON.stringify(toSave);
            if (json.length > ProjectManager.STORAGE_WARNING_SIZE) {
                console.warn('プロジェクトJSON が 4MB 超：localStorage 上限に近づいています', json.length);
            }
            localStorage.setItem(this.KEY, json);
        } catch (e) {
            console.error('Save failed', e);
            if (e && (e.name === 'QuotaExceededError' || /quota/i.test(e.message))) {
                const keep = Math.max(1, Math.floor(projects.length / 2));
                const ok = typeof confirm === 'function'
                    ? confirm(`ストレージ容量が不足しています。\n古いプロジェクトを削除して保存しますか？\n（${projects.length} 件 → 最新 ${keep} 件を保持）`)
                    : true;
                if (ok) {
                    const reduced = projects.slice(0, keep);
                    try {
                        localStorage.setItem(this.KEY, JSON.stringify(reduced));
                        console.warn('localStorage 容量超のため古いプロジェクトを削減:', projects.length, '→', reduced.length);
                    } catch (e2) {
                        console.error('削減後も保存失敗:', e2);
                    }
                }
            }
        }
    }

    static create(name) {
        return { id: uid(), name, createdAt: Date.now(), structures: [] };
    }

    static addStructure(project, data) {
        if (!data.size || !Number.isFinite(data.size.x)) {
            throw new Error('構造データに size が不正です');
        }
        const wo = Array.isArray(data.worldOrigin) ? data.worldOrigin : [0, 0, 0];
        const s = {
            id: uid(),
            name: data.name,
            multiplier: 1,
            results: data.results,
            coords: data.coords,   // in-memory only
            size: data.size,
            totalCount: data.totalCount,
            uniqueCount: data.uniqueCount,
            totalSlots: data.totalSlots,
            // 初期位置 = パースした structure_world_origin（無ければ 0,0,0）
            worldOriginInit: { x: wo[0] || 0, y: wo[1] || 0, z: wo[2] || 0 },
            offset:          { x: wo[0] || 0, y: wo[1] || 0, z: wo[2] || 0 },
            parsedAt: Date.now()
        };
        project.structures.push(s);
        return s;
    }

    /** 構造の現在オフセット。古いプロジェクト（offset 未設定）も安全に扱える。 */
    static getOffset(s) {
        return s?.offset ?? { x: 0, y: 0, z: 0 };
    }

    /** リセット用の初期オフセット（パース時の worldOrigin）。古い構造は 0,0,0。 */
    static getInitialOffset(s) {
        return s?.worldOriginInit ?? { x: 0, y: 0, z: 0 };
    }

    /** Y軸回転ステップ (0=0°, 1=90°CW, 2=180°, 3=270°CW)。古い構造は 0。 */
    static getRotation(s) {
        return s?.rotation ?? 0;
    }

    /**
     * Y軸回転を適用してローカル座標を変換する。
     * @param {number} lx @param {number} lz  ローカル座標 (0-based)
     * @param {{x,y,z}} size  元の構造サイズ
     * @param {0|1|2|3} rot  回転ステップ
     * @returns {{rx:number, rz:number, rsx:number, rsz:number}}
     */
    static applyRotation(lx, lz, size, rot) {
        const sx = size.x, sz = size.z;
        switch (rot) {
            case 0: return { rx: lx,        rz: lz,        rsx: sx, rsz: sz };
            case 1: return { rx: sz-1-lz,   rz: lx,        rsx: sz, rsz: sx };
            case 2: return { rx: sx-1-lx,   rz: sz-1-lz,   rsx: sx, rsz: sz };
            case 3: return { rx: lz,        rz: sx-1-lx,   rsx: sz, rsz: sx };
            default: return { rx: lx, rz: lz, rsx: sx, rsz: sz };
        }
    }

    /** 回転後の有効サイズを返す */
    static rotatedSize(size, rot) {
        if (rot % 2 === 0) return { x: size.x, y: size.y, z: size.z };
        return { x: size.z, y: size.y, z: size.x };
    }

    /**
     * ブロック状態（facing / axis / direction 等）を Y軸 90°×rot 回転で書き換える。
     * blockId のサフィックス（_stairs / _door / _trapdoor / _fence_gate）でディスパッチ。
     * 90° CW を rot=1 step として、N→E→S→W→N の順に回す。
     *
     * state-reader.js の値マッピング表（実測 JSON 基準）に整合：
     *   STAIR_WD = ['east','west','south','north']
     *   DOOR_DIR = ['east','south','west','north']
     *   TRAPDOOR_DIR = ['west','east','north','south']
     *   FENCE_GATE_DIR = ['south','west','north','east']
     *   FACING6 = ['down','up','north','south','west','east']
     */
    static rotateBlockStates(states, rot, blockId) {
        if (!states || typeof states !== 'object') return states;
        rot = ((rot | 0) % 4 + 4) % 4;
        if (rot === 0) return states;

        const out = { ...states };
        const id = (blockId || '').toLowerCase();

        // ---- Bedrock 数値 state ----
        // facing_direction (6方向: D,U,N,S,W,E) 90°CW → N→E,S→W,W→N,E→S
        const FACING6_ROT = [0, 1, 5, 4, 2, 3];
        // weirdo_direction (階段専用 4方向: E,W,S,N) 90°CW
        const STAIR_ROT = [2, 3, 1, 0];
        // direction (4方向) — ブロック種別ごとに値の意味が異なるので分岐
        const DOOR_ROT       = [1, 2, 3, 0];   // [E,S,W,N]
        const TRAPDOOR_ROT   = [2, 3, 1, 0];   // [W,E,N,S]
        const FENCE_GATE_ROT = [1, 2, 3, 0];   // [S,W,N,E]

        const applyTable = (key, table) => {
            let v = out[key];
            if (v === undefined) return;
            // NBT wrap 解除（{value: n}）
            const wrapped = (v && typeof v === 'object' && 'value' in v);
            const raw = wrapped ? v.value : v;
            if (typeof raw !== 'number') return;
            let nv = raw;
            for (let i = 0; i < rot; i++) nv = table[nv] ?? nv;
            out[key] = wrapped ? { ...v, value: nv } : nv;
        };

        applyTable('facing_direction', FACING6_ROT);

        if ('weirdo_direction' in out || id.endsWith('_stairs') || id.endsWith('stairs')) {
            applyTable('weirdo_direction', STAIR_ROT);
        }
        if ('direction' in out) {
            let tbl = DOOR_ROT; // デフォルトは door 系
            if (id.endsWith('_trapdoor') || id.includes('trapdoor')) tbl = TRAPDOOR_ROT;
            else if (id.endsWith('_fence_gate') || id.includes('fence_gate')) tbl = FENCE_GATE_ROT;
            applyTable('direction', tbl);
        }

        // ground_sign_direction / standing_sign_direction (0-15)、看板 90° = +4
        for (const k of ['ground_sign_direction', 'sign_direction']) {
            const v = out[k];
            if (v === undefined) continue;
            const wrapped = (v && typeof v === 'object' && 'value' in v);
            const raw = wrapped ? v.value : v;
            if (typeof raw !== 'number') continue;
            const nv = (raw + 4 * rot) & 15;
            out[k] = wrapped ? { ...v, value: nv } : nv;
        }

        // pillar_axis ("x"/"y"/"z") — rot 奇数で x↔z
        if (out.pillar_axis !== undefined) {
            const wrapped = (typeof out.pillar_axis === 'object' && 'value' in out.pillar_axis);
            const raw = wrapped ? out.pillar_axis.value : out.pillar_axis;
            if (typeof raw === 'string' && rot % 2 === 1) {
                const nv = raw === 'x' ? 'z' : raw === 'z' ? 'x' : raw;
                out.pillar_axis = wrapped ? { ...out.pillar_axis, value: nv } : nv;
            }
        }

        // ---- Java 文字列 state ----
        // facing: north→east→south→west→north (90°CW)
        const FACING_STR_NEXT = { north: 'east', east: 'south', south: 'west', west: 'north' };
        if (typeof out.facing === 'string') {
            let nv = out.facing;
            for (let i = 0; i < rot; i++) nv = FACING_STR_NEXT[nv] ?? nv;
            out.facing = nv;
        }
        // ---- 新形式 Bedrock 文字列 state (1.20.40+) ----
        // minecraft:cardinal_direction (水平4方向: repeater/comparator 等)
        // minecraft:facing_direction  (6方向 string: observer 等。up/down は不変)
        // ※ cardinal_direction は「入力側」を指す規約だが、Y軸回転は入力/出力を
        //   同時に回すので raw 値をそのまま 90°CW ずつ回せば正しい。
        for (const k of ['minecraft:cardinal_direction', 'minecraft:facing_direction']) {
            const v = out[k];
            if (v === undefined) continue;
            const wrapped = (v && typeof v === 'object' && 'value' in v);
            const raw = wrapped ? v.value : v;
            if (typeof raw !== 'string' || !(raw in FACING_STR_NEXT)) continue;
            let nv = raw;
            for (let i = 0; i < rot; i++) nv = FACING_STR_NEXT[nv] ?? nv;
            out[k] = wrapped ? { ...v, value: nv } : nv;
        }
        // axis: x↔z (rot 奇数)
        if (typeof out.axis === 'string' && rot % 2 === 1) {
            out.axis = out.axis === 'x' ? 'z' : out.axis === 'z' ? 'x' : out.axis;
        }
        // rotation (Java sign 0-15): +4 per 90°
        if (out.rotation !== undefined) {
            const raw = typeof out.rotation === 'string' ? parseInt(out.rotation, 10) : out.rotation;
            if (Number.isFinite(raw)) {
                out.rotation = (raw + 4 * rot) & 15;
            }
        }

        return out;
    }

    static getIntegrated(project, replacementsByStructure) {
        const totals = new Map();
        for (const s of project.structures) {
            const mult = s.multiplier || 1;
            const repMap = replacementsByStructure?.get(s.id);
            for (const r of s.results) {
                let normRId = normalizeId(r.id);
                let countMul = 1;
                // 古いキャッシュ救済: state情報なしでも正規化を試みる
                const norm = normalizeBedrockBlock(normRId, {});
                if (norm && norm.id && norm.id !== normRId && !norm.skip) {
                    normRId = norm.id;
                    if (norm.increment && norm.increment > 1) countMul = norm.increment;
                }
                const to = repMap ? (repMap.get(normRId) || repMap.get('minecraft:' + normRId.replace('minecraft:', '')) || repMap.get(normRId.replace('minecraft:', ''))) : null;
                const id = to || normRId;
                const lowId = id.toLowerCase();
                if (lowId === 'minecraft:air' || lowId === 'air') continue;
                const existing = totals.get(id) || 0;
                totals.set(id, existing + r.count * mult * countMul);
            }
        }
        return Array.from(totals.entries()).map(([id, count]) => {
            const stacks = Math.floor(count / 64);
            const remainder = count % 64;
            const slots = stacks + (remainder > 0 ? 1 : 0);
            const sample = project.structures.flatMap(s => s.results).find(r => r.id === id);
            return { id, count, stacks, remainder, slots, category: sample?.category || 'other' };
        }).sort((a, b) => b.count - a.count);
    }
}
