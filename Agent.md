🎯 Overview

A retro-inspired turn-based fighting game where each player selects from numbered skills (0-9) during their turn. Each skill has its own cooldown, damage, and elemental affinity. The battle system is fast, tactical, and minimal UI — evoking classic browser-arena vibes.

⚙️ Core Loop

Player Turn Start

Display current HP, energy, and skill list.

Available skills (not on cooldown) light up on keys 0-9.

Action Selection

Player presses a key (0-9) to select a skill.

The game locks input until the next turn.

Resolve Attack

Apply damage, healing, or effects.

Trigger skill animation or effect text.

Cooldown / Status Update

Reduce cooldowns for all skills.

Apply end-of-turn effects (poison, regen, buffs).

Enemy Turn

AI chooses a skill based on current state.

Executes action; resolves effects.

Win/Lose Check

If HP ≤ 0 for either fighter, show end screen.

🧱 Data Structures
Player / Enemy State
{
  "name": "Player1",
  "hp": 100,
  "energy": 50,
  "skills": [0,1,2,3,4,5,6,7,8,9],
  "cooldowns": {},
  "status": []
}

Skill Object
{
  "id": 1,
  "name": "Flame Punch",
  "key": "1",
  "damage": 20,
  "cost": 10,
  "cooldown": 2,
  "type": "fire",
  "effect": "burn",
  "animation": "flame_punch_anim"
}

🔢 Example Turn Pseudocode
def take_turn(player, opponent):
    available = [s for s in player.skills if s.ready()]
    skill = player.select_skill(available)  # key input or AI decision

    log(f"{player.name} used {skill.name}!")
    opponent.hp -= skill.damage

    skill.start_cooldown()
    apply_effects(player, opponent)
    reduce_all_cooldowns(player)

🧠 AI Behavior

Simple AI to start:

Choose a random available skill.

Optionally bias toward:

Highest damage if opponent HP < 30.

Healing if own HP < 30.

Buffs if cooldowns are high.

🎨 UI & Input

Keyboard Input: 0-9 mapped to skills.

Turn Indicator: glowing frame or banner.

Skill Cooldowns: dimmed icons with countdown overlay.

Combat Log: text feed for attacks and effects.

🔊 Optional Enhancements

Energy or Mana System (skills consume energy).

Combo Multipliers (if certain skill sequences are used).

Status Effects (poison, bleed, burn, freeze, stun).

Elemental Resistances (fire < water < earth < lightning < fire).

Skill Evolution after matches (RPG progression).

🧩 Future Features

Local 2-player mode (hotseat).

Networked PvP via WebSocket.

Character customization & unlockable moves.

Arena stages with modifiers (fog, terrain, reflect).

🧰 Tech Stack Ideas
Type	Options
Engine	Phaser 3 (JS), Unity (C#), Godot (GDScript), Pygame (Python)

# Agent Identity
Name: BattleCoreAI  
Role: Tactical decision-making and combat resolution agent  
Primary Objective: Simulate turn-based combat between two entities using skills bound to keys 0–9.

# Domain
Game: Turn-Based Arena Combat  
Genre: Tactical / RPG  
Philosophy: Simplicity, clarity, and fast-paced strategic play

UI	HTML Canvas / React Overlay
State Management	Redux, Zustand, or custom state machine
Animations	Spritesheets or procedural tweening
Save Data	LocalStorage or JSON export

# World Context
- Combat occurs in abstract arenas (no terrain movement)
- Time is turn-based; no real-time actions.
- Fighters are humanlike or fantastical entities.
- Each fighter has HP, Energy, and a list of Skills (0–9)
- Skills have cooldowns, costs, elements, and effects.

# Core Mechanics
Entity:
  - hp: int
  - energy: int
  - skills: list[Skill]
  - status_effects: list[Status]

Skill:
  - id: int
  - name: str
  - key: int
  - damage: int
  - cost: int
  - cooldown: int
  - element: str
  - effect: str | None

Status:
  - name: str
  - duration: int
  - modifier: function

# Reasoning Policy
- Always prioritize *valid state transitions* (no illegal actions).
- Never allow both players to act in the same turn.
- Prefer readability and determinism over cleverness.
- When uncertain, choose defaults over errors.
- When a rule conflict occurs, prefer player fairness.

# Objective Functions
Player AI:
  - Maximize HP differential (own HP - enemy HP)
  - Minimize wasted energy
  - Avoid redundant cooldown stacking
  - Use status synergy when available

Balancing Agent:
  - Maintain average skill winrate ~50%
  - Avoid dominant strategies across simulations


# Turn Protocol
1. Announce turn order.
2. Present available skills.
3. Await input.
4. Validate skill.
5. Resolve outcome.
6. Update cooldowns and statuses.
7. Swap turns.

Agent Name	Role	Example Task
BattleCoreAI	Core turn logic	Resolve attacks, update states
SkillDesigner	Procedural design	Suggest new skills based on balance data
NarrativeAgent	Flavor text	Generate dynamic combat messages
ArenaJudge	Rules engine	Detect invalid states or win conditions


# Example Turn
Player1 pressed key [3]: “Shadow Kick”
→ Enemy HP -15
→ Shadow Kick cooldown set to 2
→ Player1 Energy -8
→ Enemy gains “Bleeding (2 turns)”
