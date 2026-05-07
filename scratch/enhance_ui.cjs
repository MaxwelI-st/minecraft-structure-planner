const fs = require('fs');
const jsPath = 'js/app.js';
const cssPath = 'css/style.css';

try {
    // 1. Update js/app.js _renderBlockSelectorGrid
    let js = fs.readFileSync(jsPath, 'utf8');
    const newRenderMethod = `    _renderBlockSelectorGrid(query = '', cat = 'all') {
        const grid = document.getElementById('block-selector-grid');
        if (!grid) return;

        const q = query.toLowerCase();
        const filtered = BLOCK_CATALOG.filter(b => {
            const matchQ = b.ja.includes(q) || b.id.replace('minecraft:', '').includes(q);
            const matchCat = cat === 'all' || b.cat === cat;
            return matchQ && matchCat;
        });

        grid.innerHTML = '';
        const frag = document.createDocumentFragment();
        filtered.forEach(b => {
            const card = document.createElement('div');
            card.className = 'block-pick-card';
            
            let html = \`<div class="block-pick-name">\${b.ja}</div>\`;
            
            if (b.variants) {
                // Render variant color chips
                html += '<div class="variant-grid">';
                b.variants.forEach(v => {
                    html += \`<div class="variant-chip" title="\${v.ja}" style="background:\${v.hex}" data-id="\${v.id}"></div>\`;
                });
                html += '</div>';
            }
            
            card.innerHTML = html;
            
            if (b.variants) {
                card.querySelectorAll('.variant-chip').forEach(chip => {
                    chip.onclick = (e) => {
                        e.stopPropagation();
                        this._selectFromPicker(chip.dataset.id);
                    };
                });
            } else {
                card.onclick = () => this._selectFromPicker(b.id);
            }
            
            frag.appendChild(card);
        });
        grid.appendChild(frag);
    }

    _selectFromPicker(id) {
        const targetInput = document.getElementById('replace-to');
        if (targetInput) {
            targetInput.value = id;
            targetInput.dispatchEvent(new Event('input'));
        }
        this._hideModal('modal-block-selector');
    }
`;

    const startMarker = '    _renderBlockSelectorGrid(query = \'\', cat = \'all\') {';
    const startIdx = js.indexOf(startMarker);
    const endIdx = js.indexOf('\n    }', startIdx); // Find end of the method
    
    if (startIdx !== -1 && endIdx !== -1) {
        js = js.substring(0, startIdx) + newRenderMethod + js.substring(endIdx + 6);
    }

    fs.writeFileSync(jsPath, js, 'utf8');
    console.log('Updated _renderBlockSelectorGrid in app.js');

    // 2. Update css/style.css
    let css = fs.readFileSync(cssPath, 'utf8');
    const newCss = `
/* --- Block Picker Improvements --- */
.block-pick-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 0.8rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0.6rem;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    min-height: 80px;
    border-bottom: 2px solid transparent;
}
.block-pick-card:hover {
    background: rgba(255,255,255,0.08);
    border-color: var(--primary);
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    border-bottom: 2px solid var(--primary);
}
.block-pick-name {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text);
    text-align: center;
}
.variant-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 3px;
    width: 100%;
}
.variant-chip {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    border: 1px solid rgba(255,255,255,0.1);
    cursor: pointer;
    transition: transform 0.1s;
}
.variant-chip:hover {
    transform: scale(1.4);
    z-index: 2;
    border-color: #fff;
    box-shadow: 0 0 8px rgba(255,255,255,0.5);
}
`;
    fs.appendFileSync(cssPath, newCss, 'utf8');
    console.log('Appended new styles to style.css');

} catch (err) {
    console.error('Error:', err);
}
