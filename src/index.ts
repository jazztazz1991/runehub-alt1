import * as a1lib from 'alt1/base';
import TargetMobReader from 'alt1/targetmob';
import { ROTATIONS, BOSS_NAME_MAP, BossPhase, BossRotation, SavedCustomRotation } from './rotations';
import { ABILITIES, WIKI_IMG, CombatStyle, AbilityCategory, CATEGORY_LABELS, STYLE_LABELS } from './abilities';

if (a1lib.hasAlt1) {
    alt1.identifyAppUrl('https://jazztazz1991.github.io/runehub-alt1/appconfig.json');
}

function mixColor(r: number, g: number, b: number, a: number = 255): number {
    return (((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)) >>> 0;
}

// ── Icon loader ───────────────────────────────────────────────────────────────
// Icon key = wikiFile (TitleCase_Underscores, e.g. "Invoke_Death").
// Tries our GitHub Pages icons/ first (filename lowercased), then RS3 wiki.

const LOCAL_ICON_BASE = 'https://jazztazz1991.github.io/runehub-alt1/icons/';
const ICON_SIZE = 40;
const iconCache = new Map<string, string | null>();

async function loadIcon(wikiFile: string): Promise<void> {
    if (iconCache.has(wikiFile)) return;
    iconCache.set(wikiFile, null);
    const urls = [
        LOCAL_ICON_BASE + wikiFile.toLowerCase() + '.png',
        WIKI_IMG + wikiFile + '.png',
    ];
    for (const url of urls) {
        try {
            const resp = await fetch(url);
            if (!resp.ok) continue;
            const blob = await resp.blob();
            const bitmap = await createImageBitmap(blob, { resizeWidth: ICON_SIZE, resizeHeight: ICON_SIZE });
            const canvas = document.createElement('canvas');
            canvas.width = ICON_SIZE; canvas.height = ICON_SIZE;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(bitmap, 0, 0);
            const { data: rgba } = ctx.getImageData(0, 0, ICON_SIZE, ICON_SIZE);
            const bgra = new Uint8Array(rgba.length);
            for (let i = 0; i < rgba.length; i += 4) {
                bgra[i] = rgba[i+2]; bgra[i+1] = rgba[i+1]; bgra[i+2] = rgba[i]; bgra[i+3] = rgba[i+3];
            }
            let bin = '';
            for (let i = 0; i < bgra.length; i++) bin += String.fromCharCode(bgra[i]);
            iconCache.set(wikiFile, btoa(bin));
            console.log('[RH] icon loaded:', wikiFile, 'from', url);
            drawOverlay();
            return;
        } catch {}
    }
    console.log('[RH] icon FAILED:', wikiFile);
}

function preloadRotationIcons(): void {
    for (const boss of Object.values(ROTATIONS)) {
        for (const phase of boss.phases) {
            for (const ability of phase.rotation) {
                if (ability.icon) loadIcon(ability.icon);
            }
        }
    }
}

const reader   = new TargetMobReader();
const POLL_MS  = 200;
const GCD_MS   = 1800;
const OV_GROUP = 'rh-rotation';
const BOX_W = 120, BOX_H = 50, BOX_GAP = 8;
const TOTAL_W = BOX_W * 3 + BOX_GAP * 2;

// ── DOM references ────────────────────────────────────────────────────────────

const panelEl          = document.getElementById('panel')!;
const bossSelectEl     = document.getElementById('boss-select') as HTMLSelectElement;
const setupNoteEl      = document.getElementById('setup-note')!;
const stepCounter      = document.getElementById('step-counter')!;
const startBtn         = document.getElementById('start-btn') as HTMLButtonElement;
const resetBtn         = document.getElementById('reset-btn') as HTMLButtonElement;
const setposBtn        = document.getElementById('setpos-btn') as HTMLButtonElement;
const editRotationsBtn = document.getElementById('edit-rotations-btn') as HTMLButtonElement;
const editorListEl     = document.getElementById('editor-list')!;
const editorDetailEl   = document.getElementById('editor-detail')!;
const abilityPickerEl  = document.getElementById('ability-picker')!;

// ── Overlay position ──────────────────────────────────────────────────────────

let ovRelX = 0, ovRelY = 0, hasCustomPosition = false, isSelectingLocation = false;

const storedRelX = localStorage.getItem('rh-ov-rx');
const storedRelY = localStorage.getItem('rh-ov-ry');
if (storedRelX !== null && storedRelY !== null) {
    ovRelX = parseInt(storedRelX, 10);
    ovRelY = parseInt(storedRelY, 10);
    hasCustomPosition = true;
}

function getOverlayOrigin(): { x: number; y: number } {
    if (isSelectingLocation && a1lib.hasAlt1) {
        const mpos = a1lib.getMousePosition();
        if (mpos) return { x: alt1.rsX + mpos.x - Math.floor(TOTAL_W/2), y: alt1.rsY + mpos.y - Math.floor(BOX_H/2) };
    }
    if (hasCustomPosition && a1lib.hasAlt1) return { x: alt1.rsX + ovRelX, y: alt1.rsY + ovRelY };
    return { x: alt1.rsX + Math.floor((alt1.rsWidth - TOTAL_W)/2), y: alt1.rsY + alt1.rsHeight - BOX_H - 110 };
}

function enterPositioningMode(): void {
    isSelectingLocation = true;
    setposBtn.textContent = '⊕ Setting... (Alt+1 to lock)';
    setposBtn.classList.add('selecting');
    drawOverlay();
}

function lockPosition(rsRelX: number, rsRelY: number): void {
    ovRelX = rsRelX - Math.floor(TOTAL_W/2);
    ovRelY = rsRelY - Math.floor(BOX_H/2);
    hasCustomPosition = true;
    localStorage.setItem('rh-ov-rx', String(ovRelX));
    localStorage.setItem('rh-ov-ry', String(ovRelY));
    isSelectingLocation = false;
    setposBtn.textContent = '⊕ Set Overlay Position';
    setposBtn.classList.remove('selecting');
    drawOverlay();
}

a1lib.on('alt1pressed', (e) => { if (isSelectingLocation) lockPosition(e.mouseRs.x, e.mouseRs.y); });
setposBtn.addEventListener('click', enterPositioningMode);

// ── Custom rotations ──────────────────────────────────────────────────────────

const CUSTOM_KEY = 'rh-custom-rotations';
const customRotations = new Map<string, SavedCustomRotation>();

function loadCustomRotations(): void {
    try {
        const raw = localStorage.getItem(CUSTOM_KEY);
        if (!raw) return;
        const arr: SavedCustomRotation[] = JSON.parse(raw);
        for (const cr of arr) customRotations.set(cr.id, cr);
    } catch {}
}

function saveCustomRotations(): void {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify([...customRotations.values()]));
}

