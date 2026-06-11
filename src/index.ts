import * as a1lib from 'alt1/base';
import TargetMobReader from 'alt1/targetmob';
import { GUIDES, BOSS_NAME_MAP } from './guides';
import { ABILITIES, WIKI_IMG, CombatStyle, AbilityCategory, CATEGORY_LABELS, STYLE_LABELS } from './abilities';
import {
    BossGuide, SavedCustomGuide, Phase, KillEntry, KillStats,
    PhaseMode,
} from './types';

if (a1lib.hasAlt1) {
    alt1.identifyAppUrl('https://jazztazz1991.github.io/runehub-alt1/appconfig.json');
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function mixColor(r: number, g: number, b: number, a = 255): number {
    return (((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)) >>> 0;
}
function formatMs(ms: number): string {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ── Icon loader ────────────────────────────────────────────────────────────────

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
            const bm = await createImageBitmap(blob, { resizeWidth: ICON_SIZE, resizeHeight: ICON_SIZE });
            const cv = document.createElement('canvas');
            cv.width = ICON_SIZE; cv.height = ICON_SIZE;
            const ctx = cv.getContext('2d')!;
            ctx.drawImage(bm, 0, 0);
            const { data: rgba } = ctx.getImageData(0, 0, ICON_SIZE, ICON_SIZE);
            const bgra = new Uint8Array(rgba.length);
            for (let i = 0; i < rgba.length; i += 4) {
                bgra[i] = rgba[i+2]; bgra[i+1] = rgba[i+1]; bgra[i+2] = rgba[i]; bgra[i+3] = rgba[i+3];
            }
            let bin = '';
            for (let i = 0; i < bgra.length; i++) bin += String.fromCharCode(bgra[i]);
            iconCache.set(wikiFile, btoa(bin));
            drawOverlay();
            return;
        } catch {}
    }
}

function preloadPhaseIcons(phase: Phase): void {
    for (const step of phase.rotation) { if (step.icon) loadIcon(step.icon); }
    if (phase.segments) { for (const seg of phase.segments) preloadPhaseIcons(seg); }
}

// ── OCR reader ────────────────────────────────────────────────────────────────

const reader  = new TargetMobReader();
const POLL_MS = 200;
const GCD_MS  = 1800;

// ── Overlay drawing ────────────────────────────────────────────────────────────

const OV_GROUP = 'rh-main';
const BOX_W = 120, BOX_H = 50, BOX_GAP = 8;
const TOTAL_W = BOX_W * 3 + BOX_GAP * 2;
let ovRelX = 0, ovRelY = 0, hasCustomPos = false, isSelectingPos = false;

(() => {
    const rx = localStorage.getItem('rh-ov-rx');
    const ry = localStorage.getItem('rh-ov-ry');
    if (rx !== null && ry !== null) {
        ovRelX = parseInt(rx, 10); ovRelY = parseInt(ry, 10); hasCustomPos = true;
    }
})();

function ovOrigin(): { x: number; y: number } {
    if (isSelectingPos && a1lib.hasAlt1) {
        const m = a1lib.getMousePosition();
        if (m) return { x: alt1.rsX + m.x - Math.floor(TOTAL_W/2), y: alt1.rsY + m.y - Math.floor(BOX_H/2) };
    }
    if (hasCustomPos && a1lib.hasAlt1) return { x: alt1.rsX + ovRelX, y: alt1.rsY + ovRelY };
    return { x: alt1.rsX + Math.floor((alt1.rsWidth - TOTAL_W)/2), y: alt1.rsY + alt1.rsHeight - BOX_H - 110 };
}

a1lib.on('alt1pressed', (e) => {
    if (!isSelectingPos) return;
    ovRelX = e.mouseRs.x - Math.floor(TOTAL_W/2);
    ovRelY = e.mouseRs.y - Math.floor(BOX_H/2);
    hasCustomPos = true;
    localStorage.setItem('rh-ov-rx', String(ovRelX));
    localStorage.setItem('rh-ov-ry', String(ovRelY));
    isSelectingPos = false;
    setposBtnEl.textContent = '⡓ Set Overlay Position';
    setposBtnEl.classList.remove('selecting');
    drawOverlay();
});

function drawOverlay(): void {
    if (!a1lib.hasAlt1) return;
    const activePhase = getActivePhase();
    if (!activePhase && !isSelectingPos) { clearOverlay(); return; }
    const { x, y } = ovOrigin();
    if (!isFinite(x) || !isFinite(y)) return;
    const TIME = 1500;
    alt1.overLaySetGroup(OV_GROUP); alt1.overLayFreezeGroup(OV_GROUP); alt1.overLayClearGroup(OV_GROUP);
    if (activePhase) {
        const rot = activePhase.rotation, l = rot.length;
        if (l > 0) {
            const pa = rot[(rotationIndex - 1 + l) % l];
            const ca = rot[rotationIndex];
            const na = rot[(rotationIndex + 1) % l];
            drawBox(x,                    y, pa.name, pa.icon, 'prev',    TIME);
            drawBox(x + BOX_W + BOX_GAP,  y, ca.name, ca.icon, 'current', TIME);
            drawBox(x + (BOX_W+BOX_GAP)*2,y, na.name, na.icon, 'next',    TIME);
        }
    }
    if (isSelectingPos) {
        alt1.overLayTextEx('Press Alt+1 to lock position', mixColor(240,192,96,255), 11, x, y-16, TIME, 'chatbox', true, false);
    }
    alt1.overLayContinueGroup(OV_GROUP);
}

