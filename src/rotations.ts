export interface Ability {
    name: string;
    icon?: string;
    note?: string;
}

export interface BossPhase {
    label: string;
    // Lowercase target name substring that auto-activates this phase.
    // Omit for single-phase bosses.
    triggerTarget?: string;
    rotation: Ability[];
}

export interface BossRotation {
    bossName: string;
    style: 'ranged' | 'necromancy' | 'melee' | 'magic';
    // Shown above the rotation as a reminder — gear, prayers, etc.
    setupNote?: string;
    phases: BossPhase[];
}

export const ROTATIONS: Record<string, BossRotation> = {
    'KBD': {
        bossName: 'King Black Dragon',
        style: 'necromancy',
        setupNote: 'Conjure Undead Army before entering. Pray Soul Split + Torment.',
        phases: [
            {
                label: 'Main fight',
                triggerTarget: 'king black dragon',
                rotation: [
                    { name: 'Invoke Death',   note: 'Open with this — gives free Finger of Death hit' },
                    { name: 'Living Death',   note: 'Pop ult immediately after' },
                    { name: 'Touch of Death', note: 'Builds residual soul stacks' },
                    { name: 'Death Skulls',   note: 'Main damage — bounces 4x under Living Death' },
                    { name: 'Finger of Death', note: 'Use at 6+ necrosis stacks for best damage' },
                    { name: 'Touch of Death' },
                    { name: 'Volley of Souls', note: 'Use at 3 residual soul stacks' },
                    { name: 'Death Skulls' },
                    { name: 'Soul Sap',       note: 'Build necrosis stacks between Skulls' },
                    { name: 'Touch of Death' },
                    { name: 'Finger of Death' },
                    { name: '↩ Repeat',       note: 'Loop from Death Skulls when Living Death is up again' },
                ],
            },
        ],
    },
};

// Maps lowercase target name substring → ROTATIONS key.
// More specific substrings should come first.
export const BOSS_NAME_MAP: [string, string][] = [
    ['king black dragon', 'KBD'],
];
