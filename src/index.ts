import * as a1lib from 'alt1/base';
import TargetMobReader from 'alt1/targetmob';
import { ROTATIONS, BOSS_NAME_MAP, BossPhase, BossRotation } from './rotations';

if (a1lib.hasAlt1) {
    alt1.identifyAppUrl('https://jazztazz1991.github.io/runehub-alt1/appconfig.json');
}

// alt1.mixColor doesn't exist in 1.6.0 — build ARGB integer directly
function mixColor(r: number, g: number, b: number, a: number = 255): number {
    return (((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)) >>> 0;
}

// ── Icon loader ───────────────────────────────────────────────────────────────
// alt1.overLayImage expects base64-encoded BGRA (not RGBA) at a fixed size.
// Icons are served from our own GitHub Pages to avoid CORS.

const ICON_SIZE = 40;
const ICON_BASE = 'https://jazztazz1991.github.io/runehub-alt1/icons/';
// Cache maps icon filename → BGRA base64 string, or null if load failed.
const iconCache = new Map<string, string | null>();

async function loadIcon(filename: string): Promise<void> {
    if (iconCache.has(filename)) return;
    iconCache.set(filename, null); // mark as pending so we don't double-fetch
    try {
        const resp = await fetch(ICON_BASE + filename + '.png');
        const blob = await resp.blob();
        const bitmap = await createImageBitmap(blob, { resizeWidth: ICON_SIZE, resizeHeight: ICON_SIZE });
        const canvas = document.createElement('canvas');
        canvas.width  = ICON_SIZE;
        canvas.height = ICON_SIZE;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(bitmap, 0, 0);
        const { data: rgba } = ctx.getImageData(0, 0, ICON_SIZE, ICON_SIZE);
        // alt1.overLayImage needs BGRA
        const bgra = new Uint8Array(rgba.length);
        for (let i = 0; i < rgba.length; i += 4) {
            bgra[i]   = rgba[i + 2]; // B
            bgra[i+1] = rgba[i + 1]; // G
            bgra[i+2] = rgba[i];     // R
            bgra[i+3] = rgba[i + 3]; // A
        }
        let bin = '';
        for (let i = 0; i < bgra.length; i++) bin += String.fromCharCode(bgra[i]);
        iconCache.set(filename, btoa(bin));
    } catch {
        iconCache.set(filename, null);
    }
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

const reader  = new TargetMobReader();
const POLL_MS = 200;
const GCD_MS  = 1800;
const OV_GROUP = 'rh-rotation';

const BOX_W   = 120;
const BOX_H   = 50;
const BOX_GAP = 8;
const TOTAL_W = BOX_W * 3 + BOX_GAP * 2;

// DOM
const bossSelectEl = document.getElementById('boss-select') as HTMLSelectElement;
const setupNoteEl  = document.getElementById('setup-note')!;
const stepCounter  = document.getElementById('step-counter')!;
const startBtn     = document.getElementById('start-btn') as HTMLButtonElement;
const resetBtn     = document.getElementById('reset-btn') as HTMLButtonElement;
const setposBtn    = document.getElementById('setpos-btn') as HTMLButtonElement;

// ── Overlay position ──────────────────────────────────────────────────────────
// Stored as RS3-window-relative offsets so it survives the game window moving.

let ovRelX = 0;
let ovRelY = 0;
let hasCustomPosition = false;
let isSelectingLocation = false;

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
        if (mpos) {
            return {
                x: alt1.rsX + mpos.x - Math.floor(TOTAL_W / 2),
                y: alt1.rsY + mpos.y - Math.floor(BOX_H  / 2),
            };
        }
    }
    if (hasCustomPosition && a1lib.hasAlt1) {
        return { x: alt1.rsX + ovRelX, y: alt1.rsY + ovRelY };
    }
    return {
        x: alt1.rsX + Math.floor((alt1.rsWidth  - TOTAL_W) / 2),
        y: alt1.rsY + alt1.rsHeight - BOX_H - 110,
    };
}

function enterPositioningMode(): void {
    isSelectingLocation = true;
    setposBtn.textContent = '⊕ Setting... (Alt+1 to lock)';
    setposBtn.classList.add('selecting');
    drawOverlay();
}

function lockPosition(rsRelX: number, rsRelY: number): void {
    ovRelX = rsRelX - Math.floor(TOTAL_W / 2);
    ovRelY = rsRelY - Math.floor(BOX_H  / 2);
    hasCustomPosition = true;
    localStorage.setItem('rh-ov-rx', String(ovRelX));
    localStorage.setItem('rh-ov-ry', String(ovRelY));
    isSelectingLocation = false;
    setposBtn.textContent = '⊕ Set Overlay Position';
    setposBtn.classList.remove('selecting');
    drawOverlay();
}