function drawBox(x: number, y: number, name: string, iconKey: string|undefined, type: 'prev'|'current'|'next', time: number): void {
    const bw = type === 'current' ? 2 : 1;
    const bc = type === 'current' ? mixColor(240,192,96,255) : mixColor(80,80,80,180);
    alt1.overLayRect(bc, x, y, BOX_W, BOX_H, time, bw);
    const data = iconKey ? iconCache.get(iconKey) ?? null : null;
    if (data) {
        const ix = x + Math.floor((BOX_W - ICON_SIZE)/2), iy = y + 4;
        let drawn = false;
        try { alt1.overLayImage(ix, iy, data, ICON_SIZE, time); drawn = true; } catch {}
        if (drawn) {
            const lc = type === 'prev' ? mixColor(100,100,100,220) : type === 'next' ? mixColor(160,160,160,220) : mixColor(240,192,96,255);
            alt1.overLayTextEx(name, lc, 9, x+3, y+BOX_H-12, time, 'chatbox', true, false);
            return;
        }
    }
    if (type === 'current') alt1.overLayTextEx('NOW', mixColor(240,192,96,200), 9, x+4, y+4, time, 'chatbox', false, false);
    const nc = type === 'prev' ? mixColor(110,110,110,255) : type === 'next' ? mixColor(190,190,190,255) : mixColor(255,240,160,255);
    alt1.overLayTextEx(name, nc, type === 'current' ? 14 : 12, x+6, type === 'current' ? y+18 : y+16, time, 'chatbox', true, false);
}

function clearOverlay(): void {
    if (!a1lib.hasAlt1) return;
    alt1.overLaySetGroup(OV_GROUP); alt1.overLayFreezeGroup(OV_GROUP);
    alt1.overLayClearGroup(OV_GROUP); alt1.overLayContinueGroup(OV_GROUP);
}

// ── DOM references ────────────────────────────────────────────────────────────

const bossSelectEl      = document.getElementById('boss-select')       as HTMLSelectElement;
const setupNoteEl       = document.getElementById('setup-note')!;
const phaseNavEl        = document.getElementById('phase-nav')!;
const phasePrevBtn      = document.getElementById('phase-prev')         as HTMLButtonElement;
const phaseNextBtn      = document.getElementById('phase-next')         as HTMLButtonElement;
const phaseLabelEl      = document.getElementById('phase-label')!;
const phaseCounterEl    = document.getElementById('phase-counter')!;
const phaseNoteEl       = document.getElementById('phase-note')!;
const choicePickerEl    = document.getElementById('choice-picker')!;
const restrictionChipsEl= document.getElementById('restriction-chips')!;
const rotationListEl    = document.getElementById('rotation-list')!;
const stepCounterEl     = document.getElementById('step-counter')!;
const startBtn          = document.getElementById('start-btn')          as HTMLButtonElement;
const resetBtn          = document.getElementById('reset-btn')          as HTMLButtonElement;
const setposBtnEl       = document.getElementById('setpos-btn')         as HTMLButtonElement;
const editRotationsBtn  = document.getElementById('edit-rotations-btn') as HTMLButtonElement;

// Guide tab
const guideBossHeaderEl = document.getElementById('guide-boss-header')!;
const guideBossNameEl   = document.getElementById('guide-boss-name')!;
const mechanicCardsEl   = document.getElementById('mechanic-cards')!;
const guideEmptyEl      = document.getElementById('guide-empty')!;

// Loot tab
const lootBossLblEl     = document.getElementById('loot-boss-lbl')!;
const statKillsEl       = document.getElementById('stat-kills')!;
const statTimerEl       = document.getElementById('stat-timer')!;
const statTimerLblEl    = document.getElementById('stat-timer-lbl')!;
const statPbEl          = document.getElementById('stat-pb')!;
const statAvgEl         = document.getElementById('stat-avg')!;
const killStartBtn      = document.getElementById('kill-start-btn')     as HTMLButtonElement;
const killEndBtn        = document.getElementById('kill-end-btn')       as HTMLButtonElement;
const logDropBtn        = document.getElementById('log-drop-btn')       as HTMLButtonElement;
const dropInputRow      = document.getElementById('drop-input-row')!;
const dropInputEl       = document.getElementById('drop-input')         as HTMLInputElement;
const dropConfirmBtn    = document.getElementById('drop-confirm-btn')   as HTMLButtonElement;
const killLogListEl     = document.getElementById('kill-log-list')!;
const clearLootBtn      = document.getElementById('clear-loot-btn')     as HTMLButtonElement;

// Setup tab
const setupTabBossEl    = document.getElementById('setup-tab-boss-name')!;
const checklistContainer= document.getElementById('checklist-container')!;
const checklistItemsEl  = document.getElementById('checklist-items')!;
const resetChecklistBtn = document.getElementById('reset-checklist-btn')as HTMLButtonElement;
const setupEmptyEl      = document.getElementById('setup-empty')!;

// Editor
const editorListEl      = document.getElementById('editor-list')!;
const editorDetailEl    = document.getElementById('editor-detail')!;
const abilityPickerEl   = document.getElementById('ability-picker')!;
const listBackBtn       = document.getElementById('list-back-btn')      as HTMLButtonElement;
const newRotationBtn    = document.getElementById('new-rotation-btn')   as HTMLButtonElement;
const customListItemsEl = document.getElementById('custom-list-items')!;
const customListEmptyEl = document.getElementById('custom-list-empty')!;
const detailBackBtn     = document.getElementById('detail-back-btn')    as HTMLButtonElement;
const detailTitleEl     = document.getElementById('detail-title')!;
const edNameInput       = document.getElementById('ed-name')            as HTMLInputElement;
const edBossTargetInput = document.getElementById('ed-boss-target')     as HTMLInputElement;
const edStyleSel        = document.getElementById('ed-style')           as HTMLSelectElement;
const edSetupNoteInput  = document.getElementById('ed-setup-note')      as HTMLInputElement;
const edPhaseTabsEl     = document.getElementById('ed-phase-tabs')!;
const edAddPhaseBtn     = document.getElementById('ed-add-phase-btn')   as HTMLButtonElement;
const edPhaseNameHint   = document.getElementById('ed-phase-name-hint')!;
const edAbilityListEl   = document.getElementById('ed-ability-list')!;
const edAddAbilityBtn   = document.getElementById('ed-add-ability')     as HTMLButtonElement;
const edDeleteBtn       = document.getElementById('ed-delete-btn')      as HTMLButtonElement;
const edSaveBtn         = document.getElementById('ed-save-btn')        as HTMLButtonElement;
const pickerBackBtn     = document.getElementById('picker-back-btn')    as HTMLButtonElement;
const pickerTabsEl      = document.getElementById('picker-tabs')!;
const pickerGridEl      = document.getElementById('picker-grid')!;
const pickerManualInput = document.getElementById('picker-manual-input')as HTMLInputElement;
const pickerManualAdd   = document.getElementById('picker-manual-add')  as HTMLButtonElement;

