import * as a1lib from 'alt1/base';
import TargetMobReader from 'alt1/targetmob';
import { ROTATIONS, BOSS_NAME_MAP, BossPhase, BossRotation } from './rotations';

if (a1lib.hasAlt1) {
    alt1.identifyAppUrl('https://jazztazz1991.github.io/runehub-alt1/appconfig.json');
}

const reader = new TargetMobReader();
const POLL_MS = 750;

const bossNameEl  = document.getElementById('boss-name')!;
const phaseEl     = document.getElementById('phase-label')!;
const setupNoteEl = document.getElementById('setup-note')!;
const rotationEl  = document.getElementById('rotation-display')!;
const statusEl    = document.getElementById('status')!;

let lastTargetName = '';

function detectBossAndPhase(): { boss: BossRotation; phase: BossPhase } | null {
    if (!a1lib.hasAlt1) return null;

    let state;
    try {
        state = reader.read();
    } catch {
        return null;
    }
    if (!state?.name) return null;

    const lower = state.name.toLowerCase();

    for (const [fragment, bossKey] of BOSS_NAME_MAP) {
        if (lower.includes(fragment)) {
            const boss = ROTATIONS[bossKey];
            // Find the phase whose triggerTarget matches this target name.
            const phase = boss.phases.find(p => p.triggerTarget && lower.includes(p.triggerTarget))
                       ?? boss.phases[0];
            return { boss, phase };
        }
    }

    return null;
}

function renderPhase(phase: BossPhase): void {
    rotationEl.innerHTML = '';
    phase.rotation.forEach((ability) => {
        const row = document.createElement('div');
        row.className = 'ability-row';

        const nameEl = document.createElement('span');
        nameEl.className = 'ability-name';
        nameEl.textContent = ability.name;
        row.appendChild(nameEl);

        if (ability.note) {
            const noteEl = document.createElement('span');
            noteEl.className = 'ability-note';
            noteEl.textContent = ability.note;
            row.appendChild(noteEl);
        }

        rotationEl.appendChild(row);
    });
}

function poll(): void {
    const result = detectBossAndPhase();

    if (!result) {
        if (lastTargetName !== '') {
            lastTargetName = '';
            bossNameEl.textContent = 'No boss detected';
            phaseEl.textContent = '';
            setupNoteEl.textContent = '';
            rotationEl.innerHTML =
                '<div class="no-boss">Stand near a boss to load its rotation.</div>';
            statusEl.textContent = a1lib.hasAlt1 ? 'Scanning target...' : 'Open in Alt1 browser.';
        }
        return;
    }

    const { boss, phase } = result;
    const state = reader.state!;
    const targetName = state.name;

    // Only re-render when target name changes (covers both boss and phase transitions).
    if (targetName !== lastTargetName) {
        lastTargetName = targetName;
        bossNameEl.textContent = boss.bossName;
        phaseEl.textContent = boss.phases.length > 1 ? phase.label : '';
        setupNoteEl.textContent = boss.setupNote ?? '';
        statusEl.textContent = state.hp ? `${state.hp.toLocaleString()} HP` : '';
        renderPhase(phase);
    } else if (state.hp) {
        statusEl.textContent = `${state.hp.toLocaleString()} HP`;
    }
}

setInterval(poll, POLL_MS);
poll();
