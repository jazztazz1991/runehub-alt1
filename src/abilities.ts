export type CombatStyle = 'melee' | 'ranged' | 'magic' | 'necromancy';
export type AbilityCategory = 'basic' | 'enhanced' | 'ultimate' | 'utility';

export interface AbilityDef {
    name: string;
    wikiFile: string; // RS3 wiki filename without .png (TitleCase_With_Underscores)
}

export const WIKI_IMG = 'https://runescape.wiki/images/';

export const ABILITIES: Record<CombatStyle, Record<AbilityCategory, AbilityDef[]>> = {
    melee: {
        basic: [
            { name: 'Slice',         wikiFile: 'Slice' },
            { name: 'Kick',          wikiFile: 'Kick' },
            { name: 'Punish',        wikiFile: 'Punish' },
            { name: 'Fury',          wikiFile: 'Fury_(ability)' },
            { name: 'Dismember',     wikiFile: 'Dismember' },
            { name: 'Sever',         wikiFile: 'Sever' },
            { name: 'Cleave',        wikiFile: 'Cleave' },
            { name: 'Smash',         wikiFile: 'Smash' },
            { name: 'Backhand',      wikiFile: 'Backhand' },
            { name: 'Impact',        wikiFile: 'Impact' },
            { name: 'Havoc',         wikiFile: 'Havoc' },
            { name: 'Quake',         wikiFile: 'Quake' },
            { name: 'Demoralise',    wikiFile: 'Demoralise' },
        ],
        enhanced: [
            { name: 'Barge',             wikiFile: 'Barge' },
            { name: 'Bladed Dive',       wikiFile: 'Bladed_Dive' },
            { name: 'Flurry',            wikiFile: 'Flurry' },
            { name: 'Hurricane',         wikiFile: 'Hurricane' },
            { name: 'Assault',           wikiFile: 'Assault' },
            { name: 'Destroy',           wikiFile: 'Destroy' },
            { name: 'Forceful Backhand', wikiFile: 'Forceful_Backhand' },
            { name: 'Deep Impact',       wikiFile: 'Deep_Impact' },
            { name: 'Slaughter',         wikiFile: 'Slaughter' },
            { name: 'Blood Tendrils',    wikiFile: 'Blood_Tendrils' },
        ],
        ultimate: [
            { name: 'Berserk',       wikiFile: 'Berserk' },
            { name: 'Overpower',     wikiFile: 'Overpower' },
            { name: 'Meteor Strike', wikiFile: 'Meteor_Strike' },
            { name: 'Pulverise',     wikiFile: 'Pulverise' },
            { name: 'Massacre',      wikiFile: 'Massacre' },
        ],
        utility: [
            { name: 'Freedom',          wikiFile: 'Freedom' },
            { name: 'Anticipation',     wikiFile: 'Anticipation' },
            { name: 'Barricade',        wikiFile: 'Barricade' },
            { name: 'Debilitate',       wikiFile: 'Debilitate' },
            { name: 'Resonance',        wikiFile: 'Resonance' },
            { name: 'Natural Instinct', wikiFile: 'Natural_Instinct' },
            { name: 'Surge',            wikiFile: 'Surge' },
            { name: 'Provoke',          wikiFile: 'Provoke' },
            { name: 'Revenge',          wikiFile: 'Revenge' },
            { name: 'Shatter',          wikiFile: 'Shatter' },
        ],
    },
    ranged: {
        basic: [
            { name: 'Piercing Shot',      wikiFile: 'Piercing_Shot' },
            { name: 'Ricochet',           wikiFile: 'Ricochet' },
            { name: 'Binding Shot',       wikiFile: 'Binding_Shot' },
            { name: 'Fragmentation Shot', wikiFile: 'Fragmentation_Shot' },
            { name: 'Needle Strike',      wikiFile: 'Needle_Strike' },
            { name: 'Dazing Shot',        wikiFile: 'Dazing_Shot' },
            { name: 'Corruption Shot',    wikiFile: 'Corruption_Shot' },
        ],
        enhanced: [
            { name: 'Snap Shot',              wikiFile: 'Snap_Shot' },
            { name: 'Rapid Fire',             wikiFile: 'Rapid_Fire' },
            { name: 'Bombardment',            wikiFile: 'Bombardment' },
            { name: 'Shadow Tendrils',        wikiFile: 'Shadow_Tendrils' },
            { name: 'Tight Bindings',         wikiFile: 'Tight_Bindings' },
            { name: 'Mechanised Chinchompas', wikiFile: 'Mechanised_Chinchompas' },
        ],
        ultimate: [
            { name: "Death's Swiftness", wikiFile: "Death's_Swiftness" },
            { name: 'Incendiary Shot',   wikiFile: 'Incendiary_Shot' },
            { name: 'Unload',            wikiFile: 'Unload' },
        ],
        utility: [
            { name: 'Freedom',      wikiFile: 'Freedom' },
            { name: 'Anticipation', wikiFile: 'Anticipation' },
            { name: 'Escape',       wikiFile: 'Escape' },
            { name: 'Surge',        wikiFile: 'Surge' },
            { name: 'Resonance',    wikiFile: 'Resonance' },
            { name: 'Provoke',      wikiFile: 'Provoke' },
        ],
    },
    magic: {
        basic: [
            { name: 'Wrack',              wikiFile: 'Wrack' },
            { name: 'Sonic Wave',         wikiFile: 'Sonic_Wave' },
            { name: 'Concentrated Blast', wikiFile: 'Concentrated_Blast' },
            { name: 'Dragon Breath',      wikiFile: 'Dragon_Breath' },
            { name: 'Combust',            wikiFile: 'Combust' },
            { name: 'Chain',              wikiFile: 'Chain' },
            { name: 'Shock',              wikiFile: 'Shock' },
            { name: 'Corruption Blast',   wikiFile: 'Corruption_Blast' },
            { name: 'Wrack and Ruin',     wikiFile: 'Wrack_and_Ruin' },
        ],
        enhanced: [
            { name: 'Wild Magic',     wikiFile: 'Wild_Magic' },
            { name: 'Asphyxiate',     wikiFile: 'Asphyxiate' },
            { name: 'Detonate',       wikiFile: 'Detonate' },
            { name: 'Smoke Tendrils', wikiFile: 'Smoke_Tendrils' },
        ],
        ultimate: [
            { name: 'Sunshine',  wikiFile: 'Sunshine' },
            { name: 'Omnipower', wikiFile: 'Omnipower' },
        ],
        utility: [
            { name: 'Vulnerability', wikiFile: 'Vulnerability' },
            { name: 'Entangle',      wikiFile: 'Entangle' },
            { name: 'Snare',         wikiFile: 'Snare' },
            { name: 'Freedom',       wikiFile: 'Freedom' },
            { name: 'Anticipation',  wikiFile: 'Anticipation' },
            { name: 'Surge',         wikiFile: 'Surge' },
            { name: 'Resonance',     wikiFile: 'Resonance' },
        ],
    },
    necromancy: {
        basic: [
            { name: 'Soul Sap',        wikiFile: 'Soul_Sap' },
            { name: 'Touch of Death',  wikiFile: 'Touch_of_Death' },
            { name: 'Bone Shield',     wikiFile: 'Bone_Shield' },
            { name: 'Spectral Scythe', wikiFile: 'Spectral_Scythe' },
        ],
        enhanced: [
            { name: 'Bloat',               wikiFile: 'Bloat' },
            { name: 'Skeletal Claws',      wikiFile: 'Skeletal_Claws' },
            { name: 'Blood Siphon',        wikiFile: 'Blood_Siphon' },
            { name: 'Volley of Souls',     wikiFile: 'Volley_of_Souls' },
            { name: 'Spectral Scythe II',  wikiFile: 'Spectral_Scythe_II' },
            { name: 'Soul Strike',         wikiFile: 'Soul_Strike' },
            { name: 'Spite',               wikiFile: 'Spite' },
        ],
        ultimate: [
            { name: 'Death Skulls',    wikiFile: 'Death_Skulls' },
            { name: 'Living Death',    wikiFile: 'Living_Death' },
            { name: 'Finger of Death', wikiFile: 'Finger_of_Death' },
            { name: 'Invoke Death',    wikiFile: 'Invoke_Death' },
        ],
        utility: [
            { name: 'Conjure Undead Army',      wikiFile: 'Conjure_Undead_Army' },
            { name: 'Command Undead Army',      wikiFile: 'Command_Undead_Army' },
            { name: 'Conjure Skeleton Warrior', wikiFile: 'Conjure_Skeleton_Warrior' },
            { name: 'Command Skeleton Warrior', wikiFile: 'Command_Skeleton_Warrior' },
            { name: 'Conjure Putrid Zombie',    wikiFile: 'Conjure_Putrid_Zombie' },
            { name: 'Command Putrid Zombie',    wikiFile: 'Command_Putrid_Zombie' },
            { name: 'Conjure Vengeful Ghost',   wikiFile: 'Conjure_Vengeful_Ghost' },
            { name: 'Command Vengeful Ghost',   wikiFile: 'Command_Vengeful_Ghost' },
            { name: 'Life Transfer',            wikiFile: 'Life_Transfer' },
            { name: 'Darkness',                 wikiFile: 'Darkness_(necromancy)' },
            { name: 'Soulbound Lantern',        wikiFile: 'Soulbound_Lantern' },
        ],
    },
};

export const CATEGORY_LABELS: Record<AbilityCategory, string> = {
    basic:    'BASIC ABILITY',
    enhanced: 'ENHANCED ABILITY',
    ultimate: 'ULTIMATE ABILITY',
    utility:  'UTILITY ABILITY',
};

export const STYLE_LABELS: Record<CombatStyle, string> = {
    melee:      'Melee',
    ranged:     'Ranged',
    magic:      'Magic',
    necromancy: 'Necro',
};
