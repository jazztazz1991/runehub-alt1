export type CombatStyle = 'melee' | 'ranged' | 'magic' | 'necromancy';
export type AbilityCategory = 'basic' | 'enhanced' | 'ultimate' | 'utility' | 'special' | 'greater';

export interface AbilityDef {
    name: string;
    wikiFile?: string; // RS3 wiki filename without .png (TitleCase_With_Underscores)
}

export const WIKI_IMG = 'https://runescape.wiki/images/';

export const ABILITIES: Record<CombatStyle, Record<AbilityCategory, AbilityDef[]>> = {
    melee: {
        basic: [
            { name: 'Slice',         wikiFile: 'Slice' },
            { name: 'Kick',          wikiFile: 'Kick' },
            { name: 'Punish',        wikiFile: 'Punish' },
            { name: 'Fury',          wikiFile: 'Fury' },
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
        special: [
            { name: 'Dragon Claws',     wikiFile: 'Dragon_claw' },
            { name: 'SWH',              wikiFile: "Statius's_warhammer" },
            { name: 'Annihilation',     wikiFile: 'Annihilation' },
            { name: 'Sara GS',          wikiFile: 'Saradomin_godsword' },
            { name: 'Arma GS',          wikiFile: 'Armadyl_godsword' },
            { name: 'Dragon Hatchet',   wikiFile: 'Dragon_hatchet' },
            { name: 'Crystal Hatchet',  wikiFile: 'Crystal_hatchet' },
            { name: 'Dragon Mace',      wikiFile: 'Dragon_mace' },
            { name: 'Dragon Dagger',    wikiFile: 'Dragon_dagger' },
            { name: 'Dragon Long',      wikiFile: 'Dragon_longsword' },
            { name: 'Dragon 2h',        wikiFile: 'Dragon_2h_sword' },
            { name: 'Granite Maul',     wikiFile: 'Granite_maul' },
            { name: "Vesta's Spear",    wikiFile: "Vesta's_spear" },
            { name: "Varanus's Mercy",  wikiFile: "Varanus's_Mercy" },
        ],
        greater: [
            { name: 'Greater Barge',  wikiFile: 'Greater_Barge' },
            { name: 'Greater Fury',   wikiFile: 'Greater_Fury' },
            { name: 'Greater Flurry', wikiFile: 'Greater_Flurry' },
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
            { name: 'Mechanised Chinchompas', wikiFile: 'Mechanised_chinchompa' },
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
        special: [
            { name: 'SGB',       wikiFile: 'Seren_godbow' },
            { name: 'ECB',       wikiFile: 'Eldritch_crossbow' },
            { name: 'Decimation', wikiFile: 'Decimation' },
            { name: 'Dark Bow',  wikiFile: 'Dark_bow' },
            { name: 'Rune Axe',  wikiFile: 'Rune_throwing_axe' },
            { name: 'Gloomfire', wikiFile: 'Gloomfire_bow' },
            { name: 'Zammy Bow', wikiFile: 'Zamorak_bow' },
        ],
        greater: [
            { name: 'Greater Ricochet',          wikiFile: 'Greater_Ricochet' },
            { name: "Greater Death's Swiftness", wikiFile: "Greater_Death's_Swiftness" },
            { name: 'Greater Dazing Shot',       wikiFile: 'Greater_Dazing_Shot' },
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
            { name: 'Vulnerability', wikiFile: 'Vulnerability_icon' },
            { name: 'Entangle',      wikiFile: 'Entangle_icon' },
            { name: 'Snare',         wikiFile: 'Snare_icon' },
            { name: 'Freedom',       wikiFile: 'Freedom' },
            { name: 'Anticipation',  wikiFile: 'Anticipation' },
            { name: 'Surge',         wikiFile: 'Surge' },
            { name: 'Resonance',     wikiFile: 'Resonance' },
        ],
        special: [
            { name: 'Guthix Staff',    wikiFile: 'Guthix_staff' },
            { name: 'Zammy Staff',     wikiFile: 'Zamorak_staff' },
            { name: 'ABS',             wikiFile: 'Armadyl_battlestaff' },
            { name: 'Staff of Light',  wikiFile: 'Staff_of_light' },
            { name: 'Penance Trident', wikiFile: 'Penance_trident' },
            { name: "Iban's Staff",    wikiFile: "Iban's_staff" },
            { name: 'Legatus Staff',   wikiFile: "Legatus's_Emberstaff" },
        ],
        greater: [
            { name: 'Greater Concentrated Blast', wikiFile: 'Greater_Concentrated_Blast' },
            { name: 'Greater Chain',              wikiFile: 'Greater_Chain' },
            { name: 'Greater Sonic Wave',         wikiFile: 'Greater_Sonic_Wave' },
            { name: 'Greater Sunshine',           wikiFile: 'Greater_Sunshine' },
        ],
    },
    necromancy: {
        basic: [
            { name: 'Necromancy',      wikiFile: 'Necromancy_(ability)' },
            { name: 'Soul Sap',        wikiFile: 'Soul_Sap' },
            { name: 'Touch of Death',  wikiFile: 'Touch_of_Death' },
            { name: 'Spectral Scythe', wikiFile: 'Spectral_Scythe' },
        ],
        enhanced: [
            { name: 'Bloat',               wikiFile: 'Bloat' },
            { name: 'Blood Siphon',        wikiFile: 'Blood_Siphon' },
            { name: 'Volley of Souls',     wikiFile: 'Volley_of_Souls' },
            { name: 'Soul Strike',         wikiFile: 'Soul_Strike' },
            { name: 'Spectral Scythe II',  wikiFile: 'Spectral_Scythe_2' },
            { name: 'Spectral Scythe III', wikiFile: 'Spectral_Scythe_3' },
        ],
        ultimate: [
            { name: 'Death Skulls',    wikiFile: 'Death_Skulls' },
            { name: 'Living Death',    wikiFile: 'Living_Death' },
            { name: 'Finger of Death', wikiFile: 'Finger_of_Death' },
            { name: 'Invoke Death',    wikiFile: 'Invoke_Death_icon' },
        ],
        utility: [
            { name: 'Conjure Undead Army',      wikiFile: 'Conjure_Undead_Army' },
            { name: 'Conjure Skeleton Warrior', wikiFile: 'Conjure_Skeleton_Warrior' },
            { name: 'Command Skeleton Warrior', wikiFile: 'Command_Skeleton_Warrior' },
            { name: 'Conjure Putrid Zombie',    wikiFile: 'Conjure_Putrid_Zombie' },
            { name: 'Command Putrid Zombie',    wikiFile: 'Command_Putrid_Zombie' },
            { name: 'Conjure Vengeful Ghost',   wikiFile: 'Conjure_Vengeful_Ghost' },
            { name: 'Command Vengeful Ghost',   wikiFile: 'Command_Vengeful_Ghost' },
            { name: 'Conjure Phantom Guardian', wikiFile: 'Conjure_Phantom_Guardian' },
            { name: 'Command Phantom Guardian', wikiFile: 'Command_Phantom_Guardian' },
            { name: 'Life Transfer',            wikiFile: 'Life_Transfer_icon' },
            { name: 'Darkness',                 wikiFile: 'Darkness_icon' },
        ],
        special: [
            { name: 'Death Guard', wikiFile: 'Death_guard_(tier_90)' },
        ],
        greater: [],
    },
};

export const CATEGORY_LABELS: Record<AbilityCategory, string> = {
    basic:    'BASIC ABILITY',
    enhanced: 'ENHANCED ABILITY',
    ultimate: 'ULTIMATE ABILITY',
    utility:  'UTILITY ABILITY',
    special:  'SPECIAL ATTACK / EoF',
    greater:  'GREATER ABILITY',
};

export const STYLE_LABELS: Record<CombatStyle, string> = {
    melee:      'Melee',
    ranged:     'Ranged',
    magic:      'Magic',
    necromancy: 'Necro',
};