// ── Tab system ─────────────────────────────────────────────────────────────────

type AppTab    = 'fight' | 'guide' | 'loot' | 'setup';
type EditorPage= 'none' | 'list' | 'detail' | 'picker';

let currentTab: AppTab = 'fight';
let editorPage: EditorPage = 'none';

function switchTab(tab: AppTab): void {
    currentTab = tab;
    document.querySelectorAll<HTMLElement>('.tab-content').forEach(el => {
        el.classList.toggle('active', el.id === `tab-${tab}`);
        el.classList.toggle('hidden', el.id !== `tab-${tab}`);
    });
    document.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
}

function showEditor(page: EditorPage): void {
    editorPage = page;
    editorListEl.style.display   = page === 'list'   ? '' : 'none';
    editorDetailEl.style.display = page === 'detail' ? '' : 'none';
    abilityPickerEl.style.display= page === 'picker' ? '' : 'none';
}

document.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => { if (editorPage === 'none') switchTab(btn.dataset.tab as AppTab); });
});

// ── App state ─────────────────────────────────────────────────────────────────

let currentGuide: BossGuide | null = null;
let currentGuideKey: string | null = null;

// Fight tab phase state
let phaseIdx    = 0;   // sequential / choice
let segIdx      = 0;   // segments within choice phase
let choiceSelected = false;
let rotationIndex  = 0;
let isRunning      = false;
let gcdTimer: ReturnType<typeof setInterval> | null = null;
let lastTargetName = '';
let initialHp: number | null = null;
let manualGuideKey: string | null = null;
let detectedGuideKey: string | null = null;

// Kill tracker state
let killStart: number | null = null;
let killTimerInterval: ReturnType<typeof setInterval> | null = null;
let kills: KillEntry[]  = [];
let killCount = 0;
let killPB: number | null = null;
let pendingDrops: string[] = [];

// Checklist state
let checkedItems = new Set<string>();
let checklistGuideKey: string | null = null;

// Custom guides
const CUSTOM_KEY = 'rh-custom-guides';
const customGuides = new Map<string, SavedCustomGuide>();

// ── Active phase resolution ────────────────────────────────────────────────────

function getActivePhase(): Phase | null {
    if (!currentGuide) return null;
    const { phaseMode, phases } = currentGuide;
    if (phaseMode === 'single')      return phases[0] ?? null;
    if (phaseMode === 'sequential')  return phases[phaseIdx] ?? null;
    if (phaseMode === 'choice' || phaseMode === 'role') {
        if (!choiceSelected) return null;
        const ph = phases[phaseIdx];
        if (!ph) return null;
        if (ph.segments && ph.segments.length > 0) return ph.segments[segIdx] ?? null;
        return ph;
    }
    if (phaseMode === 'waves') return phases[phaseIdx] ?? null;
    return null;
}

// ── Guide loading ─────────────────────────────────────────────────────────────

function loadGuide(key: string, guide: BossGuide): void {
    currentGuide    = guide;
    currentGuideKey = key;
    phaseIdx        = 0;
    segIdx          = 0;
    choiceSelected  = false;
    rotationIndex   = 0;
    initialHp       = null;
    pauseGcd();

    setupNoteEl.textContent = guide.setupNote ?? '';

    for (const ph of guide.phases) preloadPhaseIcons(ph);

    renderFightTab();
    renderGuideTab();

    lootBossLblEl.textContent = guide.bossName;
    loadKillStats(key);
    renderLootStats();
    renderKillLog();

    setupTabBossEl.textContent = guide.bossName;
    setupTabBossEl.classList.remove('hidden');
    loadChecklist(key);
    renderChecklist();

    drawOverlay();
}

function unloadGuide(): void {
    currentGuide = null; currentGuideKey = null;
    pauseGcd(); rotationIndex = 0; initialHp = null;
    setupNoteEl.textContent = '';
    renderFightTab();
    renderGuideTab();
    lootBossLblEl.textContent = '';
    renderLootStats();
    renderKillLog();
    setupTabBossEl.classList.add('hidden');
    checklistContainer.classList.add('hidden');
    setupEmptyEl.classList.remove('hidden');
    clearOverlay();
}

// ── Fight tab rendering ───────────────────────────────────────────────────────

function renderFightTab(): void {
    if (!currentGuide) {
        phaseNavEl.classList.add('hidden');
        phaseNoteEl.classList.add('hidden');
        choicePickerEl.classList.add('hidden');
        restrictionChipsEl.classList.add('hidden');
        rotationListEl.innerHTML = '';
        stepCounterEl.textContent = '';
        return;
    }

    const { phaseMode, phases } = currentGuide;

    // Phase nav (sequential)
    if (phaseMode === 'sequential' && phases.length > 1) {
        phaseNavEl.classList.remove('hidden');
        phaseLabelEl.textContent = phases[phaseIdx]?.label ?? '';
        phaseCounterEl.textContent = `${phaseIdx + 1} / ${phases.length}`;
        phasePrevBtn.disabled = phaseIdx === 0;
        phaseNextBtn.disabled = phaseIdx === phases.length - 1;
    } else {
        phaseNavEl.classList.add('hidden');
    }

    // Choice / role picker
    if (phaseMode === 'choice' || phaseMode === 'role') {
        choicePickerEl.classList.remove('hidden');
        if (!choiceSelected) {
            renderChoiceGrid();
        } else {
            renderChoiceSelected();
        }
    } else {
        choicePickerEl.classList.add('hidden');
    }

    const active = getActivePhase();

    // Phase note
    const noteText = active?.note ?? '';
    if (noteText) {
        phaseNoteEl.textContent = noteText;
        phaseNoteEl.classList.remove('hidden');
    } else {
        phaseNoteEl.classList.add('hidden');
    }

    // Restrictions
    const chips: string[] = [];
    if (active?.invulnerable) chips.push('INVULNERABLE');
    for (const r of active?.restrictions ?? []) chips.push(r.label);
    if (chips.length) {
        restrictionChipsEl.classList.remove('hidden');
        restrictionChipsEl.innerHTML = chips.map((c, i) =>
            `<span class="${i === 0 && active?.invulnerable ? 'invuln-chip' : 'restriction-chip'}">${c}</span>`
        ).join('');
    } else {
        restrictionChipsEl.classList.add('hidden');
        restrictionChipsEl.innerHTML = '';
    }

    renderRotationList(active);
}