function customToRotation(cr: SavedCustomRotation): BossRotation {
    return {
        bossName: cr.name, style: cr.style, setupNote: cr.setupNote,
        phases: [{ label: 'Main', triggerTarget: cr.bossTarget, rotation: cr.abilities }],
    };
}

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getBossRotationByKey(key: string): BossRotation | null {
    if (key.startsWith('custom:')) {
        const cr = customRotations.get(key.slice(7));
        return cr ? customToRotation(cr) : null;
    }
    return ROTATIONS[key] ?? null;
}

// ── Dropdown ──────────────────────────────────────────────────────────────────

function refreshDropdown(): void {
    const currentVal = bossSelectEl.value;
    while (bossSelectEl.options.length > 1) bossSelectEl.remove(1);
    for (const [key, boss] of Object.entries(ROTATIONS)) {
        const opt = document.createElement('option');
        opt.value = key; opt.textContent = boss.bossName;
        bossSelectEl.appendChild(opt);
    }
    if (customRotations.size > 0) {
        const sep = document.createElement('option');
        sep.disabled = true; sep.textContent = '── Custom ──';
        bossSelectEl.appendChild(sep);
        for (const [id, cr] of customRotations) {
            const opt = document.createElement('option');
            opt.value = 'custom:' + id; opt.textContent = cr.name;
            bossSelectEl.appendChild(opt);
        }
    }
    bossSelectEl.value = currentVal;
    if (!bossSelectEl.value) bossSelectEl.value = '';
}