// Alt+1 fires the alt1pressed event; e.mouseRs is RS3-window-relative coords
a1lib.on('alt1pressed', (e) => {
    if (isSelectingLocation) {
        lockPosition(e.mouseRs.x, e.mouseRs.y);
    }
});

setposBtn.addEventListener('click', enterPositioningMode);

// ── Rotation state ────────────────────────────────────────────────────────────

let manualBossKey:   string | null = null;
let detectedBossKey: string | null = null;
let currentPhase:    BossPhase | null = null;
let currentBoss:     BossRotation | null = null;
let rotationIndex = 0;
let isRunning     = false;
let gcdTimer: ReturnType<typeof setInterval> | null = null;
let lastTargetName = '';
let initialHp: number | null = null;

// ── Populate boss selector ────────────────────────────────────────────────────

Object.entries(ROTATIONS).forEach(([key, boss]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = boss.bossName;
    bossSelectEl.appendChild(opt);
});

bossSelectEl.addEventListener('change', () => {
    manualBossKey = bossSelectEl.value || null;
    if (!detectedBossKey) {
        if (manualBossKey) {
            loadBoss(ROTATIONS[manualBossKey], ROTATIONS[manualBossKey].phases[0]);
        } else {
            setIdle();
        }
    }
});

// ── Timer ─────────────────────────────────────────────────────────────────────

function startGcd(): void {
    if (isRunning || !currentPhase) return;
    isRunning = true;
    startBtn.textContent = '⏸';
    startBtn.classList.add('running');
    gcdTimer = setInterval(() => { advance(); }, GCD_MS);
}

function pauseGcd(): void {
    if (gcdTimer) { clearInterval(gcdTimer); gcdTimer = null; }
    isRunning = false;
    startBtn.textContent = '▶';
    startBtn.classList.remove('running');
}

function advance(): void {
    if (!currentPhase) return;
    rotationIndex = (rotationIndex + 1) % currentPhase.rotation.length;
    updatePanel();
    drawOverlay();
}

function resetRotation(): void {
    pauseGcd();
    rotationIndex = 0;
    initialHp = null;
    updatePanel();
    drawOverlay();
}

// ── Load / idle ───────────────────────────────────────────────────────────────

function loadBoss(boss: BossRotation, phase: BossPhase): void {
    currentBoss   = boss;
    currentPhase  = phase;
    rotationIndex = 0;
    initialHp     = null;
    setupNoteEl.textContent = boss.setupNote ?? '';
    updatePanel();
    drawOverlay();
}

function setIdle(): void {
    pauseGcd();
    currentBoss   = null;
    currentPhase  = null;
    rotationIndex = 0;
    setupNoteEl.textContent = '';
    stepCounter.textContent = '';
    clearOverlay();
}

function updatePanel(): void {
    if (!currentPhase) return;
    stepCounter.textContent = `${rotationIndex + 1} / ${currentPhase.rotation.length}`;
}

// ── Boss detection ────────────────────────────────────────────────────────────

function detectBossAndPhase(): { boss: BossRotation; phase: BossPhase; targetName: string } | null {
    if (!a1lib.hasAlt1) return null;
    let state;
    try { state = reader.read(); } catch { return null; }
    if (!state?.name) return null;

    const lower = state.name.toLowerCase();
    for (const [fragment, bossKey] of BOSS_NAME_MAP) {
        if (lower.includes(fragment)) {
            const boss  = ROTATIONS[bossKey];
            const phase = boss.phases.find(p => p.triggerTarget && lower.includes(p.triggerTarget))
                       ?? boss.phases[0];
            return { boss, phase, targetName: state.name };
        }
    }
    return null;
}

// ── Overlay drawing ───────────────────────────────────────────────────────────

function drawOverlay(): void {
    if (!a1lib.hasAlt1 || (!currentPhase && !isSelectingLocation)) {
        clearOverlay();
        return;
    }
    const { x, y } = getOverlayOrigin();
    console.log('[RH] draw x=' + x + ' y=' + y + ' phase=' + !!currentPhase + ' rsX=' + alt1.rsX + ' rsY=' + alt1.rsY + ' rsH=' + alt1.rsHeight);
    if (!isFinite(x) || !isFinite(y)) { console.log('[RH] bad coords, skipping'); return; }

    const TIME = 600;

    alt1.overLaySetGroup(OV_GROUP);
    alt1.overLayClearGroup(OV_GROUP);
    console.log('[RH] group cleared, drawing boxes');

    // Resolve abilities (or placeholders in positioning mode with no rotation loaded)
    let prev = { name: 'Prev', icon: undefined as string | undefined };
    let cur  = { name: 'Now',  icon: undefined as string | undefined };
    let nxt  = { name: 'Next', icon: undefined as string | undefined };
    if (currentPhase) {
        const r = currentPhase.rotation;
        const l = r.length;
        const pa = r[(rotationIndex - 1 + l) % l];
        const ca = r[rotationIndex];
        const na = r[(rotationIndex + 1) % l];
        prev = { name: pa.name, icon: pa.icon };
        cur  = { name: ca.name, icon: ca.icon };
        nxt  = { name: na.name, icon: na.icon };
    }

    drawBox(x,                       y, prev.name, prev.icon, 'prev',    TIME);
    drawBox(x + BOX_W + BOX_GAP,     y, cur.name,  cur.icon,  'current', TIME);
    drawBox(x + (BOX_W + BOX_GAP)*2, y, nxt.name,  nxt.icon,  'next',    TIME);

    if (isSelectingLocation) {
        alt1.overLayTextEx(
            'Press Alt+1 to save position',
            mixColor(240, 192, 96, 255), 11,
            x, y - 16, TIME, 'chatbox', true, false
        );
    }

    alt1.overLayRefreshGroup(OV_GROUP);
    console.log('[RH] refreshed');
}