function renderChoiceGrid(): void {
    const { phaseMode, phases } = currentGuide!;
    choicePickerEl.innerHTML = '';
    const lbl = document.createElement('div');
    lbl.className = 'choice-label';
    lbl.textContent = phaseMode === 'role' ? 'Select your role:' : 'Select your area:';
    choicePickerEl.appendChild(lbl);
    const grid = document.createElement('div');
    grid.className = 'choice-grid';
    phases.forEach((ph, i) => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = ph.label;
        btn.addEventListener('click', () => {
            phaseIdx = i; segIdx = 0; choiceSelected = true; rotationIndex = 0;
            renderFightTab(); drawOverlay();
        });
        grid.appendChild(btn);
    });
    choicePickerEl.appendChild(grid);
}

function renderChoiceSelected(): void {
    const phase = currentGuide!.phases[phaseIdx];
    if (!phase) return;
    choicePickerEl.innerHTML = '';

    const row = document.createElement('div');
    row.className = 'choice-selected-row';

    const backBtn = document.createElement('button');
    backBtn.className = 'choice-back-btn';
    backBtn.textContent = '◄ Back';
    backBtn.addEventListener('click', () => {
        choiceSelected = false; rotationIndex = 0; pauseGcd();
        renderFightTab(); drawOverlay();
    });

    const lbl = document.createElement('span');
    lbl.className = 'choice-selected-lbl';
    lbl.textContent = phase.label;

    row.appendChild(backBtn);
    row.appendChild(lbl);

    if (phase.segments && phase.segments.length > 0) {
        const segNav = document.createElement('div');
        segNav.className = 'segment-nav';
        const segLbl = document.createElement('span');
        segLbl.className = 'segment-lbl';
        segLbl.textContent = `${phase.segments[segIdx]?.label ?? ''} (${segIdx + 1}/${phase.segments.length})`;
        const prevSeg = document.createElement('button');
        prevSeg.className = 'seg-btn'; prevSeg.textContent = '◄';
        prevSeg.disabled = segIdx === 0;
        prevSeg.addEventListener('click', () => {
            segIdx--; rotationIndex = 0; pauseGcd(); renderFightTab(); drawOverlay();
        });
        const nextSeg = document.createElement('button');
        nextSeg.className = 'seg-btn'; nextSeg.textContent = '►';
        nextSeg.disabled = segIdx === phase.segments.length - 1;
        nextSeg.addEventListener('click', () => {
            segIdx++; rotationIndex = 0; pauseGcd(); renderFightTab(); drawOverlay();
        });
        segNav.append(prevSeg, segLbl, nextSeg);
        row.appendChild(segNav);
    }

    choicePickerEl.appendChild(row);
}

function renderRotationList(phase: Phase | null): void {
    rotationListEl.innerHTML = '';
    if (!phase || phase.rotation.length === 0) {
        stepCounterEl.textContent = '';
        return;
    }
    phase.rotation.forEach((step, i) => {
        const row = document.createElement('div');
        row.className = 'rot-step' +
            (i === rotationIndex ? ' step-current' : i < rotationIndex ? ' step-done' : '');
        row.dataset.idx = String(i);

        const num = document.createElement('span');
        num.className = 'rot-step-num';
        num.textContent = `${i + 1}.`;

        if (step.icon) {
            const img = document.createElement('img');
            img.src = WIKI_IMG + step.icon + '.png';
            img.width = 20; img.height = 20; img.alt = '';
            img.onerror = () => img.style.display = 'none';
            row.appendChild(num);
            row.appendChild(img);
        } else {
            const ph = document.createElement('div');
            ph.className = 'rot-step-icon-ph';
            ph.textContent = step.name.charAt(0);
            row.appendChild(num);
            row.appendChild(ph);
        }

        const name = document.createElement('span');
        name.className = 'rot-step-name';
        name.textContent = step.name;
        row.appendChild(name);

        if (step.note) {
            const note = document.createElement('span');
            note.className = 'rot-step-note';
            note.textContent = step.note;
            row.appendChild(note);
        }

        row.addEventListener('click', () => {
            rotationIndex = i;
            renderRotationList(phase);
            stepCounterEl.textContent = `${rotationIndex + 1} / ${phase.rotation.length}`;
            drawOverlay();
        });

        rotationListEl.appendChild(row);
    });

    stepCounterEl.textContent = `${rotationIndex + 1} / ${phase.rotation.length}`;
    scrollCurrentStep();
}