bossSelectEl.addEventListener('change', () => {
    const val = bossSelectEl.value;
    manualBossKey = val || null;
    if (!detectedBossKey) {
        if (manualBossKey) { const boss = getBossRotationByKey(manualBossKey); if (boss) loadBoss(boss, boss.phases[0]); }
        else setIdle();
    }
});

// ── Rotation state ────────────────────────────────────────────────────────────

let manualBossKey: string | null = null;
let detectedBossKey: string | null = null;
let currentPhase: BossPhase | null = null;
let currentBoss: BossRotation | null = null;
let rotationIndex = 0, isRunning = false;
let gcdTimer: ReturnType<typeof setInterval> | null = null;
let lastTargetName = '', initialHp: number | null = null;

// ── Timer ─────────────────────────────────────────────────────────────────────

function startGcd(): void {
    if (isRunning || !currentPhase) return;
    isRunning = true; startBtn.textContent = '⏸'; startBtn.classList.add('running');
    gcdTimer = setInterval(() => advance(), GCD_MS);
}
function pauseGcd(): void {
    if (gcdTimer) { clearInterval(gcdTimer); gcdTimer = null; }
    isRunning = false; startBtn.textContent = '▶'; startBtn.classList.remove('running');
}
function advance(): void {
    if (!currentPhase) return;
    rotationIndex = (rotationIndex + 1) % currentPhase.rotation.length;
    updatePanel(); drawOverlay();
}
function resetRotation(): void { pauseGcd(); rotationIndex = 0; initialHp = null; updatePanel(); drawOverlay(); }

// ── Load / idle ───────────────────────────────────────────────────────────────

function loadBoss(boss: BossRotation, phase: BossPhase): void {
    currentBoss = boss; currentPhase = phase; rotationIndex = 0; initialHp = null;
    setupNoteEl.textContent = boss.setupNote ?? '';
    // Preload icons for this rotation's abilities
    for (const ab of phase.rotation) { if (ab.icon) loadIcon(ab.icon); }
    updatePanel(); drawOverlay();
}
function setIdle(): void {
    pauseGcd(); currentBoss = null; currentPhase = null; rotationIndex = 0;
    setupNoteEl.textContent = ''; stepCounter.textContent = ''; clearOverlay();
}
function updatePanel(): void {
    if (!currentPhase) return;
    stepCounter.textContent = `${rotationIndex + 1} / ${currentPhase.rotation.length}`;
}

// ── Boss detection ────────────────────────────────────────────────────────────

function detectBossAndPhase(): { boss: BossRotation; phase: BossPhase; targetName: string; bossKey: string } | null {
    if (!a1lib.hasAlt1) return null;
    let state; try { state = reader.read(); } catch { return null; }
    if (!state?.name) return null;
    const lower = state.name.toLowerCase();
    for (const [fragment, bossKey] of BOSS_NAME_MAP) {
        if (lower.includes(fragment)) {
            const boss = ROTATIONS[bossKey];
            const phase = boss.phases.find(p => p.triggerTarget && lower.includes(p.triggerTarget)) ?? boss.phases[0];
            return { boss, phase, targetName: state.name, bossKey };
        }
    }
    for (const [id, cr] of customRotations) {
        if (cr.bossTarget && lower.includes(cr.bossTarget)) {
            const boss = customToRotation(cr);
            return { boss, phase: boss.phases[0], targetName: state.name, bossKey: 'custom:' + id };
        }
    }
    return null;
}

// ── Overlay drawing ───────────────────────────────────────────────────────────

