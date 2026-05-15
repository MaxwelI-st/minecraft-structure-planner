import { normalizeId } from '../bedrock_normalize.js';

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
                const reduced = projects.slice(0, Math.max(1, Math.floor(projects.length / 2)));
                try {
                    localStorage.setItem(this.KEY, JSON.stringify(reduced));
                    console.warn('localStorage 容量超のため古いプロジェクトを削減:', projects.length, '→', reduced.length);
                } catch (e2) {
                    console.error('削減後も保存失敗:', e2);
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
            parsedAt: Date.now()
        };
        project.structures.push(s);
        return s;
    }

    static getIntegrated(project, replacementsByStructure) {
        const totals = new Map();
        for (const s of project.structures) {
            const mult = s.multiplier || 1;
            const repMap = replacementsByStructure?.get(s.id);
            for (const r of s.results) {
                const normRId = normalizeId(r.id);
                const to = repMap ? (repMap.get(normRId) || repMap.get('minecraft:' + normRId.replace('minecraft:', '')) || repMap.get(normRId.replace('minecraft:', ''))) : null;
                const id = to || normRId;
                const lowId = id.toLowerCase();
                if (lowId === 'minecraft:air' || lowId === 'air') continue;
                const existing = totals.get(id) || 0;
                totals.set(id, existing + r.count * mult);
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