function scrollCurrentStep(): void {
    const cur = rotationListEl.querySelector<HTMLElement>('.step-current');
    if (cur) cur.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// ── Guide tab rendering ───────────────────────────────────────────────────────

function renderGuideTab(): void {
    mechanicCardsEl.innerHTML = '';
    if (!currentGuide || currentGuide.mechanics.length === 0) {
        guideBossHeaderEl.classList.add('hidden');
        guideEmptyEl.classList.remove('hidden');
        return;
    }
    guideBossHeaderEl.classList.remove('hidden');
    guideEmptyEl.classList.add('hidden');
    guideBossNameEl.textContent = currentGuide.bossName;

    for (const m of currentGuide.mechanics) {
        const card = document.createElement('div');
        card.className = 'mechanic-card' + (m.critical ? ' critical' : '');

        const header = document.createElement('div');
        header.className = 'mcard-header';
        const nameEl = document.createElement('span');
        nameEl.className = 'mcard-name';
        nameEl.textContent = m.name;
        header.appendChild(nameEl);
        if (m.critical) {
            const badge = document.createElement('span');
            badge.className = 'mcard-badge';
            badge.textContent = 'LETHAL';
            header.appendChild(badge);
        }
        card.appendChild(header);

        if (m.phase) {
            const phaseEl = document.createElement('div');
            phaseEl.className = 'mcard-phase';
            phaseEl.textContent = m.phase;
            card.appendChild(phaseEl);
        }

        const desc = document.createElement('div');
        desc.className = 'mcard-desc';
        desc.textContent = m.description;
        card.appendChild(desc);

        mechanicCardsEl.appendChild(card);
    }
}

// ── Kill tracker ──────────────────────────────────────────────────────────────

const killStatsKey  = (k: string) => `rh-kills-${k}`;
const checklistKey  = (k: string) => `rh-checklist-${k}`;

function loadKillStats(key: string): void {
    try {
        const raw = localStorage.getItem(killStatsKey(key));
        if (raw) {
            const d: KillStats = JSON.parse(raw);
            kills = d.kills ?? []; killCount = d.count ?? 0; killPB = d.pb ?? null;
        } else {
            kills = []; killCount = 0; killPB = null;
        }
    } catch { kills = []; killCount = 0; killPB = null; }
}

function saveKillStats(): void {
    if (!currentGuideKey) return;
    const d: KillStats = { count: killCount, pb: killPB, kills: kills.slice(0, 100) };
    localStorage.setItem(killStatsKey(currentGuideKey), JSON.stringify(d));
}

function renderLootStats(): void {
    statKillsEl.textContent = String(killCount);
    if (killPB !== null) {
        statPbEl.textContent = formatMs(killPB);
        statPbEl.classList.add('pb-set');
    } else {
        statPbEl.textContent = '--';
        statPbEl.classList.remove('pb-set');
    }
    const avg = kills.length ? Math.round(kills.reduce((a, k) => a + k.durationMs, 0) / kills.length) : null;
    statAvgEl.textContent = avg !== null ? formatMs(avg) : '--';
}

function renderKillLog(): void {
    killLogListEl.innerHTML = '';
    if (kills.length === 0) return;
    for (let i = 0; i < Math.min(kills.length, 30); i++) {
        const k = kills[i];
        const row = document.createElement('div');
        row.className = 'kill-log-entry';
        const num   = document.createElement('span'); num.className   = 'kle-num';  num.textContent = `Kill #${killCount - i}`;
        const time  = document.createElement('span'); time.className  = 'kle-time'; time.textContent = formatMs(k.durationMs);
        const pb    = document.createElement('span'); pb.className    = 'kle-pb';   pb.textContent = k.isPB ? '★PB' : '';
        const drops = document.createElement('span'); drops.className = 'kle-drops';drops.textContent = k.drops.join(', ');
        row.append(num, time, pb, drops);
        killLogListEl.appendChild(row);
    }
}

function startKill(): void {
    killStart = Date.now();
    pendingDrops = [];
    killTimerInterval = setInterval(() => {
        const elapsed = Date.now() - killStart!;
        statTimerEl.textContent = formatMs(elapsed);
        statTimerLblEl.textContent = 'Current';
    }, 500);
    killStartBtn.classList.add('running');
    killEndBtn.disabled = false;
}

function endKill(): void {
    if (killStart === null) return;
    const durationMs = Date.now() - killStart;
    killStart = null;
    if (killTimerInterval) { clearInterval(killTimerInterval); killTimerInterval = null; }
    statTimerEl.textContent = formatMs(durationMs);
    const isPB = killPB === null || durationMs < killPB;
    if (isPB) killPB = durationMs;
    kills.unshift({ timestamp: Date.now(), durationMs, drops: [...pendingDrops], isPB });
    killCount++;
    pendingDrops = [];
    killStartBtn.classList.remove('running');
    killEndBtn.disabled = true;
    saveKillStats();
    renderLootStats();
    renderKillLog();
}

killStartBtn.addEventListener('click', () => {
    if (killStart !== null) return; // already running
    startKill();
});
killEndBtn.addEventListener('click', endKill);

logDropBtn.addEventListener('click', () => {
    dropInputRow.classList.toggle('hidden');
    if (!dropInputRow.classList.contains('hidden')) dropInputEl.focus();
});
function confirmDrop(): void {
    const name = dropInputEl.value.trim();
    if (!name) return;
    pendingDrops.push(name);
    dropInputEl.value = '';
    dropInputRow.classList.add('hidden');
}
dropConfirmBtn.addEventListener('click', confirmDrop);
dropInputEl.addEventListener('keydown', e => { if (e.key === 'Enter') confirmDrop(); });

clearLootBtn.addEventListener('click', () => {
    kills = []; killCount = 0; killPB = null;
    saveKillStats(); renderLootStats(); renderKillLog();
    statTimerEl.textContent = '0:00';
});

// ── Pre-fight checklist ───────────────────────────────────────────────────────

function loadChecklist(key: string): void {
    checklistGuideKey = key;
    try {
        const raw = localStorage.getItem(checklistKey(key));
        checkedItems = raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { checkedItems = new Set(); }
}

function saveChecklist(): void {
    if (!checklistGuideKey) return;
    localStorage.setItem(checklistKey(checklistGuideKey), JSON.stringify([...checkedItems]));
}

function renderChecklist(): void {
    checklistItemsEl.innerHTML = '';
    if (!currentGuide || currentGuide.setup.length === 0) {
        checklistContainer.classList.add('hidden');
        setupEmptyEl.classList.remove('hidden');
        return;
    }
    checklistContainer.classList.remove('hidden');
    setupEmptyEl.classList.add('hidden');

    for (const item of currentGuide.setup) {
        const row = document.createElement('div');
        row.className = 'checklist-item' + (checkedItems.has(item.id) ? ' checked' : '');

        const cb = document.createElement('input');
        cb.type = 'checkbox'; cb.checked = checkedItems.has(item.id);
        cb.addEventListener('change', () => {
            if (cb.checked) checkedItems.add(item.id); else checkedItems.delete(item.id);
            row.classList.toggle('checked', cb.checked);
            saveChecklist();
        });

        const lbl = document.createElement('label');
        lbl.className = 'ci-label'; lbl.textContent = item.label;
        lbl.addEventListener('click', () => cb.click());

        const cat = document.createElement('span');
        cat.className = `ci-cat cat-${item.category}`;
        cat.textContent = item.category;

        row.append(cb, lbl, cat);
        checklistItemsEl.appendChild(row);
    }
}

resetChecklistBtn.addEventListener('click', () => {
    checkedItems.clear();
    saveChecklist();
    renderChecklist();
});

// ── Rotation controls ─────────────────────────────────────────────────────────

function advance(): void {
    const ph = getActivePhase();
    if (!ph || ph.rotation.length === 0) return;
    rotationIndex = (rotationIndex + 1) % ph.rotation.length;
    renderRotationList(ph);
    drawOverlay();
}

function startGcd(): void {
    const ph = getActivePhase();
    if (isRunning || !ph || ph.rotation.length === 0) return;
    isRunning = true;
    startBtn.textContent = '⏸'; startBtn.classList.add('running');
    gcdTimer = setInterval(advance, GCD_MS);
}

function pauseGcd(): void {
    if (gcdTimer) { clearInterval(gcdTimer); gcdTimer = null; }
    isRunning = false;
    startBtn.textContent = '▶'; startBtn.classList.remove('running');
}

function resetRotation(): void {
    pauseGcd(); rotationIndex = 0; initialHp = null;
    const ph = getActivePhase();
    renderRotationList(ph);
    drawOverlay();
}

startBtn.addEventListener('click', () => isRunning ? pauseGcd() : startGcd());
resetBtn.addEventListener('click', resetRotation);

phasePrevBtn.addEventListener('click', () => {
    if (phaseIdx > 0) { phaseIdx--; rotationIndex = 0; pauseGcd(); renderFightTab(); drawOverlay(); }
});
phaseNextBtn.addEventListener('click', () => {
    if (currentGuide && phaseIdx < currentGuide.phases.length - 1) {
        phaseIdx++; rotationIndex = 0; pauseGcd(); renderFightTab(); drawOverlay();
    }
});

setposBtnEl.addEventListener('click', () => {
    isSelectingPos = true;
    setposBtnEl.textContent = '⡓ Setting… (Alt+1 to lock)';
    setposBtnEl.classList.add('selecting');
    drawOverlay();
});

// ── Custom guides (localStorage) ──────────────────────────────────────────────

function loadCustomGuides(): void {
    try {
        const raw = localStorage.getItem(CUSTOM_KEY);
        if (!raw) return;
        const arr: SavedCustomGuide[] = JSON.parse(raw);
        for (const g of arr) customGuides.set(g.id, g);
    } catch {}
}

function saveCustomGuides(): void {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify([...customGuides.values()]));
}

function customToGuide(cr: SavedCustomGuide): BossGuide {
    return {
        bossName: cr.name, style: cr.style, setupNote: cr.setupNote,
        phaseMode: cr.phaseMode, phases: cr.phases, mechanics: [], setup: [],
    };
}

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function getBossGuideByKey(key: string): BossGuide | null {
    if (key.startsWith('custom:')) {
        const cr = customGuides.get(key.slice(7));
        return cr ? customToGuide(cr) : null;
    }
    return GUIDES[key] ?? null;
}

// ── Dropdown ──────────────────────────────────────────────────────────────────

function refreshDropdown(): void {
    const current = bossSelectEl.value;
    while (bossSelectEl.options.length > 1) bossSelectEl.remove(1);
    for (const [key, guide] of Object.entries(GUIDES)) {
        const opt = document.createElement('option');
        opt.value = key; opt.textContent = guide.bossName;
        bossSelectEl.appendChild(opt);
    }
    if (customGuides.size > 0) {
        const sep = document.createElement('option');
        sep.disabled = true; sep.textContent = '── Custom ──';
        bossSelectEl.appendChild(sep);
        for (const [id, cr] of customGuides) {
            const opt = document.createElement('option');
            opt.value = 'custom:' + id; opt.textContent = cr.name;
            bossSelectEl.appendChild(opt);
        }
    }
    bossSelectEl.value = current;
    if (!bossSelectEl.value) bossSelectEl.value = '';
}

bossSelectEl.addEventListener('change', () => {
    const val = bossSelectEl.value;
    manualGuideKey = val || null;
    if (!detectedGuideKey) {
        if (manualGuideKey) {
            const guide = getBossGuideByKey(manualGuideKey);
            if (guide) loadGuide(manualGuideKey, guide);
        } else { unloadGuide(); }
    }
});

// ── OCR poll ──────────────────────────────────────────────────────────────────

function detectGuide(): { guide: BossGuide; key: string; targetName: string } | null {
    if (!a1lib.hasAlt1) return null;
    let state; try { state = reader.read(); } catch { return null; }
    if (!state?.name) return null;
    const lower = state.name.toLowerCase();
    for (const [fragment, key] of BOSS_NAME_MAP) {
        if (lower.includes(fragment)) {
            const guide = GUIDES[key];
            return guide ? { guide, key, targetName: state.name } : null;
        }
    }
    for (const [id, cr] of customGuides) {
        if (cr.bossTarget && lower.includes(cr.bossTarget)) {
            return { guide: customToGuide(cr), key: 'custom:' + id, targetName: state.name };
        }
    }
    return null;
}

function poll(): void {
    const result = detectGuide();
    if (!result) {
        if (detectedGuideKey !== null) {
            detectedGuideKey = null; lastTargetName = ''; pauseGcd();
            if (manualGuideKey) {
                const g = getBossGuideByKey(manualGuideKey);
                if (g) loadGuide(manualGuideKey, g);
            } else { unloadGuide(); }
        }
        if (currentGuide || isSelectingPos) drawOverlay();
        return;
    }
    const { guide, key, targetName } = result;
    detectedGuideKey = key;
    if (targetName !== lastTargetName) {
        lastTargetName = targetName; pauseGcd(); loadGuide(key, guide);
        bossSelectEl.value = key.startsWith('custom:') ? '' : key;
    }
    if (!isRunning && getActivePhase()) {
        const hp = reader.state?.hp;
        if (hp) {
            if (initialHp === null) initialHp = hp;
            else if (hp < initialHp) startGcd();
        }
    }
    drawOverlay();
}

// ── Editor ────────────────────────────────────────────────────────────────────

type EditorTab = 'none' | 'list' | 'detail' | 'picker';

interface EdPhase { label: string; rotation: Array<{ name: string; icon?: string }> }

let editingId: string | null = null;
let edPhases: EdPhase[] = [];
let edPhaseIdx = 0;
let edStyle: CombatStyle = 'necromancy';

editRotationsBtn.addEventListener('click', () => { renderCustomList(); showEditor('list'); });
listBackBtn.addEventListener('click', () => showEditor('none'));
newRotationBtn.addEventListener('click', () => openDetail(null));
detailBackBtn.addEventListener('click', () => { renderCustomList(); showEditor('list'); });

function renderCustomList(): void {
    customListItemsEl.innerHTML = '';
    if (customGuides.size === 0) { customListEmptyEl.style.display = ''; return; }
    customListEmptyEl.style.display = 'none';
    for (const [id, cr] of customGuides) {
        const row = document.createElement('div'); row.className = 'ed-list-row';
        const name = document.createElement('span'); name.className = 'ed-list-name'; name.textContent = cr.name;
        const editBtn = document.createElement('button'); editBtn.className = 'ed-list-btn'; editBtn.textContent = '✎'; editBtn.title = 'Edit';
        editBtn.addEventListener('click', () => openDetail(id));
        const delBtn = document.createElement('button'); delBtn.className = 'ed-list-btn'; delBtn.textContent = '✕'; delBtn.title = 'Delete';
        delBtn.style.color = '#804040'; delBtn.style.borderColor = '#503030';
        delBtn.addEventListener('click', () => {
            customGuides.delete(id); saveCustomGuides(); refreshDropdown();
            if (manualGuideKey === 'custom:' + id) { manualGuideKey = null; bossSelectEl.value = ''; if (!detectedGuideKey) unloadGuide(); }
            renderCustomList();
        });
        row.append(name, editBtn, delBtn);
        customListItemsEl.appendChild(row);
    }
}

function openDetail(id: string | null): void {
    editingId = id;
    if (id) {
        const cr = customGuides.get(id)!;
        detailTitleEl.textContent = cr.name;
        edNameInput.value = cr.name; edBossTargetInput.value = cr.bossTarget ?? '';
        edStyleSel.value = cr.style; edSetupNoteInput.value = cr.setupNote ?? '';
        edPhases = cr.phases.map(p => ({ label: p.label, rotation: p.rotation.map(r => ({ name: r.name, icon: r.icon })) }));
        edStyle = cr.style; edDeleteBtn.style.display = '';
    } else {
        detailTitleEl.textContent = 'New Rotation';
        edNameInput.value = ''; edBossTargetInput.value = ''; edStyleSel.value = 'necromancy'; edSetupNoteInput.value = '';
        edPhases = [{ label: 'Phase 1', rotation: [] }];
        edStyle = 'necromancy'; edDeleteBtn.style.display = 'none';
    }
    edPhaseIdx = 0;
    renderEditorPhaseTabs();
    renderAbilityRows();
    showEditor('detail');
}

function renderEditorPhaseTabs(): void {
    edPhaseTabsEl.innerHTML = '';
    edPhases.forEach((ph, i) => {
        const btn = document.createElement('button');
        btn.className = 'ed-phase-tab' + (i === edPhaseIdx ? ' active' : '');
        btn.textContent = ph.label;
        btn.addEventListener('click', () => { syncAbilityInputs(); edPhaseIdx = i; renderEditorPhaseTabs(); renderAbilityRows(); });
        edPhaseTabsEl.appendChild(btn);
    });
    edPhaseNameHint.textContent = edPhases.length > 1 ? `(${edPhases[edPhaseIdx]?.label ?? ''})` : '';
}

edAddPhaseBtn.addEventListener('click', () => {
    syncAbilityInputs();
    edPhases.push({ label: `Phase ${edPhases.length + 1}`, rotation: [] });
    edPhaseIdx = edPhases.length - 1;
    renderEditorPhaseTabs(); renderAbilityRows();
});

edStyleSel.addEventListener('change', () => { edStyle = edStyleSel.value as CombatStyle; });

function syncAbilityInputs(): void {
    edAbilityListEl.querySelectorAll<HTMLInputElement>('.ed-ability-name').forEach((input, i) => {
        if (edPhases[edPhaseIdx]) edPhases[edPhaseIdx].rotation[i].name = input.value;
    });
}

function renderAbilityRows(): void {
    const phase = edPhases[edPhaseIdx];
    if (!phase) return;
    edAbilityListEl.innerHTML = '';
    phase.rotation.forEach((ab, i) => {
        const row = document.createElement('div'); row.className = 'ed-ability-row';
        const idx = document.createElement('span'); idx.className = 'ed-ability-idx'; idx.textContent = `${i+1}.`;
        if (ab.icon) {
            const thumb = document.createElement('img'); thumb.className = 'ed-ab-thumb';
            thumb.src = WIKI_IMG + ab.icon + '.png'; thumb.onerror = () => { thumb.style.display = 'none'; };
            row.append(idx, thumb);
        } else { row.appendChild(idx); }
        const nameInput = document.createElement('input'); nameInput.className = 'ed-ability-name'; nameInput.type = 'text';
        nameInput.value = ab.name; nameInput.placeholder = 'Ability name'; nameInput.maxLength = 40;
        nameInput.addEventListener('input', () => { phase.rotation[i].name = nameInput.value; });
        const upBtn = document.createElement('button'); upBtn.className = 'ed-ab-btn'; upBtn.textContent = '↑'; upBtn.disabled = i === 0;
        upBtn.addEventListener('click', () => { syncAbilityInputs(); [phase.rotation[i-1], phase.rotation[i]] = [phase.rotation[i], phase.rotation[i-1]]; renderAbilityRows(); });
        const dnBtn = document.createElement('button'); dnBtn.className = 'ed-ab-btn'; dnBtn.textContent = '↓'; dnBtn.disabled = i === phase.rotation.length - 1;
        dnBtn.addEventListener('click', () => { syncAbilityInputs(); [phase.rotation[i], phase.rotation[i+1]] = [phase.rotation[i+1], phase.rotation[i]]; renderAbilityRows(); });
        const delBtn = document.createElement('button'); delBtn.className = 'ed-ab-btn ed-ab-del'; delBtn.textContent = '✕';
        delBtn.addEventListener('click', () => { syncAbilityInputs(); phase.rotation.splice(i, 1); renderAbilityRows(); });
        row.append(nameInput, upBtn, dnBtn, delBtn);
        edAbilityListEl.appendChild(row);
    });
}

edAddAbilityBtn.addEventListener('click', () => { syncAbilityInputs(); openPicker(); });

edSaveBtn.addEventListener('click', () => {
    syncAbilityInputs();
    const name = edNameInput.value.trim();
    if (!name) { edNameInput.focus(); return; }
    const phases = edPhases
        .map(p => ({ label: p.label, rotation: p.rotation.filter(a => a.name.trim()) }))
        .filter(p => p.rotation.length > 0 || edPhases.length === 1);
    const cr: SavedCustomGuide = {
        id: editingId ?? generateId(), name,
        bossTarget: edBossTargetInput.value.trim().toLowerCase() || undefined,
        style: edStyleSel.value as CombatStyle,
        setupNote: edSetupNoteInput.value.trim() || undefined,
        phaseMode: phases.length > 1 ? 'sequential' : 'single',
        phases: phases.map(p => ({ label: p.label, rotation: p.rotation.map(r => ({ name: r.name.trim(), icon: r.icon })) })),
    };
    customGuides.set(cr.id, cr); saveCustomGuides(); refreshDropdown();
    renderCustomList(); showEditor('list');
});

edDeleteBtn.addEventListener('click', () => {
    if (!editingId) return;
    customGuides.delete(editingId); saveCustomGuides(); refreshDropdown();
    if (manualGuideKey === 'custom:' + editingId) { manualGuideKey = null; bossSelectEl.value = ''; if (!detectedGuideKey) unloadGuide(); }
    renderCustomList(); showEditor('list');
});

// ── Ability picker ────────────────────────────────────────────────────────────

let pickerStyle: CombatStyle = 'necromancy';

function openPicker(): void {
    pickerStyle = edStyle;
    pickerManualInput.value = '';
    renderPickerTabs(); renderPickerGrid(pickerStyle);
    showEditor('picker');
}

function renderPickerTabs(): void {
    pickerTabsEl.innerHTML = '';
    (['melee', 'ranged', 'magic', 'necromancy'] as CombatStyle[]).forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'picker-tab' + (s === pickerStyle ? ' active' : '');
        btn.textContent = STYLE_LABELS[s];
        btn.addEventListener('click', () => { pickerStyle = s; renderPickerTabs(); renderPickerGrid(s); });
        pickerTabsEl.appendChild(btn);
    });
}

