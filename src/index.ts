import * as a1lib from 'alt1/base';
import TargetMobReader from 'alt1/targetmob';
import { ROTATIONS, BOSS_NAME_MAP, BossPhase, BossRotation } from './rotations';

if (a1lib.hasAlt1) {
    alt1.identifyAppUrl('https://jazztazz1991.github.io/runehub-alt1/appconfig.json');
}

const reader  = new TargetMobReader();
const POLL_MS = 200;
const GCD_MS  = 1800;
const OV_GROUP = 'rh-rotation';

// Overlay box layout
const BOX_W = 120;
const BOX_H = 50;
const BOX_GAP = 8;
const TOTAL_W = BOX_W * 3 + BOX_GAP * 2;

// DOM
const bossLabelEl  = document.getElementById('boss-label')!;
const bossSelectEl = document.getElementById('boss-select') as HTMLSelectElement;
const setupNoteEl  = document.getElementById('setup-note')!;
const statusTextEl = document.getElementById('status-text')!;
const stepCounter  = document.getElementById('step-counter')!;
const startBtn     = document.getElementById('start-btn') as HTMLButtonElement;
const resetBtn     = document.getElementById('reset-btn') as HTMLButtonElement;

// State
let manualBossKey: string | null = null;   // user-picked from dropdown
let detectedBossKey: string | null = null; // OCR detected
let currentPhase: BossPhase | null = null;
let currentBoss: BossRotation | null = null;
let rotationIndex = 0;
let isRunning = false;
let gcdTimer: ReturnType<typeof setInterval> | null = null;
let lastTargetName = '';
let initialHp: number | null = null;

// ── Populate boss selector ───────────────────────────────────────────────────

Object.entries(ROTATIONS).forEach(([key, boss]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = boss.bossName;
    bossSelectEl.appendChild(opt);
});

bossSelectEl.addEventListener('change', () => {
    manualBossKey = bossSelectEl.value || null;
    // Only apply manual selection if OCR hasn't found a boss
    if (!detectedBossKey) {
        if (manualBossKey) {
            loadBoss(ROTATIONS[manualBossKey], ROTATIONS[manualBossKey].phases[0]);
        } else {
            setIdle();
        }
    }
});

// ── Timer ────────────────────────────────────────────────────────────────────

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
    currentBoss  = boss;
    currentPhase = phase;
    rotationIndex = 0;
    initialHp = null;
    bossLabelEl.textContent  = boss.bossName;
    setupNoteEl.textContent  = boss.setupNote ?? '';
    updatePanel();
    drawOverlay();
}

function setIdle(): void {
    pauseGcd();
    currentBoss  = null;
    currentPhase = null;
    rotationIndex = 0;
    bossLabelEl.textContent  = 'RuneHub Rotation';
    setupNoteEl.textContent  = '';
    statusTextEl.textContent = 'Target a boss or select one above';
    stepCounter.textContent  = '';
    clearOverlay();
}

function updatePanel(): void {
    if (!currentPhase) return;
    const rotation = currentPhase.rotation;
    const cur = rotation[rotationIndex];
    statusTextEl.textContent = cur.note ? `${cur.name} — ${cur.note}` : cur.name;
    stepCounter.textContent  = `${rotationIndex + 1}/${rotation.length}`;
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
    if (!a1lib.hasAlt1 || !currentPhase) { clearOverlay(); return; }

    const rotation = currentPhase.rotation;
    const len = rotation.length;
    const prev = rotation[(rotationIndex - 1 + len) % len];
    const cur  = rotation[rotationIndex];
    const nxt  = rotation[(rotationIndex + 1) % len];

    // Position: bottom-center of RS3 window, above action bar
    const startX = alt1.rsX + Math.floor((alt1.rsWidth  - TOTAL_W) / 2);
    const startY = alt1.rsY + alt1.rsHeight - BOX_H - 110;
    const TIME = 600; // ms — refreshed every 200ms so never expires

    alt1.overLaySetGroup(OV_GROUP);
    alt1.overLayClearGroup(OV_GROUP);

    drawBox(startX,                   startY, prev.name, 'prev',    TIME);
    drawBox(startX + BOX_W + BOX_GAP, startY, cur.name,  'current', TIME);
    drawBox(startX + (BOX_W + BOX_GAP) * 2, startY, nxt.name, 'next', TIME);

    alt1.overLayRefreshGroup(OV_GROUP);
}

function drawBox(x: number, y: number, name: string, type: 'prev' | 'current' | 'next', time: number): void {
    // Border
    const borderW = type === 'current' ? 2 : 1;
    const borderColor = type === 'current'
        ? alt1.mixColor(240, 192, 96, 255)
        : alt1.mixColor(80, 80, 80, 180);
    alt1.overLayRect(borderColor, x, y, BOX_W, BOX_H, time, borderW);

    // "NOW" label above current box
    if (type === 'current') {
        alt1.overLayTextEx('NOW', alt1.mixColor(240, 192, 96, 220), 9, x + 4, y + 4, time, 'chatbox', false, false);
    }

    // Ability name
    const nameColor = type === 'prev'
        ? alt1.mixColor(110, 110, 110, 255)
        : type === 'next'
            ? alt1.mixColor(190, 190, 190, 255)
            : alt1.mixColor(255, 240, 160, 255);
    const fontSize  = type === 'current' ? 14 : 12;
    const textY     = type === 'current' ? y + 18 : y + 16;
    alt1.overLayTextEx(name, nameColor, fontSize, x + 6, textY, time, 'chatbox', true, false);
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
            // Fall back to manual selection if set, otherwise idle
            if (manualBossKey) {
                loadBoss(ROTATIONS[manualBossKey], ROTATIONS[manualBossKey].phases[0]);
            } else {
                setIdle();
            }
        }
        // Keep redrawing overlay if manually selected boss is loaded
        if (currentPhase) drawOverlay();
        return;
    }

    const { boss, phase, targetName } = result;
    detectedBossKey = Object.keys(ROTATIONS).find(k => ROTATIONS[k] === boss) ?? null;

    if (targetName !== lastTargetName) {
        lastTargetName = targetName;
        pauseGcd();
        loadBoss(boss, phase);
    }

    // Auto-start on first HP drop
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

setIdle();
setInterval(poll, POLL_MS);
poll();