function drawOverlay(): void {
    if (!a1lib.hasAlt1 || (!currentPhase && !isSelectingLocation)) { clearOverlay(); return; }
    const { x, y } = getOverlayOrigin();
    if (!isFinite(x) || !isFinite(y)) return;
    const TIME = 1500;
    alt1.overLaySetGroup(OV_GROUP); alt1.overLayFreezeGroup(OV_GROUP); alt1.overLayClearGroup(OV_GROUP);
    let prev = { name: 'Prev', icon: undefined as string|undefined };
    let cur  = { name: 'Now',  icon: undefined as string|undefined };
    let nxt  = { name: 'Next', icon: undefined as string|undefined };
    if (currentPhase) {
        const r = currentPhase.rotation, l = r.length;
        const pa = r[(rotationIndex - 1 + l) % l], ca = r[rotationIndex], na = r[(rotationIndex + 1) % l];
        prev = { name: pa.name, icon: pa.icon }; cur = { name: ca.name, icon: ca.icon }; nxt = { name: na.name, icon: na.icon };
    }
    drawBox(x, y, prev.name, prev.icon, 'prev', TIME);
    drawBox(x + BOX_W + BOX_GAP, y, cur.name, cur.icon, 'current', TIME);
    drawBox(x + (BOX_W + BOX_GAP)*2, y, nxt.name, nxt.icon, 'next', TIME);
    if (isSelectingLocation) {
        alt1.overLayTextEx('Press Alt+1 to save position', mixColor(240,192,96,255), 11, x, y-16, TIME, 'chatbox', true, false);
    }
    alt1.overLayContinueGroup(OV_GROUP);
}

function drawBox(x: number, y: number, name: string, iconKey: string|undefined, type: 'prev'|'current'|'next', time: number): void {
    const borderW = type === 'current' ? 2 : 1;
    const borderColor = type === 'current' ? mixColor(240,192,96,255) : mixColor(80,80,80,180);
    alt1.overLayRect(borderColor, x, y, BOX_W, BOX_H, time, borderW);
    const iconBgra = iconKey ? iconCache.get(iconKey) ?? null : null;
    if (iconBgra) {
        const iconX = x + Math.floor((BOX_W - ICON_SIZE)/2), iconY = y + 4;
        let iconDrawn = false;
        try { alt1.overLayImage(iconX, iconY, iconBgra, ICON_SIZE, time); iconDrawn = true; } catch {}
        if (iconDrawn) {
            const lc = type === 'prev' ? mixColor(100,100,100,220) : type === 'next' ? mixColor(160,160,160,220) : mixColor(240,192,96,255);
            alt1.overLayTextEx(name, lc, 9, x+3, y+BOX_H-12, time, 'chatbox', true, false);
            return;
        }
    }
    if (type === 'current') alt1.overLayTextEx('NOW', mixColor(240,192,96,220), 9, x+4, y+4, time, 'chatbox', false, false);
    const nameColor = type === 'prev' ? mixColor(110,110,110,255) : type === 'next' ? mixColor(190,190,190,255) : mixColor(255,240,160,255);
    alt1.overLayTextEx(name, nameColor, type === 'current' ? 14 : 12, x+6, type === 'current' ? y+18 : y+16, time, 'chatbox', true, false);
}

function clearOverlay(): void {
    if (!a1lib.hasAlt1) return;
    alt1.overLaySetGroup(OV_GROUP); alt1.overLayFreezeGroup(OV_GROUP);
    alt1.overLayClearGroup(OV_GROUP); alt1.overLayContinueGroup(OV_GROUP);
}

// ── Poll ──────────────────────────────────────────────────────────────────────

function poll(): void {
    const result = detectBossAndPhase();
    if (!result) {
        if (detectedBossKey !== null) {
            detectedBossKey = null; lastTargetName = ''; pauseGcd();
            if (manualBossKey) { const boss = getBossRotationByKey(manualBossKey); if (boss) loadBoss(boss, boss.phases[0]); }
            else setIdle();
        }
        if (currentPhase || isSelectingLocation) drawOverlay();
        return;
    }
    const { boss, phase, targetName, bossKey } = result;
    detectedBossKey = bossKey;
    if (targetName !== lastTargetName) { lastTargetName = targetName; pauseGcd(); loadBoss(boss, phase); }
    if (!isRunning && currentPhase) {
        const hp = reader.state?.hp;
        if (hp) { if (initialHp === null) initialHp = hp; else if (hp < initialHp) startGcd(); }
    }
    drawOverlay();
}

startBtn.addEventListener('click', () => { isRunning ? pauseGcd() : startGcd(); });
resetBtn.addEventListener('click', resetRotation);

