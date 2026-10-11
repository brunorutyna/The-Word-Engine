# Ordværket — The Word Engine

A bullet-heaven roguelike for learning Danish (modul 2, Studieskolen). Play it in the browser on your phone:
**https://brunorutyna.github.io/The-Word-Engine/**

Ordby runs on an ancient machine of brass, gears and starlight. It broke, and now the words are loose in the streets. You are a Skriver, new in town and not fluent yet. People speak slowly to you and show you pictures. Rebuild their sentences to save the city.

## How a run works (5–6 minutes)

- **Move** with one thumb. Weapons fire automatically (Vampire Survivors style).
- **Word gems.** Someone says something to you. Collect the golden words **in the right order** to finish your answer. A correct sentence casts a screen-clearing spell and is read aloud in Danish.
- **Balatro-style scoring.** Spell power = **chips × mult**. Chips come from the words; mult comes from your *kæde* (chain of correct words), a sentence with no mistakes, seals, and parry counters.
- **Expedition 33 timing.**
  - When a sentence completes, a ring closes around you. Tap ⚔ as it hits for **PERFEKT** (×2).
  - Elites and bosses slam the ground: walk out of the red circle, or tap ⚔ exactly on impact to **PARÉR** and earn a counter bonus.
- **Level-ups.** Answer one quick question, then pick an upgrade. Right answer: all cards shine, sometimes a golden ×2 card. Wrong: one card cracks and the correct sentence is shown.
- **Fejl-eliter.** Elites carry real mistakes from the class correction sheet ("Mit liv før Danmark"). Kill one, open its chest and choose the corrected sentence to win a seal.
- **Bosses** arrive at 5:00: Urmageren, Lavsmesteren, Den Grå Væver.

## Between runs

- **Heroes.** Each Skriver brings a starting weapon and focuses on one grammar area: datid, V2/word order, time prepositions, vocabulary, or chunks and pronouns.
- **Seals.** Joker-like modifiers. Find them in elite chests and equip them before a run.
- **Værkstedet.** Permanent upgrades bought with ink (blæk).
- **Grimoiret.** Every sentence you've met, with mastery stars. Tap 🔊 to hear it.

Support fades as you learn. Pictures and grammar hints show while an item is new and disappear as you master it. There is no Danish↔English translation anywhere: meaning comes from context, pictures and situations.

## Adding new chapters

All content lives in `js/content.js`:

1. Add a district to `DISTRICTS`.
2. Add prompts with `d: <district id>`. In the frame `f`, words in `[brackets]` become gems. `x` lists distractor gems.
3. Add level-up questions to `QUICK`. `o[0]` is always the correct option.

Beating a district's boss unlocks the next one.

## Tech

Plain HTML, CSS and JavaScript with no build step and no dependencies. Progress is saved in `localStorage`. Danish speech uses the browser's text-to-speech (`da-DK`).