function drawBox(x: number, y: number, name: string, iconKey: string | undefined, type: 'prev' | 'current' | 'next', time: number): void {
    const borderW     = type === 'current' ? 2 : 1;
    const borderColor = type === 'current'
        ? mixColor(240, 192, 96, 255)
        : mixColor(80, 80, 80, 180);
    console.log('[RH] rect ' + type + ' x=' + x + ' y=' + y + ' color=' + borderColor);
    alt1.overLayRect(borderColor, x, y, BOX_W, BOX_H, time, borderW);

    const iconBgra = iconKey ? iconCache.get(iconKey) ?? null : null;

    if (iconBgra) {
        const iconX = x + Math.floor((BOX_W - ICON_SIZE) / 2);
        const iconY = y + 4;
        let iconDrawn = false;
        try {
            alt1.overLayImage(iconX, iconY, iconBgra, ICON_SIZE, time);
            iconDrawn = true;
        } catch (e) { console.log('[RH] overLayImage failed:', e); }

        if (iconDrawn) {
            const labelColor = type === 'prev'
                ? mixColor(100, 100, 100, 220)
                : type === 'next'
                    ? mixColor(160, 160, 160, 220)
                    : mixColor(240, 192, 96, 255);
            alt1.overLayTextEx(name, labelColor, 9, x + 3, y + BOX_H - 12, time, 'chatbox', true, false);
            return;
        }
    }

    {
        // Fallback: text only (icon not loaded yet)
        if (type === 'current') {
            alt1.overLayTextEx('NOW', mixColor(240, 192, 96, 220), 9, x + 4, y + 4, time, 'chatbox', false, false);
        }
        const nameColor = type === 'prev'
            ? mixColor(110, 110, 110, 255)
            : type === 'next'
                ? mixColor(190, 190, 190, 255)
                : mixColor(255, 240, 160, 255);
        const fontSize = type === 'current' ? 14 : 12;
        const textY    = type === 'current' ? y + 18 : y + 16;
        alt1.overLayTextEx(name, nameColor, fontSize, x + 6, textY, time, 'chatbox', true, false);
    }
}

function clearOverlay(): void {
    if (!a1lib.hasAlt1) return;
    alt1.overLaySetGroup(OV_GROUP);
    alt1.overLayClearGroup(OV_GROUP);
    alt1.overLayRefreshGroup(OV_GROUP);
}

// ── Poll ──────────────────────────────────────────────────────────────────────

function poll(): void {
    const result = detectBossAndPhase();

    if (!result) {
        if (detectedBossKey !== null) {
            detectedBossKey = null;
            lastTargetName  = '';
            pauseGcd();
            if (manualBossKey) {
                loadBoss(ROTATIONS[manualBossKey], ROTATIONS[manualBossKey].phases[0]);
            } else {
                setIdle();
            }
        }
        if (currentPhase || isSelectingLocation) drawOverlay();
        return;
    }

    const { boss, phase, targetName } = result;
    detectedBossKey = Object.keys(ROTATIONS).find(k => ROTATIONS[k] === boss) ?? null;

    if (targetName !== lastTargetName) {
        lastTargetName = targetName;
        pauseGcd();
        loadBoss(boss, phase);
    }

    if (!isRunning && currentPhase) {
        const hp = reader.state?.hp;
        if (hp) {
            if (initialHp === null) initialHp = hp;
            else if (hp < initialHp)  startGcd();
        }
    }

    drawOverlay();
}

// ── Buttons ───────────────────────────────────────────────────────────────────

startBtn.addEventListener('click', () => { isRunning ? pauseGcd() : startGcd(); });
resetBtn.addEventListener('click', resetRotation);

// ── Boot ──────────────────────────────────────────────────────────────────────

preloadRotationIcons();
setIdle();
setInterval(poll, POLL_MS);
poll();
