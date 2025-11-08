const skillLibrary = [
  {
    id: 0,
    name: "Pulse Jab",
    key: "0",
    damage: 12,
    cost: 4,
    cooldown: 1,
    type: "kinetic",
    effect: null,
    description: "Quick strike that keeps the tempo high."
  },
  {
    id: 1,
    name: "Flame Lash",
    key: "1",
    damage: 16,
    cost: 8,
    cooldown: 2,
    type: "fire",
    effect: { name: "burn", duration: 2, potency: 4 },
    description: "Ignites the target for damage over time."
  },
  {
    id: 2,
    name: "Ion Shield",
    key: "2",
    damage: 0,
    cost: 6,
    cooldown: 3,
    type: "electric",
    effect: { name: "guard", duration: 2, potency: 8 },
    description: "Convert energy into a temporary shield."
  },
  {
    id: 3,
    name: "Quantum Drain",
    key: "3",
    damage: 10,
    cost: 0,
    cooldown: 2,
    type: "void",
    effect: { name: "siphon", duration: 1, potency: 6 },
    description: "Steal energy and weaken the foe."
  },
  {
    id: 4,
    name: "Solar Reboot",
    key: "4",
    damage: 0,
    cost: 12,
    cooldown: 4,
    type: "light",
    effect: { name: "regen", duration: 3, potency: 5 },
    description: "Channel solar energy to slowly restore HP."
  }
];

const player = createEntity("Player", 100, 50, [0, 1, 2, 3, 4]);
const enemy = createEntity("Synth Warden", 110, 45, [0, 1, 3, 4]);

const ui = {
  skillGrid: document.getElementById("skill-grid"),
  log: document.getElementById("log"),
  resultDialog: document.getElementById("result-dialog"),
  resultTitle: document.getElementById("result-title"),
  resultBody: document.getElementById("result-body"),
  restartBtn: document.getElementById("restart-btn"),
  playerPanel: document.getElementById("player"),
  enemyPanel: document.getElementById("enemy")
};

const gameState = {
  activeEntity: player,
  waitingEntity: enemy,
  lockInput: false,
  turnCount: 1
};

let pendingEnemyTurn = null;

function createEntity(name, maxHp, maxEnergy, skillIds) {
  return {
    name,
    maxHp,
    hp: maxHp,
    maxEnergy,
    energy: maxEnergy,
    skillIds,
    cooldowns: {},
    statuses: []
  };
}

function getSkill(id) {
  return skillLibrary.find((skill) => skill.id === id);
}

function isSkillReady(entity, skill) {
  const cooldown = entity.cooldowns[skill.id] ?? 0;
  return cooldown === 0 && entity.energy >= skill.cost;
}

function logEvent(message) {
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.textContent = message;
  ui.log.prepend(entry);
}

function render() {
  renderEntity(ui.playerPanel, player);
  renderEntity(ui.enemyPanel, enemy);
  renderSkillGrid();
}

function renderEntity(panel, entity) {
  const hpValue = panel.querySelector('.bar__value[data-type="hp"]');
  const hpStat = panel.querySelector('.bar__stat[data-type="hp"]');
  const energyValue = panel.querySelector('.bar__value[data-type="energy"]');
  const energyStat = panel.querySelector('.bar__stat[data-type="energy"]');
  const statusList = panel.querySelector(".status-list");

  const hpRatio = Math.max(entity.hp, 0) / entity.maxHp;
  const energyRatio = Math.max(entity.energy, 0) / entity.maxEnergy;

  hpValue.style.transform = `scaleX(${hpRatio})`;
  energyValue.style.transform = `scaleX(${energyRatio})`;

  hpStat.textContent = `${Math.max(entity.hp, 0)} / ${entity.maxHp}`;
  energyStat.textContent = `${Math.max(entity.energy, 0)} / ${entity.maxEnergy}`;

  statusList.innerHTML = "";
  entity.statuses.forEach((status) => {
    const chip = document.createElement("li");
    chip.className = "status-chip";
    chip.textContent = `${status.name.toUpperCase()} (${status.duration})`;
    statusList.appendChild(chip);
  });
}

