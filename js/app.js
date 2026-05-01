import { NBTParser } from './nbt.js';

class App {
    constructor() {
        this.worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.selectFileBtn = document.getElementById('select-file-btn');
        this.manualSelectBtn = document.getElementById('manual-select-btn');
        this.clipboardBtn = document.getElementById('clipboard-import-btn');
        this.summarySection = document.getElementById('summary');
        this.resultsSection = document.getElementById('results');
        this.blockList = document.getElementById('block-list');
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.searchInput = document.getElementById('search-input');
        this.toastContainer = document.getElementById('toast-container');
        
        // フィルター & プロジェクト関連
        this.currentCategory = 'all';
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.btnProjects = document.getElementById('btn-projects');
        this.idToggle = document.getElementById('id-toggle');
        this.wikiToggle = document.getElementById('wiki-toggle');
        this.modal = document.getElementById('project-modal');
        this.closeModal = document.getElementById('close-modal');
        this.projectList = document.getElementById('project-list');
        
        this.langData = {};
        this.preparedItems = new Set();
        this.currentResults = [];
        this.currentFileName = '';
        this.projects = JSON.parse(localStorage.getItem('mc_projects') || '[]');

        this.init();
    }

    async init() {
        try {
            const res = await fetch('./data/lang_ja.json');
            this.langData = await res.json();
            const saved = localStorage.getItem('prepared_items');
            this.preparedItems = new Set(saved ? JSON.parse(saved) : []);
        } catch (e) {
            console.error('データの読み込みに失敗しました', e);
            this.showToast('⚠️ 言語データの読み込みに失敗しました', 'error');
        }
        this.setupEventListeners();
    }

