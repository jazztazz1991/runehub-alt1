export type CombatStyle = 'melee' | 'ranged' | 'magic' | 'necromancy';
export type PhaseMode   = 'single' | 'sequential' | 'choice' | 'role' | 'waves';

export interface RotationStep {
    name: string;
    icon?: string;
    note?: string;
}

export interface PhaseRestriction {
    label: string;
    type: 'ability' | 'style' | 'movement' | 'aoe' | 'prayer';
}

export interface Phase {
    label: string;
    note?: string;
    restrictions?: PhaseRestriction[];
    requiredStyle?: CombatStyle;
    invulnerable?: boolean;
    rotation: RotationStep[];
    segments?: Phase[];
}

export interface MechanicNote {
    name: string;
    phase?: string;
    description: string;
    critical?: boolean;
}

export interface ChecklistItem {
    id: string;
    label: string;
    category: 'potion' | 'gear' | 'prayer' | 'familiar' | 'other';
    note?: string;
}

export interface DropRef {
    name: string;
    rate: string;
    gpValue?: number;
}

export interface BossGuide {
    bossName: string;
    style: CombatStyle;
    setupNote?: string;
    phaseMode: PhaseMode;
    phases: Phase[];
    mechanics: MechanicNote[];
    setup: ChecklistItem[];
    drops?: DropRef[];
    roles?: string[];
    waveCount?: number;
    waveCheckpoints?: number[];
}

export interface SavedCustomGuide {
    id: string;
    name: string;
    bossTarget?: string;
    style: CombatStyle;
    setupNote?: string;
    phaseMode: 'single' | 'sequential' | 'choice';
    phases: Phase[];
}

export interface KillEntry {
    timestamp: number;
    durationMs: number;
    drops: string[];
    isPB: boolean;
}

export interface KillStats {
    count: number;
    pb: number | null;
    kills: KillEntry[];
}