// ── Editor ────────────────────────────────────────────────────────────────────

type Page = 'main' | 'list' | 'detail' | 'picker';
let currentPage: Page = 'main';
let editingId: string | null = null;

interface EdAbility { name: string; icon?: string; }
let edAbilities: EdAbility[] = [];
let edRotationStyle: CombatStyle = 'necromancy';

const listBackBtn       = document.getElementById('list-back-btn') as HTMLButtonElement;
const newRotationBtn    = document.getElementById('new-rotation-btn') as HTMLButtonElement;
const customListItemsEl = document.getElementById('custom-list-items')!;
const customListEmptyEl = document.getElementById('custom-list-empty')!;
const detailBackBtn     = document.getElementById('detail-back-btn') as HTMLButtonElement;
const detailTitleEl     = document.getElementById('detail-title')!;
const edNameInput       = document.getElementById('ed-name') as HTMLInputElement;
const edBossTargetInput = document.getElementById('ed-boss-target') as HTMLInputElement;
const edStyleSel        = document.getElementById('ed-style') as HTMLSelectElement;
const edSetupNoteInput  = document.getElementById('ed-setup-note') as HTMLInputElement;
const edAbilityListEl   = document.getElementById('ed-ability-list')!;
const edAddAbilityBtn   = document.getElementById('ed-add-ability') as HTMLButtonElement;
const edDeleteBtn       = document.getElementById('ed-delete-btn') as HTMLButtonElement;
const edSaveBtn         = document.getElementById('ed-save-btn') as HTMLButtonElement;
const pickerBackBtn     = document.getElementById('picker-back-btn') as HTMLButtonElement;
const pickerTabsEl      = document.getElementById('picker-tabs')!;
const pickerGridEl      = document.getElementById('picker-grid')!;
const pickerManualInput = document.getElementById('picker-manual-input') as HTMLInputElement;
const pickerManualAdd   = document.getElementById('picker-manual-add') as HTMLButtonElement;

function showPage(page: Page): void {
    panelEl.style.display         = page === 'main'   ? '' : 'none';
    editorListEl.style.display    = page === 'list'   ? '' : 'none';
    editorDetailEl.style.display  = page === 'detail' ? '' : 'none';
    abilityPickerEl.style.display = page === 'picker' ? '' : 'none';
    currentPage = page;
}

function renderCustomList(): void {
    customListItemsEl.innerHTML = '';
    if (customRotations.size === 0) { customListEmptyEl.style.display = ''; return; }
    customListEmptyEl.style.display = 'none';
    for (const [id, cr] of customRotations) {
        const row = document.createElement('div');
        row.className = 'ed-list-row';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'ed-list-name'; nameSpan.textContent = cr.name;
        const editBtn = document.createElement('button');
        editBtn.className = 'ed-list-btn'; editBtn.textContent = '✎'; editBtn.title = 'Edit';
        editBtn.addEventListener('click', () => openDetail(id));
        const delBtn = document.createElement('button');
        delBtn.className = 'ed-list-btn ed-danger'; delBtn.textContent = '✕'; delBtn.title = 'Delete';
        delBtn.addEventListener('click', () => {
            customRotations.delete(id); saveCustomRotations(); refreshDropdown();
            if (manualBossKey === 'custom:' + id) { manualBossKey = null; bossSelectEl.value = ''; if (!detectedBossKey) setIdle(); }
            renderCustomList();
        });
        row.append(nameSpan, editBtn, delBtn);
        customListItemsEl.appendChild(row);
    }
}

function syncAbilityInputs(): void {
    edAbilityListEl.querySelectorAll<HTMLInputElement>('.ed-ability-name').forEach((input, i) => {
        edAbilities[i].name = input.value;
    });
}