    setupEventListeners() {
        const triggerFile = () => this.fileInput.click();
        this.selectFileBtn.addEventListener('click', triggerFile);
        this.manualSelectBtn.addEventListener('click', triggerFile);
        
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('active');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('active');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('active');
            this.handleFiles(e.dataTransfer.files);
        });

        this.clipboardBtn.addEventListener('click', () => this.handleClipboardImport());

        this.searchInput.addEventListener('input', () => this.filterResults());
        
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentCategory = btn.dataset.category;
                this.filterResults();
            });
        });

        this.btnProjects.addEventListener('click', () => this.showProjects());
        this.idToggle.addEventListener('change', () => this.filterResults());
        this.wikiToggle.addEventListener('change', () => this.filterResults());
        this.closeModal.addEventListener('click', () => this.modal.classList.add('hidden'));
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.modal.classList.add('hidden');
        });

        this.blockList.addEventListener('change', (e) => {
            if (e.target.classList.contains('prepared-check')) {
                const id = e.target.dataset.id;
                if (e.target.checked) this.preparedItems.add(id);
                else this.preparedItems.delete(id);
                localStorage.setItem('prepared_items', JSON.stringify([...this.preparedItems]));
                e.target.closest('.block-card').classList.toggle('prepared', e.target.checked);
            }
        });

        // 拡張機能からの貼り付け対応
        window.addEventListener('paste', async (e) => {
            const text = e.clipboardData.getData('text');
            this.processImportText(text);
        });

        this.worker.onmessage = (e) => {
            const { success, results, totalCount, uniqueCount, totalSlots, error } = e.data;
            this.hideLoading();
            if (success) {
                this.renderResults(results, totalCount, uniqueCount, totalSlots);
                this.saveProject(results, totalCount, uniqueCount, totalSlots);
                this.showToast('🎉 解析が完了しました！');
            } else {
                this.showToast('❌ 解析に失敗しました: ' + error, 'error');
            }
        };
    }

    async handleClipboardImport() {
        try {
            const text = await navigator.clipboard.readText();
            if (!this.processImportText(text)) {
                this.showToast('📋 クリップボードに有効なデータがありません', 'error');
            }
        } catch (err) {
            this.showToast('🚫 クリップボードへのアクセスが拒否されました', 'error');
        }
    }

    processImportText(text) {
        try {
            const data = JSON.parse(text);
            if (data.source === 'MC_DOT_COUNTER') {
                this.currentFileName = data.name || 'Extension Import';
                this.renderResults(data.results, data.total, data.unique, data.totalSlots);
                this.saveProject(data.results, data.total, data.unique, data.totalSlots);
                this.showToast('🔗 拡張機能からデータを同期しました！');
                this.summarySection.scrollIntoView({ behavior: 'smooth' });
                return true;
            }
        } catch (err) {
            return false;
        }
        return false;
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> ${message}`;
        this.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    handleFiles(files) {
        if (files.length === 0) return;
        const file = files[0];
        this.currentFileName = file.name.replace('.mcstructure', '');
        const reader = new FileReader();
        reader.onload = (e) => {
            this.showLoading();
            this.worker.postMessage({ buffer: e.target.result });
        };
        reader.readAsArrayBuffer(file);
    }

    saveProject(results, total, unique, totalSlots) {
        if (!this.currentFileName) return;
        const project = { name: this.currentFileName, date: Date.now(), results, total, unique, totalSlots };
        const index = this.projects.findIndex(p => p.name === project.name);
        if (index > -1) this.projects[index] = project;
        else this.projects.unshift(project);
        if (this.projects.length > 20) this.projects.pop();
        localStorage.setItem('mc_projects', JSON.stringify(this.projects));
    }

    showProjects() {
        this.projectList.innerHTML = '';
        if (this.projects.length === 0) {
            this.projectList.innerHTML = '<div style="color:var(--text-muted); padding:20px; text-align:center;">プロジェクトがありません</div>';
        }
        this.projects.forEach((p, index) => {
            const item = document.createElement('div');
            item.className = 'project-item';
            item.innerHTML = `
                <div class="project-info">
                    <span class="project-name">${p.name}</span>
                    <span class="project-date">${new Date(p.date).toLocaleString()}</span>
                </div>
                <button class="mc-btn secondary delete-btn" data-index="${index}">削除</button>
            `;
            item.onclick = (e) => {
                if (e.target.classList.contains('delete-btn')) {
                    e.stopPropagation();
                    this.projects.splice(index, 1);
                    localStorage.setItem('mc_projects', JSON.stringify(this.projects));
                    this.showProjects();
                } else {
                    this.currentFileName = p.name;
                    this.renderResults(p.results, p.total, p.unique, p.totalSlots);
                    this.modal.classList.add('hidden');
                }
            };
            this.projectList.appendChild(item);
        });
        this.modal.classList.remove('hidden');
    }

    renderResults(results, total, unique, totalSlots) {
        this.currentResults = results;
        this.resultsSection.classList.remove('hidden');
        this.summarySection.classList.remove('hidden');
        this.dropZone.classList.add('hidden');

        document.querySelector('#stat-total .value').textContent = total.toLocaleString();
        document.querySelector('#stat-unique .value').textContent = unique.toLocaleString();
        const boxesNeeded = Math.ceil(totalSlots / 27);
        document.querySelector('#stat-shulkers .value').textContent = boxesNeeded.toLocaleString();

        this.filterResults();
    }

    filterResults() {
        const query = this.searchInput.value.toLowerCase();
        const filtered = this.currentResults.filter(r => {
            const name = (this.langData[r.id] || r.id).toLowerCase();
            const matchesQuery = name.includes(query) || r.id.toLowerCase().includes(query);
            const matchesCategory = this.currentCategory === 'all' || r.category === this.currentCategory;
            return matchesQuery && matchesCategory;
        });

        this.blockList.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        filtered.forEach(item => {
            const isPrepared = this.preparedItems.has(item.id);
            const card = document.createElement('div');
            card.className = `glass-card block-card ${isPrepared ? 'prepared' : ''}`;
            
            const rawId = item.id.replace('minecraft:', '');
            const displayName = this.idToggle.checked ? rawId : (this.langData[item.id] || rawId);
            let imgId = rawId;
            
            // Bedrock to Java/Wiki mapping
            const idMap = {
                'brick_block': 'bricks',
                'double_stone_block_slab': 'stone',
                'stone_block_slab': 'stone_slab',
                'iron_chain': 'chain',
                'grass': 'grass_block',
                'hardened_clay': 'terracotta',
                'stained_hardened_clay': 'terracotta',
                'sealantern': 'sea_lantern'
            };
            
            if (idMap[imgId]) imgId = idMap[imgId];
            const cleanId = imgId.replace('waxed_', '');
            
            const wikiName = imgId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('_');
            const cleanWikiName = cleanId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('_');
            
            const sources = [
                `https://minecraft.wiki/images/Invicon_${wikiName}.png`,
                `https://minecraft.wiki/images/Invicon_${cleanWikiName}.png`,
                `https://assets.mcasset.cloud/1.21.1/assets/minecraft/textures/item/${imgId}.png`,
                `https://assets.mcasset.cloud/1.21.1/assets/minecraft/textures/block/${imgId}.png`,
                `https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21/items/${imgId}.png`,
                `/textures/${imgId}.png`
            ];

            const placeholder = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>📦</text></svg>';
            const wikiUrl = `https://ja.minecraft.wiki/w/${encodeURIComponent(displayName)}`;

            const shulkerCount = Math.floor(item.slots / 27);
            const shulkerText = shulkerCount > 0 ? `<div class="shulker-badge">${shulkerCount}箱 + ${item.stacks % 27}st + ${item.remainder}個</div>` : '';

            card.innerHTML = `
                <a href="${wikiUrl}" target="_blank" class="wiki-link-overlay ${this.wikiToggle.checked ? '' : 'hidden'}" title="Wikiで見る"></a>
                <input type="checkbox" class="prepared-check" data-id="${item.id}" ${isPrepared ? 'checked' : ''}>
                <div class="block-icon">
                    <img src="${sources[0]}" class="mc-icon" onerror="this.onerror=null; this.src='${sources[1]}'; this.onerror=()=>this.src='${sources[2]}'; this.onerror=()=>this.src='${sources[3]}'; this.onerror=()=>this.src='${sources[4]}'; this.onerror=()=>this.src='${sources[5]}'; this.onerror=()=>this.src='${placeholder}';" alt="">
                </div>
                <div class="block-info">
                    <div class="block-name ${this.idToggle.checked ? 'is-id' : ''}" title="${displayName}" data-fullid="${item.id}">${displayName}</div>
                    <div class="block-count">${item.count.toLocaleString()}</div>
                    <div class="stack-info">${item.stacks}st + ${item.remainder}個</div>
                </div>
                ${shulkerText}
            `;
            
            // コピー機能
            const nameEl = card.querySelector('.block-name');
            nameEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const idToCopy = nameEl.dataset.fullid;
                navigator.clipboard.writeText(idToCopy).then(() => {
                    this.showToast(`📋 コピーしました: ${idToCopy}`);
                });
            });

            fragment.appendChild(card);
        });

        this.blockList.appendChild(fragment);
    }

    showLoading() { this.loadingOverlay.classList.remove('hidden'); }
    hideLoading() { this.loadingOverlay.classList.add('hidden'); }
}

new App();
