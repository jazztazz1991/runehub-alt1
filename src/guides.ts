import { BossGuide } from './types';

export const GUIDES: Record<string, BossGuide> = {

    KBD: {
        bossName: 'King Black Dragon',
        style: 'necromancy',
        phaseMode: 'single',
        setupNote: 'Conjure Undead Army before entering. Pray Soul Split + Torment/Affliction.',
        phases: [{
            label: 'Main Fight',
            rotation: [
                { name: 'Invoke Death',    icon: 'Invoke_Death_icon',  note: 'Opens with free Finger of Death hit' },
                { name: 'Living Death',    icon: 'Living_Death',        note: 'Pop ult immediately' },
                { name: 'Touch of Death', icon: 'Touch_of_Death',      note: 'Builds residual soul stacks' },
                { name: 'Death Skulls',   icon: 'Death_Skulls',        note: 'Main damage — bounces 4× under Living Death' },
                { name: 'Finger of Death',icon: 'Finger_of_Death',     note: 'Use at 6+ necrosis stacks' },
                { name: 'Touch of Death', icon: 'Touch_of_Death' },
                { name: 'Volley of Souls',icon: 'Volley_of_Souls',     note: 'Use at 3 residual soul stacks' },
                { name: 'Death Skulls',   icon: 'Death_Skulls' },
                { name: 'Soul Sap',       icon: 'Soul_Sap',            note: 'Build necrosis stacks between Skulls' },
                { name: 'Touch of Death', icon: 'Touch_of_Death' },
                { name: 'Finger of Death',icon: 'Finger_of_Death' },
                { name: '↩ Repeat',                                     note: 'Loop from Death Skulls when Living Death resets' },
            ],
        }],
        mechanics: [
            {
                name: 'Dragonfire',
                description: 'Without a Super Antifire potion, OR both an Antifire potion + dragonfire shield, dragonfire hits 4,000–5,000+ per breath. Always protect before entering.',
                critical: true,
            },
            {
                name: 'Prayer Drain',
                description: "KBD's special attack drains half your current prayer points. Keep Super Prayer Renewals or prayer potions in your inventory.",
            },
            {
                name: 'Multi-breath Types',
                description: 'KBD uses white (cold), blue (stat drain), black, and red dragonfire. Each is blocked by antifire. The cold breath can freeze you in place briefly.',
            },
        ],
        setup: [
            { id: 'kbd-1', label: 'Super Antifire (or Antifire + Dragonfire shield)', category: 'potion' },
            { id: 'kbd-2', label: 'Overload Salve / Elder Overload',                  category: 'potion' },
            { id: 'kbd-3', label: 'Super Prayer Renewal',                              category: 'potion' },
            { id: 'kbd-4', label: 'Food (Sailfish or Rocktail)',                        category: 'gear' },
            { id: 'kbd-5', label: 'Conjure Undead Army before entering the lair',       category: 'familiar' },
            { id: 'kbd-6', label: 'Soul Split + Torment / Affliction active',           category: 'prayer' },
            { id: 'kbd-7', label: 'Necromancy power armour + Death Guard (t90)',        category: 'gear' },
        ],
        drops: [
            { name: 'Draconic Visage',         rate: '1/10,000', gpValue: 2_000_000 },
            { name: 'KBD Heads',               rate: '1/128' },
            { name: 'Dragon Pickaxe',          rate: '1/400',    gpValue: 900_000 },
            { name: 'Dragonbone Upgrade Kit',  rate: '1/1,000' },
        ],
    },

    NEX: {
        bossName: 'Nex',
        style: 'ranged',
        phaseMode: 'sequential',
        setupNote: "Use Anguish curse. Blood Reaver familiar. Hold all bleeds/DoTs during Blood phase — they heal Nex.",
        phases: [
            {
                label: 'Smoke Phase',
                note: 'Nex: "There will be NO escape!" — spread out when she raises her arms.',
                rotation: [
                    { name: "Death's Swiftness", icon: "Death's_Swiftness", note: 'Open with ult' },
                    { name: 'Corruption Shot',   icon: 'Corruption_Shot',   note: 'Apply bleed immediately' },
                    { name: 'Snap Shot',         icon: 'Snap_Shot' },
                    { name: 'Rapid Fire',        icon: 'Rapid_Fire' },
                    { name: 'Needle Strike',     icon: 'Needle_Strike' },
                    { name: 'Fragmentation Shot',icon: 'Fragmentation_Shot' },
                    { name: 'Dazing Shot',       icon: 'Dazing_Shot' },
                ],
            },
            {
                label: 'Shadow Phase',
                note: 'Nex: "Embrace darkness!" — step out of shadow pools immediately.',
                rotation: [
                    { name: 'Snap Shot',          icon: 'Snap_Shot' },
                    { name: 'Shadow Tendrils',    icon: 'Shadow_Tendrils', note: 'High damage under ult' },
                    { name: 'Rapid Fire',         icon: 'Rapid_Fire' },
                    { name: 'Needle Strike',      icon: 'Needle_Strike' },
                    { name: 'Fragmentation Shot', icon: 'Fragmentation_Shot' },
                    { name: 'Dazing Shot',        icon: 'Dazing_Shot' },
                ],
            },
            {
                label: 'Blood Phase',
                note: 'Nex: "A siphon will serve me better!" — kill Cruor (minion) before re-engaging.',
                restrictions: [
                    { label: 'Avoid DoTs / bleeds — they HEAL Nex', type: 'ability' },
                ],
                rotation: [
                    { name: 'Snap Shot',     icon: 'Snap_Shot' },
                    { name: 'Rapid Fire',    icon: 'Rapid_Fire' },
                    { name: 'Needle Strike', icon: 'Needle_Strike' },
                    { name: 'Piercing Shot', icon: 'Piercing_Shot',  note: 'No bleeds this phase' },
                    { name: 'Dazing Shot',   icon: 'Dazing_Shot',    note: 'OK — not a bleed' },
                    { name: 'Binding Shot',  icon: 'Binding_Shot' },
                ],
            },
            {
                label: 'Ice Phase',
                note: "Nex: \"Contain this!\" — she will freeze a player. Teammates click the frozen player to free them.",
                rotation: [
                    { name: "Death's Swiftness", icon: "Death's_Swiftness", note: 'Re-ult if available' },
                    { name: 'Snap Shot',          icon: 'Snap_Shot' },
                    { name: 'Binding Shot',       icon: 'Binding_Shot', note: 'Bind Nex while teammate is frozen' },
                    { name: 'Rapid Fire',         icon: 'Rapid_Fire' },
                    { name: 'Needle Strike',      icon: 'Needle_Strike' },
                    { name: 'Fragmentation Shot', icon: 'Fragmentation_Shot' },
                ],
            },
            {
                label: 'Zaros Phase',
                note: 'Nex heals to ~73k HP at start. She uses Wrath on death — prep a defensive before killing her.',
                rotation: [
                    { name: 'Snap Shot',          icon: 'Snap_Shot' },
                    { name: 'Rapid Fire',         icon: 'Rapid_Fire' },
                    { name: 'Needle Strike',      icon: 'Needle_Strike' },
                    { name: 'Fragmentation Shot', icon: 'Fragmentation_Shot' },
                    { name: 'Shadow Tendrils',    icon: 'Shadow_Tendrils' },
                    { name: 'Dazing Shot',        icon: 'Dazing_Shot' },
                    { name: 'Barricade on kill',                        note: 'Use Barricade or Resonance before final hit to survive Wrath' },
                ],
            },
        ],
        mechanics: [
            {
                name: 'Blood Phase DoTs',
                phase: 'Blood Phase',
                description: 'All bleed and poison effects (Corruption Shot, Fragmentation Shot, Shadow Tendrils, etc.) HEAL Nex during Blood Phase. Stop every DoT the moment P3 begins. Only use instant-damage abilities.',
                critical: true,
            },
            {
                name: 'Ice Prison',
                phase: 'Ice Phase',
                description: 'Nex freezes one player solid. Teammates must stand next to the trapped player and click them to break them free. The frozen player cannot escape alone without taking 1,000 typeless damage.',
                critical: true,
            },
            {
                name: 'Wrath (on death)',
                phase: 'Zaros Phase',
                description: "When Nex dies she triggers Wrath — a 4,000 typeless AoE hit to all players in range. Use Barricade, Resonance, or Deflect Curses + a defensive ability just before delivering the killing blow.",
                critical: true,
            },
            {
                name: 'No Escape (Smoke)',
                phase: 'Smoke Phase',
                description: "Nex disables all prayers and spreads viral damage between nearby players. Spread out to separate tiles when she says \"There will be NO escape!\"",
            },
            {
                name: 'Minion spawns',
                description: 'At each phase transition (160k / 120k / 80k / 40k HP) a bodyguard minion spawns. Nex is immune until the minion is killed. Switch targets immediately.',
                critical: true,
            },
        ],
        setup: [
            { id: 'nex-1', label: 'Elder Overload Salve',                           category: 'potion' },
            { id: 'nex-2', label: 'Super Prayer Renewal',                            category: 'potion' },
            { id: 'nex-3', label: 'Blood Reaver familiar',                           category: 'familiar' },
            { id: 'nex-4', label: 'Anguish / Desolation curse active',               category: 'prayer' },
            { id: 'nex-5', label: 'Ranged power armour (Sirenic / Crystalline)',      category: 'gear' },
            { id: 'nex-6', label: 'Eldritch Crossbow + Ascension Crossbow off-hand', category: 'gear' },
            { id: 'nex-7', label: 'Sailfish x6 + Saradomin Brew',                    category: 'gear' },
        ],
        drops: [
            { name: 'Torva Helm',       rate: '~1/57'  },
            { name: 'Torva Platebody',  rate: '~1/57'  },
            { name: 'Torva Platelegs',  rate: '~1/57'  },
            { name: 'Pernix Cowl',      rate: '~1/57'  },
            { name: 'Virtus Mask',      rate: '~1/57'  },
            { name: 'Zaryte Bow',       rate: '~1/512' },
        ],
    },

    ZAMORAK: {
        bossName: 'Zamorak, Lord of Chaos',
        style: 'magic',
        phaseMode: 'choice',
        setupNote: 'Charge rune pads to drain Zamorak\'s shield. Zammy has a regenerating shield bar — keep pad contact up.',
        phases: [
            {
                label: 'Pad 1',
                segments: [
                    {
                        label: 'Bar 1', rotation: [
                            { name: 'Sunshine',       icon: 'Sunshine',       note: 'Open with ult on pad' },
                            { name: 'Wild Magic',     icon: 'Wild_Magic' },
                            { name: 'Asphyxiate',     icon: 'Asphyxiate' },
                            { name: 'Dragon Breath',  icon: 'Dragon_Breath' },
                            { name: 'Concentrated Blast', icon: 'Concentrated_Blast' },
                            { name: 'Wrack and Ruin', icon: 'Wrack_and_Ruin', note: 'Good finisher' },
                        ],
                    },
                    {
                        label: 'Bar 2', rotation: [
                            { name: 'Wild Magic',     icon: 'Wild_Magic' },
                            { name: 'Asphyxiate',     icon: 'Asphyxiate' },
                            { name: 'Dragon Breath',  icon: 'Dragon_Breath' },
                            { name: 'Concentrated Blast', icon: 'Concentrated_Blast' },
                            { name: 'Sonic Wave',     icon: 'Sonic_Wave' },
                            { name: 'Wrack',          icon: 'Wrack' },
                        ],
                    },
                    {
                        label: 'Bar 3', rotation: [
                            { name: 'Sunshine',       icon: 'Sunshine',       note: 'Re-ult if available' },
                            { name: 'Wild Magic',     icon: 'Wild_Magic' },
                            { name: 'Asphyxiate',     icon: 'Asphyxiate' },
                            { name: 'Omnipower',      icon: 'Omnipower',      note: 'Dump adren at bar end' },
                            { name: 'Dragon Breath',  icon: 'Dragon_Breath' },
                            { name: 'Wrack and Ruin', icon: 'Wrack_and_Ruin' },
                        ],
                    },
                ],
                rotation: [],
            },
            { label: 'Pad 2', segments: [
                { label: 'Bar 1', rotation: [{ name: 'Sunshine', icon: 'Sunshine' }, { name: 'Wild Magic', icon: 'Wild_Magic' }, { name: 'Asphyxiate', icon: 'Asphyxiate' }, { name: 'Dragon Breath', icon: 'Dragon_Breath' }, { name: 'Wrack and Ruin', icon: 'Wrack_and_Ruin' }] },
                { label: 'Bar 2', rotation: [{ name: 'Wild Magic', icon: 'Wild_Magic' }, { name: 'Asphyxiate', icon: 'Asphyxiate' }, { name: 'Concentrated Blast', icon: 'Concentrated_Blast' }, { name: 'Sonic Wave', icon: 'Sonic_Wave' }] },
                { label: 'Bar 3', rotation: [{ name: 'Sunshine', icon: 'Sunshine', note: 'Re-ult if available' }, { name: 'Wild Magic', icon: 'Wild_Magic' }, { name: 'Omnipower', icon: 'Omnipower' }, { name: 'Asphyxiate', icon: 'Asphyxiate' }] },
            ], rotation: [] },
            { label: 'Pad 3', segments: [
                { label: 'Bar 1', rotation: [{ name: 'Sunshine', icon: 'Sunshine' }, { name: 'Wild Magic', icon: 'Wild_Magic' }, { name: 'Asphyxiate', icon: 'Asphyxiate' }, { name: 'Dragon Breath', icon: 'Dragon_Breath' }] },
                { label: 'Bar 2', rotation: [{ name: 'Wild Magic', icon: 'Wild_Magic' }, { name: 'Asphyxiate', icon: 'Asphyxiate' }, { name: 'Concentrated Blast', icon: 'Concentrated_Blast' }] },
                { label: 'Bar 3', rotation: [{ name: 'Sunshine', icon: 'Sunshine', note: 'Re-ult' }, { name: 'Wild Magic', icon: 'Wild_Magic' }, { name: 'Omnipower', icon: 'Omnipower' }] },
            ], rotation: [] },
            { label: 'Pad 4', segments: [
                { label: 'Bar 1', rotation: [{ name: 'Sunshine', icon: 'Sunshine' }, { name: 'Wild Magic', icon: 'Wild_Magic' }, { name: 'Asphyxiate', icon: 'Asphyxiate' }] },
                { label: 'Bar 2', rotation: [{ name: 'Wild Magic', icon: 'Wild_Magic' }, { name: 'Dragon Breath', icon: 'Dragon_Breath' }, { name: 'Concentrated Blast', icon: 'Concentrated_Blast' }] },
                { label: 'Bar 3', rotation: [{ name: 'Sunshine', icon: 'Sunshine', note: 'Re-ult' }, { name: 'Wild Magic', icon: 'Wild_Magic' }, { name: 'Omnipower', icon: 'Omnipower' }] },
            ], rotation: [] },
            { label: 'Pad 5', segments: [
                { label: 'Bar 1', rotation: [{ name: 'Sunshine', icon: 'Sunshine' }, { name: 'Wild Magic', icon: 'Wild_Magic' }, { name: 'Asphyxiate', icon: 'Asphyxiate' }] },
                { label: 'Bar 2', rotation: [{ name: 'Wild Magic', icon: 'Wild_Magic' }, { name: 'Concentrated Blast', icon: 'Concentrated_Blast' }, { name: 'Sonic Wave', icon: 'Sonic_Wave' }] },
                { label: 'Bar 3', rotation: [{ name: 'Sunshine', icon: 'Sunshine', note: 'Re-ult' }, { name: 'Wild Magic', icon: 'Wild_Magic' }, { name: 'Omnipower', icon: 'Omnipower' }] },
            ], rotation: [] },
            { label: 'Pad 6', segments: [
                { label: 'Bar 1', rotation: [{ name: 'Sunshine', icon: 'Sunshine' }, { name: 'Wild Magic', icon: 'Wild_Magic' }, { name: 'Asphyxiate', icon: 'Asphyxiate' }] },
                { label: 'Bar 2', rotation: [{ name: 'Wild Magic', icon: 'Wild_Magic' }, { name: 'Dragon Breath', icon: 'Dragon_Breath' }, { name: 'Wrack and Ruin', icon: 'Wrack_and_Ruin' }] },
                { label: 'Bar 3', rotation: [{ name: 'Sunshine', icon: 'Sunshine', note: 'Re-ult for cleave' }, { name: 'Wild Magic', icon: 'Wild_Magic' }, { name: 'Omnipower', icon: 'Omnipower' }] },
            ], rotation: [] },
        ],
        mechanics: [
            {
                name: 'Regenerating Shield Bar',
                description: "Zamorak has a shield bar separate from his HP. It constantly regenerates. Standing on a rune pad drains it. DPS only counts when the shield is down — stay on pads.",
                critical: true,
            },
            {
                name: 'Pad Charge Mechanic',
                description: 'Each pad has 3 HP bars that must be cleared sequentially. Once a pad is fully cleared it stays cleared. Clear all 6 pads to trigger the final phase.',
            },
            {
                name: 'Channeler (per phase)',
                description: 'At each phase transition a channeler spawns in Infernus. It must be killed or it prevents phase progression. Assign a player to handle the channeler.',
                critical: true,
            },
            {
                name: 'Infernus Summon',
                description: 'Players can be pulled into Infernus. Fight continues in there — kill the manifestation quickly and return.',
            },
            {
                name: 'Phase 7 (100%+ enrage only)',
                description: 'Above 100% enrage Zamorak drags the team to Infernus for a final phase. Mechanics from 4 of the 6 runes appear in reverse order.',
            },
        ],
        setup: [
            { id: 'zam-1', label: 'Elder Overload Salve',                         category: 'potion' },
            { id: 'zam-2', label: 'Super Prayer Renewal',                          category: 'potion' },
            { id: 'zam-3', label: 'Blood Reaver familiar',                         category: 'familiar' },
            { id: 'zam-4', label: 'Affliction / Torment curse active',             category: 'prayer' },
            { id: 'zam-5', label: 'Magic power armour (Cryptbloom / Seasinger)',   category: 'gear' },
            { id: 'zam-6', label: 'Staff of Sliske / Noxious Staff',               category: 'gear' },
            { id: 'zam-7', label: 'Vulnerability bombs',                           category: 'other' },
        ],
        drops: [
            { name: "Zamorak's Essence",         rate: '~1/50'  },
            { name: 'Fractured Staff of Armadyl',rate: '~1/300', gpValue: 800_000_000 },
            { name: 'Virtus Wand',               rate: '~1/120' },
            { name: 'Virtus Book',               rate: '~1/120' },
        ],
    },

};

export const BOSS_NAME_MAP: [string, string][] = [
    ['king black dragon', 'KBD'],
    ['lord of chaos',     'ZAMORAK'],
    ['nex',               'NEX'],
];