function renderAbilityRows(): void {
    edAbilityListEl.innerHTML = '';
    edAbilities.forEach((ab, i) => {
        const row = document.createElement('div');
        row.className = 'ed-ability-row';

        const idx = document.createElement('span');
        idx.className = 'ed-ability-idx'; idx.textContent = `${i + 1}.`;

        // Icon thumbnail if available
        if (ab.icon) {
            const thumb = document.createElement('img');
            thumb.className = 'ed-ab-thumb';
            thumb.src = WIKI_IMG + ab.icon + '.png';
            thumb.width = 18; thumb.height = 18;
            thumb.onerror = () => { thumb.style.display = 'none'; };
            row.appendChild(idx);
            row.appendChild(thumb);
        } else {
            row.appendChild(idx);
        }

        const nameInput = document.createElement('input');
        nameInput.className = 'ed-ability-name'; nameInput.type = 'text';
        nameInput.value = ab.name; nameInput.placeholder = 'Ability name'; nameInput.maxLength = 40;
        nameInput.addEventListener('input', () => { edAbilities[i].name = nameInput.value; });

        const upBtn = document.createElement('button');
        upBtn.className = 'ed-ab-btn'; upBtn.textContent = '↑'; upBtn.disabled = i === 0;
        upBtn.addEventListener('click', () => {
            syncAbilityInputs();
            [edAbilities[i-1], edAbilities[i]] = [edAbilities[i], edAbilities[i-1]];
            renderAbilityRows();
        });
        const dnBtn = document.createElement('button');
        dnBtn.className = 'ed-ab-btn'; dnBtn.textContent = '↓'; dnBtn.disabled = i === edAbilities.length - 1;
        dnBtn.addEventListener('click', () => {
            syncAbilityInputs();
            [edAbilities[i], edAbilities[i+1]] = [edAbilities[i+1], edAbilities[i]];
            renderAbilityRows();
        });
        const delBtn = document.createElement('button');
        delBtn.className = 'ed-ab-btn ed-ab-del'; delBtn.textContent = '✕';
        delBtn.addEventListener('click', () => { syncAbilityInputs(); edAbilities.splice(i, 1); renderAbilityRows(); });

        row.append(nameInput, upBtn, dnBtn, delBtn);
        edAbilityListEl.appendChild(row);
    });
}

function openDetail(id: string | null): void {
    editingId = id;
    if (id) {
        const cr = customRotations.get(id)!;
        detailTitleEl.textContent = cr.name;
        edNameInput.value = cr.name; edBossTargetInput.value = cr.bossTarget ?? '';
        edStyleSel.value = cr.style; edSetupNoteInput.value = cr.setupNote ?? '';
        edAbilities = cr.abilities.map(a => ({ name: a.name, icon: a.icon }));
        edRotationStyle = cr.style;
        edDeleteBtn.style.display = '';
    } else {
        detailTitleEl.textContent = 'New Rotation';
        edNameInput.value = ''; edBossTargetInput.value = '';
        edStyleSel.value = 'necromancy'; edSetupNoteInput.value = '';
        edAbilities = []; edRotationStyle = 'necromancy';
        edDeleteBtn.style.display = 'none';
    }
    renderAbilityRows(); showPage('detail');
}

edStyleSel.addEventListener('change', () => { edRotationStyle = edStyleSel.value as CombatStyle; });

editRotationsBtn.addEventListener('click', () => { renderCustomList(); showPage('list'); });
listBackBtn.addEventListener('click', () => showPage('main'));
newRotationBtn.addEventListener('click', () => openDetail(null));
detailBackBtn.addEventListener('click', () => { renderCustomList(); showPage('list'); });

edAddAbilityBtn.addEventListener('click', () => {
    syncAbilityInputs();
    openPicker();
});

edSaveBtn.addEventListener('click', () => {
    syncAbilityInputs();
    const name = edNameInput.value.trim();
    if (!name) { edNameInput.focus(); return; }
    const abilities = edAbilities.filter(a => a.name.trim());
    if (!abilities.length) { edAddAbilityBtn.focus(); return; }
    const cr: SavedCustomRotation = {
        id: editingId ?? generateId(), name,
        bossTarget: edBossTargetInput.value.trim().toLowerCase() || undefined,
        style: edStyleSel.value as SavedCustomRotation['style'],
        setupNote: edSetupNoteInput.value.trim() || undefined,
        abilities: abilities.map(a => ({ name: a.name.trim(), icon: a.icon })),
    };
    customRotations.set(cr.id, cr); saveCustomRotations(); refreshDropdown();
    renderCustomList(); showPage('list');
});