function renderSkillGrid() {
  ui.skillGrid.innerHTML = "";
  player.skillIds.forEach((skillId) => {
    const skill = getSkill(skillId);
    const card = document.createElement("button");
    card.className = "skill-card";
    card.dataset.key = skill.key;
    card.innerHTML = `
      <div class="skill-card__key">[${skill.key}]</div>
      <h3 class="skill-card__name">${skill.name}</h3>
      <p class="skill-card__meta">
        <span>${skill.type}</span>
        <span>${skill.damage ? skill.damage + " dmg" : "utility"}</span>
      </p>
      <p class="skill-card__meta">
        <span>${skill.cost} EN</span>
        <span>${skill.cooldown} CD</span>
      </p>
      <p class="skill-card__description">${skill.description}</p>
    `;

    const ready = isSkillReady(player, skill) && !gameState.lockInput && gameState.activeEntity === player;
    if (!ready) {
      card.classList.add("skill-card--disabled");
    }

    const cooldown = player.cooldowns[skill.id] ?? 0;
    if (cooldown > 0) {
      const overlay = document.createElement("div");
      overlay.className = "skill-card__cooldown";
      overlay.textContent = cooldown;
      card.appendChild(overlay);
    }

    card.addEventListener("click", () => handleSkillInput(skill.key));
    ui.skillGrid.appendChild(card);
  });
}

function handleSkillInput(key) {
  if (gameState.lockInput || gameState.activeEntity !== player) {
    return;
  }
  const skill = getSkillByKey(gameState.activeEntity, key);
  if (!skill) {
    logEvent(`${gameState.activeEntity.name} fumbles for a skill that isn't ready.`);
    return;
  }
  executeSkill(gameState.activeEntity, gameState.waitingEntity, skill);
  endTurn();
  if (!checkForWinner()) {
    pendingEnemyTurn = setTimeout(() => {
      pendingEnemyTurn = null;
      enemyTurn();
    }, 650);
  }
}

function getSkillByKey(entity, key) {
  const skillId = entity.skillIds.find((id) => getSkill(id).key === key);
  if (skillId === undefined) return null;
  const skill = getSkill(skillId);
  return isSkillReady(entity, skill) ? skill : null;
}

function executeSkill(attacker, defender, skill) {
  gameState.lockInput = true;
  if (skill.cost > 0) {
    attacker.energy = Math.max(0, attacker.energy - skill.cost);
  }
  if (skill.damage > 0) {
    const mitigated = Math.max(0, skill.damage - getGuardValue(defender));
    defender.hp = Math.max(0, defender.hp - mitigated);
    logEvent(`${attacker.name} uses ${skill.name}! ${defender.name} takes ${mitigated} damage.`);
  } else {
    logEvent(`${attacker.name} channels ${skill.name}.`);
  }

  if (skill.effect) {
    applyEffect(attacker, defender, skill.effect);
  }

  attacker.cooldowns[skill.id] = skill.cooldown;
  gameState.lockInput = false;
  render();
}

function getGuardValue(entity) {
  const guard = entity.statuses.find((status) => status.name === "guard");
  return guard ? guard.potency : 0;
}

function applyEffect(attacker, defender, effect) {
  switch (effect.name) {
    case "burn":
      addOrRefreshStatus(defender, { ...effect });
      logEvent(`${defender.name} is scorched by flames!`);
      break;
    case "guard":
      addOrRefreshStatus(attacker, { ...effect });
      logEvent(`${attacker.name} reinforces defenses.`);
      break;
    case "siphon":
      defender.energy = Math.max(0, defender.energy - effect.potency);
      attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + effect.potency);
      logEvent(`${attacker.name} drains ${effect.potency} energy.`);
      break;
    case "regen":
      addOrRefreshStatus(attacker, { ...effect });
      logEvent(`${attacker.name} glows with restorative light.`);
      break;
    default:
      break;
  }
}

function addOrRefreshStatus(target, effect) {
  const existing = target.statuses.find((status) => status.name === effect.name);
  if (existing) {
    existing.duration = effect.duration;
    existing.potency = effect.potency;
  } else {
    target.statuses.push({ ...effect });
  }
}

function endTurn() {
  resolveEndStep(gameState.activeEntity, gameState.waitingEntity);
  swapTurns();
  render();
}

function resolveEndStep(actor, opponent) {
  tickCooldowns(actor);
  tickStatuses(actor, opponent);
  actor.energy = Math.min(actor.maxEnergy, actor.energy + 4);
}