function renderPickerGrid(style: CombatStyle): void {
    pickerGridEl.innerHTML = '';
    const cats: AbilityCategory[] = ['basic', 'enhanced', 'ultimate', 'utility', 'special', 'greater'];
    for (const cat of cats) {
        const abilities = ABILITIES[style][cat];
        if (!abilities.length) continue;
        const header = document.createElement('div'); header.className = 'picker-cat-header'; header.textContent = CATEGORY_LABELS[cat];
        pickerGridEl.appendChild(header);
        const grid = document.createElement('div'); grid.className = 'picker-cat-grid';
        for (const ab of abilities) {
            const cell = document.createElement('button'); cell.className = 'picker-ability'; cell.title = ab.name;
            if (ab.wikiFile) {
                const img = document.createElement('img'); img.src = WIKI_IMG + ab.wikiFile + '.png';
                img.width = 40; img.height = 40; img.alt = ab.name; img.onerror = () => { img.style.opacity = '0.3'; };
                cell.appendChild(img);
            } else {
                const ph = document.createElement('div'); ph.className = 'picker-no-img'; ph.textContent = ab.name.charAt(0).toUpperCase();
                cell.appendChild(ph);
            }
            const lbl = document.createElement('span'); lbl.textContent = ab.name; cell.appendChild(lbl);
            cell.addEventListener('click', () => pickAbility(ab.name, ab.wikiFile));
            grid.appendChild(cell);
        }
        pickerGridEl.appendChild(grid);
    }
}

function pickAbility(name: string, wikiFile?: string): void {
    const phase = edPhases[edPhaseIdx];
    if (!phase) return;
    phase.rotation.push({ name, icon: wikiFile });
    if (wikiFile) loadIcon(wikiFile);
    renderAbilityRows();
    showEditor('detail');
}

pickerBackBtn.addEventListener('click', () => showEditor('detail'));
pickerManualAdd.addEventListener('click', () => {
    const name = pickerManualInput.value.trim();
    if (!name) return;
    const phase = edPhases[edPhaseIdx];
    if (phase) { phase.rotation.push({ name }); renderAbilityRows(); showEditor('detail'); }
});
pickerManualInput.addEventListener('keydown', e => { if (e.key === 'Enter') pickerManualAdd.click(); });

// ── Boot ──────────────────────────────────────────────────────────────────────

function preloadGuideIcons(): void {
    for (const guide of Object.values(GUIDES)) {
        for (const ph of guide.phases) preloadPhaseIcons(ph);
    }
}

loadCustomGuides();
refreshDropdown();
preloadGuideIcons();
unloadGuide();

setInterval(poll, POLL_MS);
poll();
