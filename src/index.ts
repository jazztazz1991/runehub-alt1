import * as a1lib from 'alt1/base';
import TargetMobReader from 'alt1/targetmob';
import { ROTATIONS, BOSS_NAME_MAP, BossPhase, BossRotation } from './rotations';

if (a1lib.hasAlt1) {
    alt1.identifyAppUrl('https://jazztazz1991.github.io/runehub-alt1/appconfig.json');
}

const reader       = new TargetMobReader();
const POLL_MS      = 800;
const GCD_MS       = 1800;

// DOM
const bossNameEl   = document.getElementById('boss-name')!;
const setupNoteEl  = document.getElementById('setup-note')!;
const overlayEl    = document.getElementById('overlay-main')!;
const prevName     = document.getElementById('prev-name')!;
const currentName  = document.getElementById('current-name')!;
const currentNote  = document.getElementById('current-note')!;
const nextName     = document.getElementById('next-name')!;
const startBtn     = document.getElementById('start-btn') as HTMLButtonElement;
const resetBtn     = document.getElementById('reset-btn') as HTMLButtonElement;
const progressFill = document.getElementById('progress-fill')!;
const stepCounter  = document.getElementById('step-counter')!;

// State
let currentBossKey: string | null = null;
let currentPhase: BossPhase | null = null;
let rotationIndex = 0;
let isRunning = false;
let gcdTimer: ReturnType<typeof setInterval> | null = null;
let lastTargetName = '';
let initialHp: number | null = null;

// ── Timer ────────────────────────────────────────────────────────────────────

function startGcd(): void {
    if (isRunning || !currentPhase) return;
    isRunning = true;
    startBtn.textContent = '⏸ Running';
    startBtn.classList.add('running');
    kickProgressBar();
    gcdTimer = setInterval(() => {
        advance();
        kickProgressBar();
    }, GCD_MS);
}

function pauseGcd(): void {
    if (gcdTimer) { clearInterval(gcdTimer); gcdTimer = null; }
    isRunning = false;
    startBtn.textContent = '▶ Start';
    startBtn.classList.remove('running');
    stopProgressBar();
}

function advance(): void {
    if (!currentPhase) return;
    rotationIndex = (rotationIndex + 1) % currentPhase.rotation.length;
    renderAbilities();
}

function resetRotation(): void {
    pauseGcd();
    rotationIndex = 0;
    renderAbilities();
}

// ── Progress bar ─────────────────────────────────────────────────────────────

function kickProgressBar(): void {
    // Force reflow to restart CSS animation
    progressFill.classList.remove('animating');
    progressFill.style.animationDuration = '';
    void progressFill.offsetWidth; // trigger reflow
    progressFill.style.animationDuration = `${GCD_MS}ms`;
    progressFill.classList.add('animating');
}

function stopProgressBar(): void {
    progressFill.classList.remove('animating');
    progressFill.style.transform = 'scaleX(1)';
}

// ── Render ───────────────────────────────────────────────────────────────────

function renderAbilities(): void {
    if (!currentPhase) return;
    const rotation = currentPhase.rotation;
    const len = rotation.length;
    const prev = rotation[(rotationIndex - 1 + len) % len];
    const cur  = rotation[rotationIndex];
    const nxt  = rotation[(rotationIndex + 1) % len];
    prevName.textContent    = prev.name;
    currentName.textContent = cur.name;
    currentNote.textContent = cur.note ?? '';
    nextName.textContent    = nxt.name;
    stepCounter.textContent = `${rotationIndex + 1}/${len}`;
}

function setIdle(): void {
    overlayEl.classList.add('idle');
    bossNameEl.textContent  = 'No boss detected';
    setupNoteEl.textContent = '';
    prevName.textContent    = '---';
    currentName.textContent = '---';
    currentNote.textContent = '';
    nextName.textContent    = '---';
    stepCounter.textContent = '';
}

function loadBoss(boss: BossRotation, phase: BossPhase): void {
    overlayEl.classList.remove('idle');
    bossNameEl.textContent  = boss.bossName;
    setupNoteEl.textContent = boss.setupNote ?? '';
    currentPhase = phase;
    rotationIndex = 0;
    initialHp    = null;
    renderAbilities();
}

// ── Boss detection ────────────────────────────────────────────────────────────

function detectBossAndPhase(): { boss: BossRotation; phase: BossPhase } | null {
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
            return { boss, phase };
        }
    }
    return null;
}

// ── Poll ──────────────────────────────────────────────────────────────────────

function poll(): void {
    const result = detectBossAndPhase();

    if (!result) {
        if (lastTargetName !== '') {
            lastTargetName = '';
            pauseGcd();
            setIdle();
        }
        return;
    }

    const { boss, phase } = result;
    const targetName = reader.state!.name;

    if (targetName !== lastTargetName) {
        lastTargetName = targetName;
        pauseGcd();
        loadBoss(boss, phase);
    }

    // Auto-start when boss HP first drops (first hit landed).
    if (!isRunning && currentPhase) {
        const hp = reader.state?.hp;
        if (hp) {
            if (initialHp === null) {
                initialHp = hp;
            } else if (hp < initialHp) {
                startGcd();
            }
        }
    }
}

// ── Buttons ───────────────────────────────────────────────────────────────────

startBtn.addEventListener('click', () => {
    if (isRunning) pauseGcd(); else startGcd();
});

resetBtn.addEventListener('click', resetRotation);

// ── Boot ──────────────────────────────────────────────────────────────────────

setIdle();
setInterval(poll, POLL_MS);
poll();