function tickCooldowns(entity) {
  Object.keys(entity.cooldowns).forEach((key) => {
    const value = Math.max(0, entity.cooldowns[key] - 1);
    entity.cooldowns[key] = value;
  });
}

function tickStatuses(entity, opponent) {
  entity.statuses = entity.statuses
    .map((status) => {
      applyStatusEffect(entity, opponent, status);
      return { ...status, duration: status.duration - 1 };
    })
    .filter((status) => status.duration > 0);
}

function applyStatusEffect(entity, opponent, status) {
  switch (status.name) {
    case "burn":
      entity.hp = Math.max(0, entity.hp - status.potency);
      logEvent(`${entity.name} suffers ${status.potency} burn damage.`);
      break;
    case "guard":
      status.potency = Math.max(0, status.potency - 3);
      if (status.potency === 0) {
        logEvent(`${entity.name}'s guard dissipates.`);
      }
      break;
    case "regen":
      entity.hp = Math.min(entity.maxHp, entity.hp + status.potency);
      logEvent(`${entity.name} regenerates ${status.potency} HP.`);
      break;
    default:
      break;
  }
}

function swapTurns() {
  const previousActive = gameState.activeEntity;
  gameState.activeEntity = gameState.waitingEntity;
  gameState.waitingEntity = previousActive;
  gameState.turnCount += 1;
}

function enemyTurn() {
  if (checkForWinner()) return;
  const skill = chooseEnemySkill();
  if (!skill) {
    logEvent(`${enemy.name} recalibrates, regaining focus.`);
    enemy.energy = Math.min(enemy.maxEnergy, enemy.energy + 6);
    endTurn();
    checkForWinner();
    return;
  }
  executeSkill(enemy, player, skill);
  endTurn();
  checkForWinner();
}

function chooseEnemySkill() {
  const available = enemy.skillIds
    .map(getSkill)
    .filter((skill) => isSkillReady(enemy, skill));

  if (available.length === 0) return null;

  const lowPlayerHp = player.hp <= 30;
  const lowEnemyHp = enemy.hp <= 40;

  if (lowEnemyHp) {
    const regenSkill = available.find((skill) => skill.effect?.name === "regen");
    if (regenSkill) return regenSkill;
  }

  if (lowPlayerHp) {
    return available.reduce((best, candidate) => (candidate.damage > (best?.damage ?? 0) ? candidate : best), available[0]);
  }

  return available[Math.floor(Math.random() * available.length)];
}

function checkForWinner() {
  if (player.hp <= 0 || enemy.hp <= 0) {
    const winner = player.hp > enemy.hp ? player : enemy;
    const loser = winner === player ? enemy : player;
    logEvent(`${loser.name} collapses. ${winner.name} stands victorious!`);
    showResult(`${winner.name} Wins`, `${winner.name} overpowered ${loser.name} after ${gameState.turnCount} turns.`);
    gameState.lockInput = true;
    return true;
  }
  return false;
}

function showResult(title, body) {
  ui.resultTitle.textContent = title;
  ui.resultBody.textContent = body;
  ui.resultDialog.showModal();
}

function hideResult() {
  if (ui.resultDialog.open) {
    ui.resultDialog.close();
  }
}

function restartBattle() {
  if (pendingEnemyTurn) {
    clearTimeout(pendingEnemyTurn);
    pendingEnemyTurn = null;
  }

  [player, enemy].forEach(resetEntityState);
  gameState.activeEntity = player;
  gameState.waitingEntity = enemy;
  gameState.lockInput = false;
  gameState.turnCount = 1;
  hideResult();
  ui.log.innerHTML = "";
  logEvent("A new duel begins in the BattleCore Arena!");
  render();
}

function resetEntityState(entity) {
  entity.hp = entity.maxHp;
  entity.energy = entity.maxEnergy;
  Object.keys(entity.cooldowns).forEach((key) => delete entity.cooldowns[key]);
  entity.statuses.length = 0;
}

function handleKeydown(event) {
  if (event.repeat) return;
  if (/^[0-9]$/.test(event.key)) {
    handleSkillInput(event.key);
  }
}

ui.restartBtn.addEventListener("click", restartBattle);
document.addEventListener("keydown", handleKeydown);

render();
logEvent("Welcome to the BattleCore Arena. Awaiting your command (0-4).");

