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
                    { name: 'Invoke Death',    icon: 'invoke_death',    note: 'Open with this — gives free Finger of Death hit' },
                    { name: 'Living Death',    icon: 'living_death',    note: 'Pop ult immediately after' },
                    { name: 'Touch of Death',  icon: 'touch_of_death',  note: 'Builds residual soul stacks' },
                    { name: 'Death Skulls',    icon: 'death_skulls',    note: 'Main damage — bounces 4x under Living Death' },
                    { name: 'Finger of Death', icon: 'finger_of_death', note: 'Use at 6+ necrosis stacks for best damage' },
                    { name: 'Touch of Death',  icon: 'touch_of_death' },
                    { name: 'Volley of Souls', icon: 'volley_of_souls', note: 'Use at 3 residual soul stacks' },
                    { name: 'Death Skulls',    icon: 'death_skulls' },
                    { name: 'Soul Sap',        icon: 'soul_sap',        note: 'Build necrosis stacks between Skulls' },
                    { name: 'Touch of Death',  icon: 'touch_of_death' },
                    { name: 'Finger of Death', icon: 'finger_of_death' },
                    { name: '↩ Repeat',                                 note: 'Loop from Death Skulls when Living Death is up again' },
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

export interface SavedCustomRotation {
    id: string;
    name: string;
    bossTarget?: string;  // lowercase OCR trigger substring
    style: 'ranged' | 'necromancy' | 'melee' | 'magic';
    setupNote?: string;
    abilities: Array<{ name: string }>;
}