edDeleteBtn.addEventListener('click', () => {
    if (!editingId) return;
    customRotations.delete(editingId); saveCustomRotations(); refreshDropdown();
    if (manualBossKey === 'custom:' + editingId) { manualBossKey = null; bossSelectEl.value = ''; if (!detectedBossKey) setIdle(); }
    renderCustomList(); showPage('list');
});

// ── Ability picker ────────────────────────────────────────────────────────────

let pickerStyle: CombatStyle = 'necromancy';

function openPicker(): void {
    pickerStyle = edRotationStyle;
    pickerManualInput.value = '';
    renderPickerTabs();
    renderPickerGrid(pickerStyle);
    showPage('picker');
}

function renderPickerTabs(): void {
    pickerTabsEl.innerHTML = '';
    const styles: CombatStyle[] = ['melee', 'ranged', 'magic', 'necromancy'];
    for (const s of styles) {
        const btn = document.createElement('button');
        btn.className = 'picker-tab' + (s === pickerStyle ? ' active' : '');
        btn.textContent = STYLE_LABELS[s];
        btn.addEventListener('click', () => {
            pickerStyle = s;
            renderPickerTabs();
            renderPickerGrid(s);
        });
        pickerTabsEl.appendChild(btn);
    }
}

function renderPickerGrid(style: CombatStyle): void {
    pickerGridEl.innerHTML = '';
    const cats: AbilityCategory[] = ['basic', 'enhanced', 'ultimate', 'utility', 'special', 'greater'];
    for (const cat of cats) {
        const abilities = ABILITIES[style][cat];
        if (!abilities.length) continue;

        const header = document.createElement('div');
        header.className = 'picker-cat-header';
        header.textContent = CATEGORY_LABELS[cat];
        pickerGridEl.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'picker-cat-grid';

        for (const ab of abilities) {
            const cell = document.createElement('button');
            cell.className = 'picker-ability';
            cell.title = ab.name;

            if (ab.wikiFile) {
                const img = document.createElement('img');
                img.src = WIKI_IMG + ab.wikiFile + '.png';
                img.width = 32; img.height = 32;
                img.alt = ab.name;
                img.onerror = () => { img.style.opacity = '0.3'; };
                cell.appendChild(img);
            } else {
                const ph = document.createElement('div');
                ph.className = 'picker-no-img';
                ph.textContent = ab.name.charAt(0).toUpperCase();
                cell.appendChild(ph);
            }

            const label = document.createElement('span');
            label.textContent = ab.name;

            cell.appendChild(label);
            cell.addEventListener('click', () => pickAbility(ab.name, ab.wikiFile));
            grid.appendChild(cell);
        }

        pickerGridEl.appendChild(grid);
    }
}

function pickAbility(name: string, wikiFile?: string): void {
    edAbilities.push({ name, icon: wikiFile });
    if (wikiFile) loadIcon(wikiFile);
    renderAbilityRows();
    showPage('detail');
}

pickerBackBtn.addEventListener('click', () => showPage('detail'));

pickerManualAdd.addEventListener('click', () => {
    const name = pickerManualInput.value.trim();
    if (!name) return;
    edAbilities.push({ name });
    renderAbilityRows();
    showPage('detail');
});
pickerManualInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') pickerManualAdd.click();
});

// ── Boot ──────────────────────────────────────────────────────────────────────

preloadRotationIcons();
loadCustomRotations();
refreshDropdown();
setIdle();

if (a1lib.hasAlt1) {
    const bx = alt1.rsX + 60, by = alt1.rsY + 60;
    alt1.overLaySetGroup('rh-boot'); alt1.overLayFreezeGroup('rh-boot'); alt1.overLayClearGroup('rh-boot');
    alt1.overLayRect(mixColor(255, 0, 0, 255), bx, by, 250, 80, 5000, 4);
    alt1.overLayContinueGroup('rh-boot');
    console.log('[RH] boot test rect at', bx, by);
}

setInterval(poll, POLL_MS);
poll();
