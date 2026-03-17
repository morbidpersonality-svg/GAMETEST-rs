import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sword, Footprints, Sparkles, RotateCcw, ChevronRight, Crown, Shirt, User, Zap, Cog, Wrench, Hammer, Droplets, Flame, Zap as Electric, ShoppingCart, Box, Gem, Map as MapIcon, Skull, Swords, Coffee, ShoppingBag, HelpCircle, Play, Info, Heart } from 'lucide-react';
import { GRID_SIZE, CARD_DATA, GEAR_PIECES, CRATES, ENEMIES, DUNGEON_FLOORS } from './constants';
import { Player, Position, GameState, MapNode, NodeType } from './types';

const generateMap = (): MapNode[] => {
  const nodes: MapNode[] = [];
  const nodesPerFloor = 3;
  
  for (let f = 0; f < DUNGEON_FLOORS; f++) {
    for (let i = 0; i < nodesPerFloor; i++) {
      const id = `f${f}-n${i}`;
      let type: NodeType = 'combat';
      if (f === 0) type = 'combat';
      else if (f === DUNGEON_FLOORS - 1) type = 'boss';
      else {
        const rand = Math.random();
        if (rand < 0.4) type = 'combat';
        else if (rand < 0.55) type = 'elite';
        else if (rand < 0.7) type = 'event';
        else if (rand < 0.85) type = 'shop';
        else type = 'rest';
      }

      nodes.push({
        id,
        type,
        name: type.toUpperCase(),
        x: i,
        y: f,
        completed: false,
        connections: f < DUNGEON_FLOORS - 1 ? 
          Array.from({ length: nodesPerFloor }).map((_, ni) => `f${f+1}-n${ni}`) : 
          []
      });
    }
  }
  return nodes;
};

const META_UPGRADES = [
  { id: 'hp_up', name: 'Chasis Reforzado', desc: '+20 HP Máximo Inicial', cost: 10, icon: Heart },
  { id: 'epic_start', name: 'Suerte de Chatarrero', desc: 'Empieza con una pieza Épica aleatoria', cost: 25, icon: Sparkles },
  { id: 'ap_up', name: 'Batería Extendida', desc: '+1 AP Máximo Inicial', cost: 50, icon: Zap },
  { id: 'extra_weapon', name: 'Arsenal Extendido', desc: 'Empieza con 1 arma extra aleatoria', cost: 15, icon: Sword }
];

export default function App() {
  const [meta, setMeta] = useState<{ crystals: number, upgrades: string[] }>(() => {
    const saved = localStorage.getItem('steampunk_meta');
    return saved ? JSON.parse(saved) : { crystals: 0, upgrades: [] };
  });

  useEffect(() => {
    localStorage.setItem('steampunk_meta', JSON.stringify(meta));
  }, [meta]);

  const [state, setState] = useState<GameState>({
    turn: 1,
    players: {
      1: { id: 1, hp: 100, maxHp: 100, shield: 0, pos: { x: 0, y: 1 }, buff: 0, freeMoves: 1, ap: 3, maxAp: 3, status: {}, deck: [], hand: [], discard: [], gear: ["helmet", "armor", "shield", "boots", "wrench", "consumable_heal"], inventory: ["pistol_rusty", "pickaxe"], scrap: 50, gearLevels: {}, crystals: 0 },
      2: { id: 2, hp: 100, maxHp: 100, shield: 0, pos: { x: 3, y: 2 }, buff: 0, freeMoves: 1, ap: 3, maxAp: 3, status: {}, deck: [], hand: [], discard: [], gear: [], inventory: [], scrap: 0, gearLevels: {}, crystals: 0 }
    },
    selectedCardIdx: null,
    targets: [],
    isFreeMoving: false,
    view: 'start',
    dungeon: {
      floor: 0,
      nodes: [],
      currentNodeId: null,
      currentEnemyKey: null,
      seed: Math.random().toString()
    },
    lastLoot: null
  });

  const [wallHit, setWallHit] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);


  const setupDecks = useCallback((specificPId?: number) => {
    setState(prev => {
      const newPlayers = { ...prev.players };
      const pIds = specificPId ? [specificPId] : [1, 2];
      
      pIds.forEach(pId => {
        const p = { ...newPlayers[pId] };
        const initialDeck: string[] = [];
        p.gear.forEach(gKey => {
          if (GEAR_PIECES[gKey]) {
            initialDeck.push(...GEAR_PIECES[gKey].cards);
          }
        });
        const deck = [...initialDeck].sort(() => Math.random() - 0.5);
        const hand: string[] = [];
        while (hand.length < 5 && deck.length > 0) {
          const card = deck.pop();
          if (card) hand.push(card);
        }
        newPlayers[pId] = { ...p, deck, hand, discard: [], ap: 3, maxAp: 3, shield: 0, status: {} };
      });
      return { ...prev, players: newPlayers };
    });
  }, []);


  const drawCards = useCallback((pId: number, count: number) => {
    setState(prev => {
      const p = prev.players[pId];
      const newHand = [...p.hand];
      let newDeck = [...p.deck];
      let newDiscard = [...p.discard];

      for (let i = 0; i < count; i++) {
        if (newHand.length >= 5) break;
        if (newDeck.length === 0) {
          if (newDiscard.length === 0) break;
          newDeck = [...newDiscard].sort(() => Math.random() - 0.5);
          newDiscard = [];
        }
        const card = newDeck.pop();
        if (card) newHand.push(card);
      }

      return {
        ...prev,
        players: {
          ...prev.players,
          [pId]: { ...p, hand: newHand, deck: newDeck, discard: newDiscard }
        }
      };
    });
  }, []);

  const startTurn = useCallback((pId: number) => {
    setState(prev => {
      const newPlayers = { ...prev.players };
      const p = newPlayers[pId];
      
      // Handle Burn
      let newHp = p.hp;
      if (p.status.burned) {
        newHp = Math.max(0, p.hp - p.status.burned);
      }

      // Handle Freeze/Shock
      const freeMoves = p.status.frozen ? 0 : 1;
      const ap = p.status.shocked ? 2 : 3;

      newPlayers[pId] = { 
        ...p, 
        hp: newHp,
        freeMoves, 
        ap, 
        shield: 0,
        status: {
          ...p.status,
          frozen: false,
          shocked: false,
          burned: p.status.burned ? Math.max(0, p.status.burned - 5) : 0
        }
      };
      return { ...prev, players: newPlayers };
    });
    drawCards(pId, 5);
  }, [drawCards]);

  const endTurn = useCallback(() => {
    const pId = state.turn;
    const p = state.players[pId];
    
    let keptCard: string | null = null;
    if (state.selectedCardIdx !== null) {
      keptCard = p.hand[state.selectedCardIdx];
    }

    const nextTurn = state.turn === 1 ? 2 : 1;

    setState(prev => {
      const newPlayers = { ...prev.players };
      const currentPlayer = { ...newPlayers[pId] };
      
      const newDiscard = [...currentPlayer.discard, ...currentPlayer.hand];
      let newHand: string[] = [];

      if (keptCard) {
        const idxInDiscard = newDiscard.lastIndexOf(keptCard);
        if (idxInDiscard !== -1) newDiscard.splice(idxInDiscard, 1);
        newHand.push(keptCard);
      }

      currentPlayer.hand = newHand;
      currentPlayer.discard = newDiscard;
      newPlayers[pId] = currentPlayer;

      return {
        ...prev,
        players: newPlayers,
        turn: nextTurn,
        selectedCardIdx: null,
        targets: [],
        isFreeMoving: false
      };
    });

    startTurn(nextTurn);
  }, [state.turn, state.players, state.selectedCardIdx, startTurn]);

  // AI Turn Logic
  useEffect(() => {
    if (state.turn === 2 && state.view === 'battle' && !winner) {
      const aiTimer = setTimeout(() => {
        const ai = state.players[2];
        const player = state.players[1];
        
        // AI Logic:
        const attackIdx = ai.hand.findIndex(cid => CARD_DATA[cid].type === 'ataque');
        const defendIdx = ai.hand.findIndex(cid => CARD_DATA[cid].type === 'defensa');
        
        const enemyTemplate = state.dungeon.currentEnemyKey ? ENEMIES[state.dungeon.currentEnemyKey] : null;
        const isAggressive = enemyTemplate && (enemyTemplate.hp >= 100 || Math.random() > 0.4);

        if (isAggressive) {
          // 1. Check if can attack
          if (attackIdx !== -1 && ai.ap > 0) {
            const card = CARD_DATA[ai.hand[attackIdx]];
            const dist = Math.abs(ai.pos.x - player.pos.x) + Math.abs(ai.pos.y - player.pos.y);
            
            if (dist <= card.range) {
              onCellClick(player.pos.x, player.pos.y, 2, attackIdx);
              return;
            }
          }
          // 2. Check if can defend (if shield is low)
          if (defendIdx !== -1 && ai.ap > 0 && ai.shield < 10) {
            onCellClick(ai.pos.x, ai.pos.y, 2, defendIdx);
            return;
          }
        } else {
          // Defensive priority
          if (defendIdx !== -1 && ai.ap > 0 && ai.shield < 20) {
            onCellClick(ai.pos.x, ai.pos.y, 2, defendIdx);
            return;
          }
          if (attackIdx !== -1 && ai.ap > 0) {
            const card = CARD_DATA[ai.hand[attackIdx]];
            const dist = Math.abs(ai.pos.x - player.pos.x) + Math.abs(ai.pos.y - player.pos.y);
            
            if (dist <= card.range) {
              onCellClick(player.pos.x, player.pos.y, 2, attackIdx);
              return;
            }
          }
        }
        
        // 3. Move towards player
        if (ai.ap > 0 || ai.freeMoves > 0) {
          const dx = player.pos.x - ai.pos.x;
          const dy = player.pos.y - ai.pos.y;
          
          let targetPos = { ...ai.pos };
          if (Math.abs(dx) > Math.abs(dy)) {
            targetPos.x += Math.sign(dx);
          } else if (dy !== 0) {
            targetPos.y += Math.sign(dy);
          } else if (dx !== 0) {
            targetPos.x += Math.sign(dx);
          }
          
          if (targetPos.x !== player.pos.x || targetPos.y !== player.pos.y) {
            if (ai.freeMoves > 0) {
              onCellClick(targetPos.x, targetPos.y, 2);
            } else {
              const moveIdx = ai.hand.findIndex(cid => CARD_DATA[cid].type === 'mov.');
              if (moveIdx !== -1) {
                onCellClick(targetPos.x, targetPos.y, 2, moveIdx);
              } else {
                endTurn();
              }
            }
            return;
          }
        }
        
        endTurn();
      }, 1200);
      return () => clearTimeout(aiTimer);
    }
  }, [state.turn, state.view, winner, state.players]);

  const toggleInventory = (pId: number) => {
    setState(prev => ({
      ...prev,
      view: prev.view === 'inventory' ? 'battle' : 'inventory',
      activeInventoryPlayer: pId
    }));
  };

  const discardItem = (pId: number, itemKey: string, index: number) => {
    setState(prev => {
      const p = prev.players[pId];
      const newInventory = [...p.inventory];
      newInventory.splice(index, 1);
      return {
        ...prev,
        players: {
          ...prev.players,
          [pId]: { ...p, inventory: newInventory }
        }
      };
    });
  };

  const equipItem = (pId: number, itemKey: string) => {
    setState(prev => {
      const p = prev.players[pId];
      const item = GEAR_PIECES[itemKey];
      
      // Find if there's an item in the same slot
      const sameSlotIdx = p.gear.findIndex(k => {
        const g = GEAR_PIECES[k];
        if (item.slot === 'Bimanual') return g.slot === 'Mano D.' || g.slot === 'Mano I.' || g.slot === 'Bimanual';
        if (g.slot === 'Bimanual') return item.slot === 'Mano D.' || item.slot === 'Mano I.';
        return g.slot === item.slot;
      });

      let newGear = [...p.gear];
      let newInventory = [...p.inventory];

      // Remove item from inventory
      newInventory = newInventory.filter(k => k !== itemKey);

      if (sameSlotIdx !== -1) {
        // Swap: add old item to inventory
        const oldItem = newGear[sameSlotIdx];
        newInventory.push(oldItem);
        newGear[sameSlotIdx] = itemKey;
      } else {
        newGear.push(itemKey);
      }

      const newPlayers = {
        ...prev.players,
        [pId]: { ...p, gear: newGear, inventory: newInventory }
      };

      // Recalculate deck/hand for this player
      const updatedP = { ...newPlayers[pId] };
      const initialDeck: string[] = [];
      updatedP.gear.forEach(gKey => {
        if (GEAR_PIECES[gKey]) initialDeck.push(...GEAR_PIECES[gKey].cards);
      });
      const deck = [...initialDeck].sort(() => Math.random() - 0.5);
      const hand: string[] = [];
      while (hand.length < 5 && deck.length > 0) {
        const card = deck.pop();
        if (card) hand.push(card);
      }
      newPlayers[pId] = { ...updatedP, deck, hand, discard: [] };

      return { ...prev, players: newPlayers, selectedCardIdx: null, targets: [] };
    });
  };

  const unequipItem = (pId: number, itemKey: string) => {
    setState(prev => {
      const p = prev.players[pId];
      const newGear = p.gear.filter(k => k !== itemKey);
      const newInventory = [...p.inventory, itemKey];

      const newPlayers = {
        ...prev.players,
        [pId]: { ...p, gear: newGear, inventory: newInventory }
      };

      // Recalculate deck/hand for this player
      const updatedP = { ...newPlayers[pId] };
      const initialDeck: string[] = [];
      updatedP.gear.forEach(gKey => {
        if (GEAR_PIECES[gKey]) initialDeck.push(...GEAR_PIECES[gKey].cards);
      });
      const deck = [...initialDeck].sort(() => Math.random() - 0.5);
      const hand: string[] = [];
      while (hand.length < 5 && deck.length > 0) {
        const card = deck.pop();
        if (card) hand.push(card);
      }
      newPlayers[pId] = { ...updatedP, deck, hand, discard: [] };

      return { ...prev, players: newPlayers, selectedCardIdx: null, targets: [] };
    });
  };

  const upgradeGear = (pId: number, itemKey: string) => {
    setState(prev => {
      const p = prev.players[pId];
      const currentLevel = p.gearLevels[itemKey] || 0;
      const cost = (currentLevel + 1) * 20;

      if (p.scrap < cost) return prev;

      const newPlayers = {
        ...prev.players,
        [pId]: { 
          ...p, 
          scrap: p.scrap - cost,
          gearLevels: { ...p.gearLevels, [itemKey]: currentLevel + 1 }
        }
      };

      return { ...prev, players: newPlayers };
    });
  };

  const cycleCard = () => {
    const pId = state.turn;
    const p = state.players[pId];
    if (p.freeMoves > 0 && state.selectedCardIdx !== null) {
      setState(prev => {
        const currentPlayer = { ...prev.players[pId] };
        const cardToDiscard = currentPlayer.hand[prev.selectedCardIdx!];
        
        const newHand = currentPlayer.hand.filter((_, i) => i !== prev.selectedCardIdx);
        const newDiscard = [...currentPlayer.discard, cardToDiscard];
        
        let newDeck = [...currentPlayer.deck];
        let finalDiscard = newDiscard;

        if (newDeck.length === 0 && finalDiscard.length > 0) {
          newDeck = [...finalDiscard].sort(() => Math.random() - 0.5);
          finalDiscard = [];
        }

        if (newDeck.length > 0) {
          const newCard = newDeck.pop();
          if (newCard) newHand.push(newCard);
        }

        return {
          ...prev,
          players: {
            ...prev.players,
            [pId]: {
              ...currentPlayer,
              hand: newHand,
              deck: newDeck,
              discard: finalDiscard,
              freeMoves: 0
            }
          },
          selectedCardIdx: null,
          targets: []
        };
      });
    }
  };

  const initDungeon = () => {
    const maxHp = meta.upgrades.includes('hp_up') ? 120 : 100;
    const maxAp = meta.upgrades.includes('ap_up') ? 4 : 3;
    
    let initialGear = ["helmet", "armor", "shield", "boots", "wrench", "consumable_heal"];
    let initialInventory = ["pistol_rusty", "pickaxe"];

    if (meta.upgrades.includes('epic_start')) {
      const epicPool = Object.keys(GEAR_PIECES).filter(k => GEAR_PIECES[k].rarity === 'Épico');
      initialInventory.push(epicPool[Math.floor(Math.random() * epicPool.length)]);
    }
    if (meta.upgrades.includes('extra_weapon')) {
      const weaponPool = Object.keys(GEAR_PIECES).filter(k => GEAR_PIECES[k].slot === 'Mano D.' || GEAR_PIECES[k].slot === 'Bimanual');
      initialInventory.push(weaponPool[Math.floor(Math.random() * weaponPool.length)]);
    }

    const nodes = generateMap();
    setState(prev => ({
      ...prev,
      view: 'map',
      dungeon: {
        floor: 0,
        nodes,
        currentNodeId: null,
        currentEnemyKey: null,
        seed: Math.random().toString()
      },
      players: {
        ...prev.players,
        1: { ...prev.players[1], hp: maxHp, maxHp, ap: maxAp, maxAp, gear: initialGear, inventory: initialInventory, scrap: 50, crystals: 0, gearLevels: {} }
      }
    }));
    setupDecks(1);
  };

  const startCombat = (enemyKey: string, nodeId: string) => {
    const template = ENEMIES[enemyKey];
    if (!template) return;
    
    setState(prev => {
      const p1 = prev.players[1];
      return {
        ...prev,
        view: 'battle',
        turn: 1,
        dungeon: { ...prev.dungeon, currentNodeId: nodeId, currentEnemyKey: enemyKey },
        players: {
          1: { ...p1, pos: { x: 0, y: 2 }, ap: 3, freeMoves: 1, hand: [], discard: [], deck: [...p1.gear.flatMap(g => GEAR_PIECES[g].cards)], status: { burned: 0, frozen: false, shocked: false } },
          2: {
            id: 2,
            name: template.name,
            hp: template.hp,
            maxHp: template.hp,
            shield: 0,
            ap: 3,
            pos: { x: 3, y: 2 },
            gear: template.gear,
            gearLevels: {},
            inventory: [],
            hand: [],
            deck: template.gear.flatMap(g => GEAR_PIECES[g].cards),
            discard: [],
            freeMoves: 1,
            scrap: 0,
            crystals: 0,
            buff: 0,
            status: { burned: 0, frozen: false, shocked: false }
          }
        }
      };
    });
    setTimeout(() => setupDecks(), 0);
  };

  const calculateTargets = (idx: number, forcedPId?: number) => {
    const pId = forcedPId || state.turn;
    const p = state.players[pId];
    const enemyId = pId === 1 ? 2 : 1;
    const enemy = state.players[enemyId];
    const cardId = p.hand[idx];
    const card = CARD_DATA[cardId];
    const newTargets: Position[] = [];

    // Armor Effect: Helmet (Vision) increases range
    const hasVision = p.gear.includes('helmet_vision');
    const rangeBonus = hasVision ? 1 : 0;

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const dist = Math.abs(x - p.pos.x) + Math.abs(y - p.pos.y);
        
        if (card.type === 'defensa' || card.type === 'buff') {
          if (x === p.pos.x && y === p.pos.y) newTargets.push({ x, y });
        } else if (card.type === 'mov.') {
          if (dist > 0 && dist <= (card.range + rangeBonus) && !(x === enemy.pos.x && y === enemy.pos.y)) {
            newTargets.push({ x, y });
          }
        } else if (card.type === 'ataque') {
          if (dist > 0 && dist <= (card.range + rangeBonus) && x === enemy.pos.x && y === enemy.pos.y) {
            newTargets.push({ x, y });
          }
        }
      }
    }

    setState(prev => ({ ...prev, targets: newTargets, isFreeMoving: false, selectedCardIdx: idx }));
  };

  const applyPush = (attackerPos: Position, victimId: number, pushDist: number = 1) => {
    setState(prev => {
      const newPlayers = { ...prev.players };
      const victim = { ...newPlayers[victimId] };
      const dx = victim.pos.x - attackerPos.x;
      const dy = victim.pos.y - attackerPos.y;
      
      // Calculate direction
      const stepX = dx !== 0 ? (dx > 0 ? 1 : -1) : 0;
      const stepY = dy !== 0 ? (dy > 0 ? 1 : -1) : 0;

      let nx = victim.pos.x;
      let ny = victim.pos.y;

      // Apply push distance
      for (let i = 0; i < Math.abs(pushDist); i++) {
        const nextX = nx + (pushDist > 0 ? stepX : -stepX);
        const nextY = ny + (pushDist > 0 ? stepY : -stepY);

        if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
          const damage = 10;
          if (victim.shield >= damage) {
            victim.shield -= damage;
          } else {
            const remainingDamage = damage - victim.shield;
            victim.shield = 0;
            victim.hp -= remainingDamage;
          }
          setWallHit(true);
          setTimeout(() => setWallHit(false), 400);
          break;
        } else {
          nx = nextX;
          ny = nextY;
        }
      }

      victim.pos = { x: nx, y: ny };
      newPlayers[victimId] = victim;
      return { ...prev, players: newPlayers };
    });
  };

  const onCellClick = (x: number, y: number, forcedPId?: number, forcedCardIdx?: number) => {
    if (!forcedPId && state.turn === 2) return; // Prevent player clicks during AI turn

    const pId = forcedPId || state.turn;
    const p = state.players[pId];
    const enemyId = pId === 1 ? 2 : 1;
    const enemy = state.players[enemyId];
    const isAITurn = forcedPId === 2;

    const currentCardIdx = forcedCardIdx !== undefined ? forcedCardIdx : state.selectedCardIdx;

    // Free move activation (Player only)
    if (!isAITurn && currentCardIdx === null && !state.isFreeMoving && p.pos.x === x && p.pos.y === y && p.freeMoves > 0) {
      const freeTargets: Position[] = [];
      const hasJumpBoots = p.gear.includes('boots_jump');
      const moveRange = hasJumpBoots ? 2 : 1;

      for (let dy = -moveRange; dy <= moveRange; dy++) {
        for (let dx = -moveRange; dx <= moveRange; dx++) {
          if (Math.abs(dx) + Math.abs(dy) > 0 && Math.abs(dx) + Math.abs(dy) <= moveRange) {
            const nx = p.pos.x + dx, ny = p.pos.y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
              if (!(nx === enemy.pos.x && ny === enemy.pos.y)) {
                freeTargets.push({ x: nx, y: ny });
              }
            }
          }
        }
      }
      setState(prev => ({ ...prev, isFreeMoving: true, targets: freeTargets }));
      return;
    }

    const isValidTarget = isAITurn || state.targets.some(t => t.x === x && t.y === y);
    if (!isValidTarget && !state.isFreeMoving && currentCardIdx === null) return;
    
    if (!isValidTarget && (state.isFreeMoving || currentCardIdx !== null)) {
      setState(prev => ({ ...prev, isFreeMoving: false, selectedCardIdx: null, targets: [] }));
      return;
    }

    if (state.isFreeMoving || (isAITurn && currentCardIdx === null && p.freeMoves > 0)) {
      if (!(enemy.pos.x === x && enemy.pos.y === y)) {
        setState(prev => {
          const newPlayers = { ...prev.players };
          newPlayers[pId] = { ...newPlayers[pId], pos: { x, y }, freeMoves: 0 };
          return { ...prev, players: newPlayers, isFreeMoving: false, targets: [] };
        });
      }
    } else if (currentCardIdx !== null) {
      if (p.ap <= 0) {
        setState(prev => ({ ...prev, selectedCardIdx: null, targets: [] }));
        return;
      }

      const cardKey = p.hand[currentCardIdx];
      const card = CARD_DATA[cardKey];
      
      setState(prev => {
        const currentPlayer = { ...prev.players[pId] };
        const targetEnemy = { ...prev.players[enemyId] };

        // Find gear level bonus
        const gearKey = currentPlayer.gear.find(gk => GEAR_PIECES[gk].cards.includes(cardKey));
        const level = gearKey ? currentPlayer.gearLevels[gearKey] || 0 : 0;
        let effectiveVal = card.val + level;

        // Reduce AI damage
        if (pId === 2 && card.type === 'ataque') {
          const enemyTemplate = prev.dungeon.currentEnemyKey ? ENEMIES[prev.dungeon.currentEnemyKey] : null;
          if (enemyTemplate && enemyTemplate.hp >= 100) {
            effectiveVal = Math.floor(effectiveVal * 0.6); // 40% reduction for elites/bosses
          } else {
            effectiveVal = Math.floor(effectiveVal * 0.8); // 20% reduction for normal enemies
          }
        }

        if (card.type === 'mov.') {
          if (!(targetEnemy.pos.x === x && targetEnemy.pos.y === y)) {
            currentPlayer.pos = { x, y };
          }
        } else if (card.type === 'ataque') {
          if (targetEnemy.pos.x === x && targetEnemy.pos.y === y) {
            const damage = effectiveVal + currentPlayer.buff;
            
            if (card.effect === 'pierce') {
              targetEnemy.hp -= damage;
            } else {
              if (targetEnemy.shield >= damage) {
                targetEnemy.shield -= damage;
              } else {
                const remainingDamage = damage - targetEnemy.shield;
                targetEnemy.shield = 0;
                targetEnemy.hp -= remainingDamage;
              }
            }

            // Armor Effect: Thorns (Spikes)
            if (targetEnemy.gear.includes('armor_thorns')) {
              currentPlayer.hp = Math.max(0, currentPlayer.hp - 5);
            }

            // Apply Status Effects
            if (card.effect === 'freeze') targetEnemy.status.frozen = true;
            if (card.effect === 'burn') targetEnemy.status.burned = (targetEnemy.status.burned || 0) + 10;
            if (card.effect === 'shock') targetEnemy.status.shocked = true;

            currentPlayer.buff = 0;
            if (card.push !== 0) {
              setTimeout(() => applyPush(currentPlayer.pos, enemyId, card.push), 0);
            }
          }
        } else if (card.type === 'defensa') {
          if (card.consumable) {
            currentPlayer.hp = Math.min(currentPlayer.maxHp, currentPlayer.hp + effectiveVal);
          } else {
            currentPlayer.shield += effectiveVal;
          }
        } else if (card.type === 'buff') {
          currentPlayer.buff += effectiveVal;
        }

        const newHand = [...currentPlayer.hand];
        const discarded = newHand.splice(currentCardIdx, 1)[0];
        
        // Consumable logic: if it's consumable, don't add to discard pile
        const newDiscard = card.consumable 
          ? [...currentPlayer.discard] 
          : [...currentPlayer.discard, discarded];

        const updatedPlayer = {
          ...currentPlayer,
          hand: newHand,
          discard: newDiscard,
          ap: currentPlayer.ap - 1
        };

        return {
          ...prev,
          players: {
            ...prev.players,
            [pId]: updatedPlayer,
            [enemyId]: targetEnemy
          },
          selectedCardIdx: null,
          targets: [],
          isFreeMoving: false
        };
      });
    }
  };

  useEffect(() => {
    if (state.view === 'battle') {
      if (state.players[1].hp <= 0 && winner === null) setWinner(2);
      if (state.players[2].hp <= 0 && winner === null) setWinner(1);
    }
  }, [state.players, winner, state.view]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (winner === 1) {
      timeoutId = setTimeout(() => {
        setState(prev => {
          const enemyKey = prev.dungeon.currentEnemyKey;
          const enemyTemplate = enemyKey ? ENEMIES[enemyKey] : null;
          const scrapReward = enemyTemplate?.scrapReward || 50;
          const crystalReward = enemyTemplate?.crystalReward || 1;

          let lootKeys: string[] = [];
          if (Math.random() < 0.6) { // 60% chance to drop gear
            const commonPool = Object.keys(GEAR_PIECES).filter(k => GEAR_PIECES[k].rarity === 'Común');
            const rarePool = Object.keys(GEAR_PIECES).filter(k => GEAR_PIECES[k].rarity === 'Raro');
            const pool = Math.random() < 0.2 ? rarePool : commonPool;
            lootKeys.push(pool[Math.floor(Math.random() * pool.length)]);
          }

          const updatedNodes = prev.dungeon.nodes.map(n => 
            n.id === prev.dungeon.currentNodeId ? { ...n, completed: true } : n
          );
          return {
            ...prev,
            view: 'reward',
            lastLoot: lootKeys.length > 0 ? lootKeys : null,
            dungeon: { ...prev.dungeon, nodes: updatedNodes },
            players: {
              ...prev.players,
              1: {
                ...prev.players[1],
                scrap: prev.players[1].scrap + scrapReward,
                crystals: prev.players[1].crystals + crystalReward,
                inventory: [...prev.players[1].inventory, ...lootKeys]
              }
            }
          };
        });
        setWinner(null);
      }, 1500);
    } else if (winner === 2) {
      timeoutId = setTimeout(() => {
        setMeta(prev => ({ ...prev, crystals: prev.crystals + state.players[1].crystals }));
        setState(prev => ({ ...prev, view: 'start' }));
        setWinner(null);
      }, 1500);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [winner]);

  const buyCrate = (pId: number, crateId: string) => {
    const crate = CRATES.find(c => c.id === crateId);
    if (!crate) return;

    setState(prev => {
      const p = prev.players[pId];
      const currency = crate.currency as 'scrap' | 'crystals';
      if (p[currency] < crate.cost) return prev;

      // Distribution Logic
      const allGear = Object.entries(GEAR_PIECES);
      const commonPool = allGear.filter(([_, g]) => g.rarity === 'Común');
      const rarePlusPool = allGear.filter(([_, g]) => 
        crate.rarities.includes(g.rarity) && g.rarity !== 'Común'
      );
      const anyPool = allGear.filter(([_, g]) => crate.rarities.includes(g.rarity));

      // If rarePlusPool is empty for some reason, fallback to crate rarities
      const poolForRare = rarePlusPool.length > 0 ? rarePlusPool : anyPool;

      const lootKeys: string[] = [];
      
      if (crateId === 'basic') {
        // Chatarra: 4 pieces, 3 common, 1 rare+
        for (let i = 0; i < 3; i++) {
          const [key] = commonPool[Math.floor(Math.random() * commonPool.length)];
          lootKeys.push(key);
        }
        const [rareKey] = poolForRare[Math.floor(Math.random() * poolForRare.length)];
        lootKeys.push(rareKey);
      } else if (crateId === 'advanced') {
        // Industrial: 4 pieces, 2 common, 2 rare+
        for (let i = 0; i < 2; i++) {
          const [key] = commonPool[Math.floor(Math.random() * commonPool.length)];
          lootKeys.push(key);
        }
        for (let i = 0; i < 2; i++) {
          const [rareKey] = poolForRare[Math.floor(Math.random() * poolForRare.length)];
          lootKeys.push(rareKey);
        }
      } else if (crateId === 'elite') {
        // Reliquias: 5 pieces: 2 common, 2 rare+, 1 any
        for (let i = 0; i < 2; i++) {
          const [key] = commonPool[Math.floor(Math.random() * commonPool.length)];
          lootKeys.push(key);
        }
        for (let i = 0; i < 2; i++) {
          const [rareKey] = poolForRare[Math.floor(Math.random() * poolForRare.length)];
          lootKeys.push(rareKey);
        }
        const [anyKey] = anyPool[Math.floor(Math.random() * anyPool.length)];
        lootKeys.push(anyKey);
      }

      const newPlayers = {
        ...prev.players,
        [pId]: { 
          ...p, 
          [currency]: p[currency] - crate.cost,
          inventory: [...p.inventory, ...lootKeys]
        }
      };

      return { ...prev, players: newPlayers, lastLoot: lootKeys };
    });
  };

  const LootModal = () => {
    if (!state.lastLoot) return null;
    return (
      <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-12"
        >
          <h2 className="display-font text-5xl text-brass italic mb-2">¡Suministros Recuperados!</h2>
          <p className="heading-font text-stone-500 uppercase tracking-widest text-sm">{state.lastLoot.length} piezas añadidas al inventario</p>
        </motion.div>

        <div className="flex gap-6 mb-12">
          {state.lastLoot.map((key, i) => {
            const g = GEAR_PIECES[key];
            const rarityColor = 
              g.rarity === 'Legendario' ? 'border-yellow-500 shadow-yellow-500/20 text-yellow-500' :
              g.rarity === 'Épico' ? 'border-purple-500 shadow-purple-500/20 text-purple-500' :
              g.rarity === 'Raro' ? 'border-blue-500 shadow-blue-500/20 text-blue-500' :
              'border-stone-700 text-stone-400';

            return (
              <motion.div 
                key={i}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`w-48 p-6 bg-stone-900 border-2 rounded-2xl flex flex-col items-center gap-4 shadow-2xl ${rarityColor}`}
              >
                <div className="w-16 h-16 bg-stone-800 rounded-xl flex items-center justify-center">
                  <Box size={32} />
                </div>
                <div className="text-center">
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">{g.rarity}</p>
                  <h4 className="heading-font text-xs font-black uppercase leading-tight">{g.name}</h4>
                  <p className="text-[7px] mt-2 opacity-60 uppercase font-bold">{g.slot}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <button 
          onClick={() => setState(prev => ({ ...prev, lastLoot: null }))}
          className="heading-font px-12 py-4 bg-brass text-stone-900 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all"
        >
          Continuar
        </button>
      </div>
    );
  };

  const StartView = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#b5a642_0%,transparent_70%)]" />
      </div>
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center z-10"
      >
        <h1 className="display-font text-8xl text-brass italic mb-4 drop-shadow-2xl">STEAMPUNK MINER</h1>
        <p className="heading-font text-stone-500 uppercase tracking-[0.5em] mb-12">Dungeon Crawler Edition</p>
        
        <div className="flex flex-col gap-4 items-center">
          <button 
            onClick={initDungeon}
            className="group relative px-16 py-6 bg-brass text-stone-900 rounded-2xl font-black uppercase tracking-[0.3em] hover:scale-110 transition-all shadow-[0_0_50px_rgba(181,166,66,0.4)]"
          >
            <div className="flex items-center gap-4">
              <Play fill="currentColor" size={24} />
              Iniciar Expedición
            </div>
          </button>
          
          <div className="flex gap-4 mt-8">
            <button 
              onClick={() => setState(prev => ({ ...prev, view: 'meta_shop' }))}
              className="px-8 py-4 bg-stone-900 border border-brass/30 text-brass rounded-xl font-bold uppercase tracking-widest hover:bg-brass hover:text-stone-900 transition-all flex items-center gap-2"
            >
              <Gem size={18} /> Mejoras Permanentes
            </button>
            <button 
              onClick={() => setState(prev => ({ ...prev, view: 'compendium' }))}
              className="px-8 py-4 bg-stone-900 border border-stone-700 text-stone-400 rounded-xl font-bold uppercase tracking-widest hover:bg-stone-800 hover:text-stone-200 transition-all flex items-center gap-2"
            >
              <Box size={18} /> Compendio
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const MapView = () => {
    const currentFloorNodes = state.dungeon.nodes.filter(n => n.y === state.dungeon.floor);
    
    return (
      <div className="min-h-screen p-8 flex flex-col">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="display-font text-4xl text-brass italic">Mapa de la Mina</h2>
            <p className="heading-font text-stone-500 uppercase tracking-widest text-xs">Piso {state.dungeon.floor + 1} / {DUNGEON_FLOORS}</p>
          </div>
          <div className="flex gap-6 items-center">
            <button 
              onClick={() => setState(prev => ({ ...prev, view: 'inventory' }))}
              className={`heading-font px-6 py-3 border rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                state.players[1].inventory.length > 6 
                  ? 'bg-red-900/20 border-red-500 text-red-500 animate-pulse' 
                  : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-brass hover:border-brass'
              }`}
            >
              Inventario ({state.players[1].inventory.length}/6)
            </button>
            <div className="text-right">
              <p className="text-[10px] text-stone-500 uppercase font-bold">Chatarra</p>
              <p className="text-2xl font-black text-brass flex items-center justify-end gap-2">
                {state.players[1].scrap} <Cog size={16} />
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-stone-500 uppercase font-bold">Cristales</p>
              <p className="text-2xl font-black text-cyan-500 flex items-center justify-end gap-2">
                {state.players[1].crystals} <Gem size={16} />
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-stone-500 uppercase font-bold">Salud</p>
              <p className="text-2xl font-black text-red-500 flex items-center justify-end gap-2">
                {state.players[1].hp} <Heart size={16} />
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-around">
          {currentFloorNodes.map((node) => {
            const isAvailable = !node.completed;
            const Icon = node.type === 'combat' ? Swords : node.type === 'boss' ? Skull : node.type === 'shop' ? ShoppingBag : node.type === 'rest' ? Coffee : HelpCircle;
            
            return (
              <motion.button
                key={node.id}
                whileHover={isAvailable ? { scale: 1.05 } : {}}
                whileTap={isAvailable ? { scale: 0.95 } : {}}
                onClick={() => {
                  if (state.players[1].inventory.length > 6) {
                    alert("¡Tu inventario está lleno! Descarta objetos antes de continuar.");
                    return;
                  }
                  if (!isAvailable) return;
                  if (node.type === 'combat' || node.type === 'boss' || node.type === 'elite') {
                    let enemyKey = 'scavenger';
                    const allEnemyKeys = Object.keys(ENEMIES);
                    
                    if (node.type === 'boss') {
                      const bosses = allEnemyKeys.filter(k => k === 'overseer' || k === 'gear_queen');
                      if (bosses.length > 0) enemyKey = bosses[Math.floor(Math.random() * bosses.length)];
                    } else if (node.type === 'elite') {
                      const elites = allEnemyKeys.filter(k => k === 'drill_bot' || k === 'steam_sentinel' || k === 'shock_trooper');
                      if (elites.length > 0) enemyKey = elites[Math.floor(Math.random() * elites.length)];
                    } else {
                      const commons = allEnemyKeys.filter(k => k === 'tunnel_rat' || k === 'scavenger' || k === 'sentry_drone');
                      if (commons.length > 0) enemyKey = commons[Math.floor(Math.random() * commons.length)];
                    }
                    startCombat(enemyKey, node.id);
                  } else if (node.type === 'shop') {
                    setState(prev => ({ ...prev, view: 'shop', dungeon: { ...prev.dungeon, currentNodeId: node.id } }));
                  } else if (node.type === 'event') {
                    setState(prev => ({ ...prev, view: 'event', dungeon: { ...prev.dungeon, currentNodeId: node.id } }));
                  } else if (node.type === 'rest') {
                    setState(prev => ({ 
                      ...prev, 
                      players: { ...prev.players, 1: { ...prev.players[1], hp: Math.min(prev.players[1].maxHp, prev.players[1].hp + 30) } },
                      dungeon: { 
                        ...prev.dungeon, 
                        nodes: prev.dungeon.nodes.map(n => n.id === node.id ? { ...n, completed: true } : n) 
                      }
                    }));
                  }
                }}
                className={`w-48 h-64 rounded-3xl border-2 flex flex-col items-center justify-center gap-4 transition-all shadow-2xl relative overflow-hidden group
                  ${node.completed ? 'bg-stone-900/50 border-stone-800 opacity-50' : 'bg-stone-900 border-brass/30 hover:border-brass'}`}
              >
                <div className={`p-6 rounded-full ${node.completed ? 'bg-stone-800' : 'bg-brass/10 text-brass group-hover:scale-110 transition-transform'}`}>
                  <Icon size={48} />
                </div>
                <div className="text-center">
                  <p className="heading-font text-xs text-stone-500 uppercase tracking-widest">{node.type}</p>
                  <p className="display-font text-xl text-brass italic">{node.name}</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <button 
            onClick={() => setState(prev => ({ ...prev, view: 'inventory' }))}
            className="flex items-center gap-3 px-8 py-3 bg-stone-900 border border-brass/30 text-brass rounded-xl hover:bg-brass hover:text-stone-900 transition-all uppercase font-bold tracking-widest text-xs"
          >
            <Shirt size={16} /> Gestionar Equipo
          </button>
        </div>
      </div>
    );
  };

  const ShopView = () => (
    <div className="min-h-screen p-8 flex flex-col">
      <div className="flex items-center gap-6 mb-12">
        <button 
          onClick={() => setState(prev => ({ ...prev, view: 'map' }))}
          className="p-4 bg-stone-900 border border-brass/20 rounded-xl text-brass hover:bg-brass hover:text-stone-900 transition-all"
        >
          <ChevronRight className="rotate-180" />
        </button>
        <div>
          <h1 className="display-font text-5xl text-brass italic">Mercader de la Mina</h1>
          <p className="heading-font text-stone-500 uppercase tracking-widest text-xs">Intercambia recursos por tecnología recuperada</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {CRATES.map(crate => (
          <motion.div 
            key={crate.id}
            whileHover={{ y: -10 }}
            className={`bg-stone-900 border-2 border-brass/10 rounded-3xl p-8 flex flex-col items-center shadow-2xl relative overflow-hidden`}
          >
            <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${crate.color}`} />
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${crate.color} flex items-center justify-center text-white mb-8 shadow-2xl`}>
              <Box size={64} />
            </div>
            
            <h3 className="display-font text-3xl text-brass italic mb-2">{crate.name}</h3>
            <div className="flex gap-2 mb-6">
              {crate.rarities.map(r => (
                <span key={r} className="text-[10px] px-2 py-1 bg-stone-800 text-stone-400 rounded-md border border-stone-700 uppercase font-bold">{r}</span>
              ))}
            </div>

            <button 
              onClick={() => buyCrate(1, crate.id)}
              disabled={state.players[1][crate.currency as 'scrap' | 'crystals'] < crate.cost || state.players[1].inventory.length > 6}
              className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3
                ${state.players[1][crate.currency as 'scrap' | 'crystals'] >= crate.cost && state.players[1].inventory.length <= 6
                  ? 'bg-brass text-stone-900 hover:scale-105 shadow-xl' 
                  : 'bg-stone-800 text-stone-600 cursor-not-allowed'}`}
            >
              {state.players[1].inventory.length > 6 ? 'Inventario Lleno' : (
                <>{crate.cost} {crate.currency === 'scrap' ? <Cog size={18} /> : <Gem size={18} />}</>
              )}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const RewardView = () => {
    const isBoss = state.dungeon.nodes.find(n => n.id === state.dungeon.currentNodeId)?.type === 'boss';
    const isFinalBoss = isBoss && state.dungeon.floor === DUNGEON_FLOORS - 1;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-12"
        >
          <h2 className="display-font text-6xl text-brass italic mb-4">
            {isFinalBoss ? '¡Expedición Completada!' : '¡Victoria en la Mina!'}
          </h2>
          <p className="heading-font text-stone-500 uppercase tracking-[0.3em]">
            {isFinalBoss ? 'Has derrotado a la amenaza principal' : 'Has recuperado suministros valiosos'}
          </p>
        </motion.div>

        <div className="flex gap-8 mb-12">
          <div className="bg-stone-900 p-8 rounded-3xl border border-brass/20 text-center w-64">
            <Cog size={48} className="mx-auto text-brass mb-4" />
            <p className="text-4xl font-black text-brass">
              +{state.dungeon.currentEnemyKey ? ENEMIES[state.dungeon.currentEnemyKey].scrapReward : 50}
            </p>
            <p className="text-xs text-stone-500 uppercase font-bold">Chatarra</p>
          </div>
          <div className="bg-stone-900 p-8 rounded-3xl border border-brass/20 text-center w-64">
            <Gem size={48} className="mx-auto text-cyan-500 mb-4" />
            <p className="text-4xl font-black text-cyan-500">
              +{state.dungeon.currentEnemyKey ? ENEMIES[state.dungeon.currentEnemyKey].crystalReward : 1}
            </p>
            <p className="text-xs text-stone-500 uppercase font-bold">Cristales</p>
          </div>
          {isFinalBoss && (
            <div className="bg-stone-900 p-8 rounded-3xl border border-cyan-500/50 text-center w-64 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
              <Gem size={48} className="mx-auto text-cyan-400 mb-4" />
              <p className="text-4xl font-black text-cyan-400">+50</p>
              <p className="text-xs text-cyan-600 uppercase font-bold">Cristales Meta</p>
            </div>
          )}
        </div>

        <button 
          onClick={() => {
            if (isFinalBoss) {
              setMeta(prev => ({ ...prev, crystals: prev.crystals + 50 + state.players[1].crystals }));
              setState(prev => ({ ...prev, view: 'start' }));
              return;
            }
            setState(prev => {
              if (prev.players[1].inventory.length > 6) {
                return { ...prev, view: 'inventory' }; // Force inventory management
              }
              return {
                ...prev,
                view: 'map',
                dungeon: {
                  ...prev.dungeon,
                  floor: Math.min(DUNGEON_FLOORS - 1, prev.dungeon.floor + 1)
                }
              };
            });
          }}
          className={`px-16 py-6 rounded-2xl font-black uppercase tracking-[0.3em] hover:scale-110 transition-all shadow-xl ${
            state.players[1].inventory.length > 6 && !isFinalBoss
              ? 'bg-red-900 text-white border-2 border-red-500 animate-pulse' 
              : 'bg-brass text-stone-900'
          }`}
        >
          {isFinalBoss ? 'Regresar al Taller' : state.players[1].inventory.length > 6 ? 'Gestionar Inventario (Lleno)' : 'Continuar Expedición'}
        </button>
      </div>
    );
  };

  const EventView = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-2xl w-full bg-stone-900 border border-brass/20 p-12 rounded-3xl text-center shadow-2xl"
      >
        <HelpCircle size={64} className="mx-auto text-brass mb-8" />
        <h2 className="display-font text-4xl text-brass italic mb-4">Encuentro Inesperado</h2>
        <p className="heading-font text-stone-400 mb-12 leading-relaxed">
          Encuentras una vieja terminal de mantenimiento aún operativa. 
          Parece que puedes intentar hackearla para obtener recursos o usar una célula de energía para repararla.
        </p>
        
        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => {
              setState(prev => {
                if (prev.players[1].inventory.length > 6) {
                  return { ...prev, view: 'inventory' };
                }
                return {
                  ...prev,
                  view: 'map',
                  players: { ...prev.players, 1: { ...prev.players[1], scrap: prev.players[1].scrap + 100 } },
                  dungeon: { 
                    ...prev.dungeon, 
                    floor: Math.min(DUNGEON_FLOORS - 1, prev.dungeon.floor + 1),
                    nodes: prev.dungeon.nodes.map(n => n.id === prev.dungeon.currentNodeId ? { ...n, completed: true } : n)
                  }
                };
              });
            }}
            className={`w-full py-4 rounded-xl font-bold uppercase transition-all ${
              state.players[1].inventory.length > 6
                ? 'bg-red-900 border-red-500 text-white animate-pulse'
                : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-brass hover:text-stone-900'
            }`}
          >
            {state.players[1].inventory.length > 6 ? 'Gestionar Inventario Lleno' : 'Hackear Terminal (+100 Chatarra)'}
          </button>
          <button 
            onClick={() => {
              setState(prev => {
                if (prev.players[1].inventory.length > 6) {
                  return { ...prev, view: 'inventory' };
                }
                return {
                  ...prev,
                  view: 'map',
                  players: { ...prev.players, 1: { ...prev.players[1], hp: Math.min(prev.players[1].maxHp, prev.players[1].hp + 50) } },
                  dungeon: { 
                    ...prev.dungeon, 
                    floor: Math.min(DUNGEON_FLOORS - 1, prev.dungeon.floor + 1),
                    nodes: prev.dungeon.nodes.map(n => n.id === prev.dungeon.currentNodeId ? { ...n, completed: true } : n)
                  }
                };
              });
            }}
            className={`w-full py-4 rounded-xl font-bold uppercase transition-all ${
              state.players[1].inventory.length > 6
                ? 'bg-red-900 border-red-500 text-white animate-pulse'
                : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-brass hover:text-stone-900'
            }`}
          >
            {state.players[1].inventory.length > 6 ? 'Gestionar Inventario Lleno' : 'Reparar Sistemas (+50 HP)'}
          </button>
        </div>
      </motion.div>
    </div>
  );

  const InventoryView = () => {
    const pId = 1;
    const p = state.players[pId];

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[100] bg-[#0a0908] flex flex-col p-8 overflow-hidden"
      >
        <header className="flex justify-between items-center mb-8 border-b border-stone-800 pb-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center heading-font text-xl font-black border-4 shadow-2xl bg-copper border-brass text-stone-900`}>
              {pId}
            </div>
            <div>
              <h2 className="display-font text-3xl text-copper italic">Taller de Excavación</h2>
              <div className="flex gap-4 mt-1">
                <p className="text-stone-500 text-[10px] uppercase tracking-widest font-bold flex items-center gap-1"><Cog size={12} /> {p.scrap} Chatarra</p>
                <p className="text-brass text-[10px] uppercase tracking-widest font-bold flex items-center gap-1"><Gem size={12} /> {p.crystals} Cristales</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setState(prev => ({ ...prev, view: 'map' }))}
            disabled={p.inventory.length > 6}
            className="heading-font px-8 py-3 bg-stone-900 border border-stone-800 rounded-lg text-xs font-black uppercase tracking-widest text-stone-400 hover:text-brass hover:border-brass transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {p.inventory.length > 6 ? 'Inventario Lleno' : 'Volver al Mapa'}
          </button>
        </header>

        <div className="flex-grow grid grid-cols-12 gap-8 overflow-hidden">
          {/* Equipped Gear */}
          <div className="col-span-4 flex flex-col gap-4 overflow-y-auto pr-4 border-r border-stone-800/50">
            <h3 className="heading-font text-xs text-stone-400 uppercase tracking-widest mb-2">Equipo Instalado</h3>
            <div className="space-y-3">
              {p.gear.map((gKey, i) => {
                const g = GEAR_PIECES[gKey];
                return (
                  <div key={i} className="flex items-center gap-4 p-4 bg-stone-900/40 border border-copper/30 rounded-xl group hover:border-copper transition-all">
                    <div className="w-10 h-10 rounded-lg bg-stone-800 flex items-center justify-center text-copper">
                      {g.slot === 'Cabeza' && <Crown size={16} />}
                      {g.slot === 'Cuerpo' && <Shirt size={16} />}
                      {g.slot === 'Mano D.' && <Hammer size={16} />}
                      {g.slot === 'Mano I.' && <Shield size={16} />}
                      {g.slot === 'Bimanual' && <Hammer size={16} className="rotate-45" />}
                      {g.slot === 'Pies' && <Footprints size={16} />}
                      {g.slot === 'Consum.' && <Cog size={16} />}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <p className="text-[8px] text-stone-500 font-bold uppercase leading-none">{g.slot}</p>
                        <span className="text-[8px] px-1 bg-brass/20 text-brass rounded font-black">NIVEL {p.gearLevels[gKey] || 0}</span>
                      </div>
                      <p className="text-sm text-stone-200 font-bold">{g.name}</p>
                      {g.desc && <p className="text-[10px] text-brass font-bold uppercase mt-1">{g.desc}</p>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => upgradeGear(pId, gKey)}
                        disabled={p.scrap < ((p.gearLevels[gKey] || 0) + 1) * 20}
                        className="p-2 text-brass hover:bg-brass/10 rounded-lg transition-all disabled:opacity-20"
                        title={`Mejorar (Cuesta ${((p.gearLevels[gKey] || 0) + 1) * 20} Chatarra)`}
                      >
                        <Zap size={16} />
                      </button>
                      <button 
                        onClick={() => unequipItem(pId, gKey)}
                        className="p-2 text-rust hover:bg-rust/10 rounded-lg transition-all"
                        title="Desinstalar"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inventory */}
          <div className="col-span-8 flex flex-col gap-4 overflow-hidden">
            <div className="flex justify-between items-end mb-2">
              <h3 className="heading-font text-xs text-stone-400 uppercase tracking-widest">Almacén de Chatarra ({p.inventory.length}/6)</h3>
              {p.inventory.length > 6 && (
                <span className="text-[10px] text-red-500 font-bold uppercase animate-pulse">¡Inventario Lleno! Descarta objetos.</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-2 pb-8">
              {p.inventory.map((gKey, i) => {
                const g = GEAR_PIECES[gKey];
                return (
                  <div key={i} className="flex flex-col p-4 bg-stone-900/20 border border-stone-800 rounded-xl hover:border-stone-600 transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-stone-800 flex items-center justify-center text-stone-400 group-hover:text-copper transition-colors">
                        {g.slot === 'Cabeza' && <Crown size={20} />}
                        {g.slot === 'Cuerpo' && <Shirt size={20} />}
                        {g.slot === 'Mano D.' && <Hammer size={20} />}
                        {g.slot === 'Mano I.' && <Shield size={20} />}
                        {g.slot === 'Bimanual' && <Hammer size={20} className="rotate-45" />}
                        {g.slot === 'Pies' && <Footprints size={20} />}
                        {g.slot === 'Consum.' && <Cog size={20} />}
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          <p className="text-[8px] text-stone-500 font-bold uppercase leading-none">{g.slot}</p>
                          <span className="text-[8px] px-1 bg-brass/20 text-brass rounded font-black">NIVEL {p.gearLevels[gKey] || 0}</span>
                        </div>
                        <p className="text-base text-stone-200 font-bold">{g.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {g.cards.map((cId, ci) => {
                        const c = CARD_DATA[cId];
                        const level = p.gearLevels[gKey] || 0;
                        const upgradedVal = c.val ? c.val + level : null;
                        return (
                          <div key={ci} className={`px-2 py-1 rounded bg-gradient-to-r ${c.color} text-[8px] font-bold text-white uppercase flex items-center gap-1`}>
                            {c.name} {upgradedVal && <span className="text-[6px] opacity-80">(P: {upgradedVal})</span>}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-auto flex justify-between items-center pt-4 border-t border-stone-800/50">
                      <div className="flex gap-2 w-full">
                        <button 
                          onClick={() => upgradeGear(pId, gKey)}
                          disabled={p.scrap < ((p.gearLevels[gKey] || 0) + 1) * 20}
                          className="flex-1 heading-font px-2 py-2 bg-brass/10 border border-brass/30 rounded-lg text-[9px] font-black uppercase tracking-widest text-brass hover:bg-brass hover:text-stone-900 transition-all disabled:opacity-20"
                        >
                          Mejorar ({((p.gearLevels[gKey] || 0) + 1) * 20})
                        </button>
                        <button 
                          onClick={() => equipItem(pId, gKey)}
                          disabled={p.inventory.length > 6}
                          className="flex-1 heading-font px-2 py-2 bg-copper/10 border border-copper/30 rounded-lg text-[9px] font-black uppercase tracking-widest text-copper hover:bg-copper hover:text-stone-900 transition-all disabled:opacity-20"
                        >
                          Instalar
                        </button>
                        <button 
                          onClick={() => discardItem(pId, gKey, i)}
                          className="heading-font px-2 py-2 bg-red-900/20 border border-red-900/50 rounded-lg text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-900 hover:text-white transition-all"
                        >
                          Tirar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const activeP = state.players[state.turn];
  const enemyP = state.players[state.turn === 1 ? 2 : 1];

  const MetaShopView = () => (
    <div className="min-h-screen p-8 flex flex-col">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setState(prev => ({ ...prev, view: 'start' }))}
            className="p-4 bg-stone-900 border border-brass/20 rounded-xl text-brass hover:bg-brass hover:text-stone-900 transition-all"
          >
            <ChevronRight className="rotate-180" />
          </button>
          <div>
            <h1 className="display-font text-5xl text-brass italic">Taller Clandestino</h1>
            <p className="heading-font text-stone-500 uppercase tracking-widest text-xs">Mejoras persistentes para futuras expediciones</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-stone-500 uppercase font-bold">Cristales Meta</p>
          <p className="text-3xl font-black text-cyan-500 flex items-center justify-end gap-2">
            {meta.crystals} <Gem size={24} />
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
        {META_UPGRADES.map(upg => {
          const isUnlocked = meta.upgrades.includes(upg.id);
          const canAfford = meta.crystals >= upg.cost;
          const Icon = upg.icon;

          return (
            <motion.div 
              key={upg.id}
              whileHover={!isUnlocked && canAfford ? { scale: 1.02 } : {}}
              className={`p-6 rounded-2xl border-2 flex items-center gap-6 transition-all ${
                isUnlocked ? 'bg-brass/10 border-brass text-brass' : 
                canAfford ? 'bg-stone-900 border-cyan-500/50 hover:border-cyan-500' : 
                'bg-stone-900/50 border-stone-800 opacity-50'
              }`}
            >
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${isUnlocked ? 'bg-brass text-stone-900' : 'bg-stone-800 text-stone-400'}`}>
                <Icon size={32} />
              </div>
              <div className="flex-grow">
                <h3 className="heading-font font-black uppercase text-lg">{upg.name}</h3>
                <p className="text-xs text-stone-400 mt-1">{upg.desc}</p>
              </div>
              <div>
                {isUnlocked ? (
                  <span className="px-4 py-2 bg-brass text-stone-900 rounded font-bold uppercase text-xs">Desbloqueado</span>
                ) : (
                  <button 
                    disabled={!canAfford}
                    onClick={() => {
                      setMeta(prev => ({
                        crystals: prev.crystals - upg.cost,
                        upgrades: [...prev.upgrades, upg.id]
                      }));
                    }}
                    className={`px-6 py-3 rounded font-bold uppercase text-xs flex items-center gap-2 ${
                      canAfford ? 'bg-cyan-500 text-stone-900 hover:bg-cyan-400' : 'bg-stone-800 text-stone-500'
                    }`}
                  >
                    {upg.cost} <Gem size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const CompendiumView = () => {
    const allGear = Object.entries(GEAR_PIECES);
    
    return (
      <div className="min-h-screen p-8 flex flex-col">
        <div className="flex items-center gap-6 mb-12">
          <button 
            onClick={() => setState(prev => ({ ...prev, view: 'start' }))}
            className="p-4 bg-stone-900 border border-stone-700 rounded-xl text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition-all"
          >
            <ChevronRight className="rotate-180" />
          </button>
          <div>
            <h1 className="display-font text-5xl text-stone-200 italic">Compendio de Equipo</h1>
            <p className="heading-font text-stone-500 uppercase tracking-widest text-xs">Registro de tecnología descubierta</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 overflow-y-auto pb-12">
          {allGear.map(([key, g]) => {
            const rarityColor = 
              g.rarity === 'Legendario' ? 'border-yellow-500/30 bg-yellow-500/5 text-yellow-500' :
              g.rarity === 'Épico' ? 'border-purple-500/30 bg-purple-500/5 text-purple-500' :
              g.rarity === 'Raro' ? 'border-blue-500/30 bg-blue-500/5 text-blue-500' :
              'border-stone-700 bg-stone-900 text-stone-400';

            return (
              <div key={key} className={`p-6 rounded-2xl border ${rarityColor} flex flex-col`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">{g.rarity}</p>
                    <h3 className="heading-font font-black uppercase text-lg leading-tight text-stone-200">{g.name}</h3>
                    <p className="text-[10px] uppercase font-bold opacity-60 mt-1">{g.slot}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-black/30 flex items-center justify-center">
                    {g.slot === 'Cabeza' && <Crown size={20} />}
                    {g.slot === 'Cuerpo' && <Shirt size={20} />}
                    {g.slot === 'Mano D.' && <Hammer size={20} />}
                    {g.slot === 'Mano I.' && <Shield size={20} />}
                    {g.slot === 'Bimanual' && <Hammer size={20} className="rotate-45" />}
                    {g.slot === 'Pies' && <Footprints size={20} />}
                    {g.slot === 'Consum.' && <Cog size={20} />}
                  </div>
                </div>
                
                {g.desc && <p className="text-xs opacity-80 mb-4 italic">"{g.desc}"</p>}
                
                <div className="mt-auto flex flex-wrap gap-2">
                  {g.cards.map((cid, i) => {
                    const c = CARD_DATA[cid];
                    return (
                      <div key={i} className={`px-2 py-1 rounded bg-gradient-to-r ${c.color} text-[8px] font-bold text-white uppercase flex items-center gap-1`}>
                        {c.name} {c.val ? `(P: ${c.val})` : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const ViewContent = () => {
    if (state.view === 'start') return <StartView />;
    if (state.view === 'map') return <MapView />;
    if (state.view === 'inventory') return <InventoryView />;
    if (state.view === 'shop') return <ShopView />;
    if (state.view === 'reward') return <RewardView />;
    if (state.view === 'event') return <EventView />;
    if (state.view === 'meta_shop') return <MetaShopView />;
    if (state.view === 'compendium') return <CompendiumView />;

    const playerP = state.players[1];
    const enemyP = state.players[2];
    const isPlayerTurn = state.turn === 1;

    return (
      <div className="min-h-screen flex flex-col overflow-hidden">
        {/* Enemy Turn Overlay */}
        <AnimatePresence>
          {!isPlayerTurn && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-[60] pointer-events-none flex items-center justify-center"
            >
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-rust/90 text-white px-8 py-4 rounded-2xl heading-font text-xl font-black uppercase tracking-[0.3em] shadow-2xl border-2 border-orange-900/50"
              >
                Turno del Enemigo...
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HUD */}
        <header className="h-24 flex justify-between items-center px-8 border-b border-brass/10 bg-black/60 backdrop-blur-xl z-50 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-6 w-1/3">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-copper to-orange-900 border-2 border-brass flex items-center justify-center shadow-[0_0_20px_rgba(184,115,51,0.3)]">
                <User size={32} className="text-stone-900" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-stone-900 border border-brass flex items-center justify-center text-xs font-black text-brass">
                P1
              </div>
            </div>
            <div className="flex-grow">
              <p className="heading-font text-[10px] text-copper font-bold uppercase tracking-widest mb-1">Jugador</p>
              <div className="flex items-baseline gap-3">
                <div className="flex flex-col min-w-[60px]">
                  <span className="heading-font text-4xl font-black leading-none text-copper drop-shadow-md">{Math.max(0, state.players[1].hp)}</span>
                  {state.players[1].shield > 0 && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[10px] font-black text-brass mt-1 bg-brass/10 px-1 rounded inline-block w-max"
                    >
                      +{state.players[1].shield} BLINDAJE
                    </motion.span>
                  )}
                </div>
                <div className="flex-grow h-2 bg-stone-900 rounded-full overflow-hidden relative border border-stone-800 shadow-inner">
                  <motion.div 
                    initial={{ width: "100%" }}
                    animate={{ width: `${(state.players[1].hp / state.players[1].maxHp) * 100}%` }}
                    className="h-full bg-gradient-to-r from-orange-900 to-copper absolute left-0 top-0 z-10"
                  />
                  {state.players[1].shield > 0 && (
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (state.players[1].shield / state.players[1].maxHp) * 100)}%` }}
                      style={{ left: `${(state.players[1].hp / state.players[1].maxHp) * 100}%` }}
                      className="h-full bg-gradient-to-r from-yellow-600 to-brass absolute top-0 z-20 opacity-80"
                    />
                  )}
                </div>
                <div className="flex gap-1 mt-1 ml-2">
                  {state.players[1].status.frozen && <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_5px_#60a5fa]" title="Congelado" />}
                  {state.players[1].status.burned && <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_5px_#f97316]" title="Quemado" />}
                  {state.players[1].status.shocked && <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_5px_#facc15]" title="Electrizado" />}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center w-1/3">
            <motion.div 
              key={state.turn}
              initial={{ scale: 0.9, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className={`heading-font bg-[#1a1410] border-2 px-8 py-2 rounded-lg text-sm font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all duration-500 relative overflow-hidden
                ${state.turn === 1 ? 'border-copper text-copper shadow-copper/20' : 'border-rust text-rust shadow-rust/20'}`}
            >
              <div className="relative z-10">TURNO {state.turn === 1 ? 'P1' : 'E1'}</div>
              <motion.div 
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className={`absolute inset-0 w-1/2 h-full skew-x-[-20deg] opacity-20 blur-xl ${state.turn === 1 ? 'bg-copper' : 'bg-rust'}`}
              />
            </motion.div>
            <div className="mt-2 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full transition-all ${activeP.freeMoves > 0 ? 'bg-amber-500 shadow-[0_0_10px_#f59e0b]' : 'bg-stone-800'}`} />
                <span className="text-[10px] uppercase font-black text-stone-500 tracking-widest">Vapor</span>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: activeP.maxAp }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={false}
                    animate={{ 
                      scale: i < activeP.ap ? 1 : 0.8,
                      opacity: i < activeP.ap ? 1 : 0.3
                    }}
                    className={`w-4 h-4 rounded-sm rotate-45 flex items-center justify-center ${i < activeP.ap ? 'bg-brass shadow-[0_0_15px_rgba(181,166,66,0.6)]' : 'bg-stone-700'}`}
                  >
                    <Cog size={8} className={i < activeP.ap ? 'text-stone-900' : 'text-stone-900'} />
                  </motion.div>
                ))}
                <span className="ml-2 text-[10px] uppercase font-black text-brass tracking-widest">Engranajes</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 w-1/3 justify-end text-right">
            <div className="flex-grow">
              <p className="heading-font text-[10px] text-rust font-bold uppercase tracking-widest mb-1">{state.players[2].name || 'Enemigo'}</p>
              <div className="flex items-baseline gap-3 flex-row-reverse">
                <div className="flex flex-col items-end min-w-[60px]">
                  <span className="heading-font text-4xl font-black leading-none text-rust drop-shadow-md">{Math.max(0, state.players[2].hp)}</span>
                  {state.players[2].shield > 0 && (
                    <motion.span 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[10px] font-black text-red-400 mt-1 bg-red-900/30 px-1 rounded inline-block w-max"
                    >
                      BLINDAJE +{state.players[2].shield}
                    </motion.span>
                  )}
                </div>
                <div className="flex-grow h-2 bg-stone-900 rounded-full overflow-hidden relative border border-stone-800 shadow-inner rotate-180">
                  <motion.div 
                    initial={{ width: "100%" }}
                    animate={{ width: `${(state.players[2].hp / state.players[2].maxHp) * 100}%` }}
                    className="h-full bg-gradient-to-r from-red-900 to-rust absolute left-0 top-0 z-10"
                  />
                  {state.players[2].shield > 0 && (
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (state.players[2].shield / state.players[2].maxHp) * 100)}%` }}
                      style={{ left: `${(state.players[2].hp / state.players[2].maxHp) * 100}%` }}
                      className="h-full bg-gradient-to-r from-orange-600 to-red-500 absolute top-0 z-20 opacity-80"
                    />
                  )}
                </div>
                <div className="flex gap-1 mt-1 mr-2">
                  {state.players[2].status.frozen && <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_5px_#60a5fa]" title="Congelado" />}
                  {state.players[2].status.burned && <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_5px_#f97316]" title="Quemado" />}
                  {state.players[2].status.shocked && <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_5px_#facc15]" title="Electrizado" />}
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rust to-red-900 border-2 border-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,49,3,0.3)]">
                <Skull size={32} className="text-stone-900" />
              </div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full bg-stone-900 border border-red-500 flex items-center justify-center text-xs font-black text-red-500">
                E1
              </div>
            </div>
          </div>
        </header>

      <main className="flex flex-col flex-grow overflow-hidden">
        {/* TOP/MIDDLE: Battle Area */}
        <div className="flex flex-grow overflow-hidden relative">
          
          {/* LEFT: Player Area */}
          <aside className="w-1/4 min-w-[250px] max-w-[300px] p-6 flex flex-col justify-center items-center border-r border-white/5 relative z-10 bg-gradient-to-r from-black/40 to-transparent">
            {/* Pertinent Info */}
            <div className="w-full bg-stone-900/60 border border-stone-800/50 rounded-xl p-4 mb-6 backdrop-blur-sm shadow-xl">
              <h3 className="heading-font text-[10px] text-copper uppercase tracking-widest mb-3 border-b border-stone-800 pb-2">Estado del Minero</h3>
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Mazo</span>
                <span className="text-[10px] text-stone-300 font-mono">{playerP.deck.length} cartas</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] text-stone-400 uppercase font-bold">Descartes</span>
                <span className="text-[10px] text-stone-300 font-mono">{playerP.discard.length} cartas</span>
              </div>

              <h4 className="text-[9px] text-stone-500 uppercase font-bold mb-2">Equipo Equipado</h4>
              <div className="flex flex-wrap gap-2">
                {playerP.gear.map((gKey, i) => {
                  const g = GEAR_PIECES[gKey];
                  return (
                    <div key={i} className="w-8 h-8 bg-stone-800 rounded border border-stone-700 flex items-center justify-center text-copper relative group shadow-inner">
                      {g.slot === 'Cabeza' && <Crown size={14} />}
                      {g.slot === 'Cuerpo' && <Shirt size={14} />}
                      {g.slot === 'Mano D.' && <Hammer size={14} />}
                      {g.slot === 'Mano I.' && <Shield size={14} />}
                      {g.slot === 'Bimanual' && <Hammer size={14} className="rotate-45" />}
                      {g.slot === 'Pies' && <Footprints size={14} />}
                      {g.slot === 'Consum.' && <Cog size={14} />}
                      
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none bg-black text-white text-[8px] px-2 py-1 rounded whitespace-nowrap z-50 border border-stone-700">
                        {g.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Player Illustration Space */}
            <div className="w-full aspect-[3/4] max-h-[40vh] bg-gradient-to-t from-copper/10 to-transparent rounded-2xl border border-copper/20 flex flex-col items-center justify-end p-4 relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              >
                <User size={120} className="text-copper/40 mb-4 drop-shadow-[0_0_15px_rgba(184,115,51,0.5)]" strokeWidth={1} />
              </motion.div>
              <div className="w-full h-4 bg-black/50 rounded-full blur-sm absolute bottom-4"></div>
            </div>
          </aside>

          {/* CENTER: Board */}
          <section className="flex-grow flex flex-col items-center justify-center relative p-4">
            <div 
              className={`board-container rounded-xl p-8 transition-transform ${wallHit ? 'wall-hit' : ''}`}
              style={{ perspective: '1200px' }}
            >
              <div 
                className="grid grid-cols-4 grid-rows-4 gap-4 relative"
                style={{ transform: 'rotateX(55deg) rotateZ(-35deg)', transformStyle: 'preserve-3d' }}
              >
                {/* Glowing base plate */}
                <div className="absolute -inset-8 bg-stone-900/50 rounded-3xl border border-brass/20 shadow-[0_0_50px_rgba(181,166,66,0.1)] -z-10" style={{ transform: 'translateZ(-10px)' }} />
                
                {Array.from({ length: 16 }).map((_, i) => {
                  const x = i % GRID_SIZE;
                  const y = Math.floor(i / GRID_SIZE);
                  const isTarget = state.targets.some(t => t.x === x && t.y === y);
                  const p1Here = state.players[1].pos.x === x && state.players[1].pos.y === y;
                  const p2Here = state.players[2].pos.x === x && state.players[2].pos.y === y;

                  return (
                    <div 
                      key={i}
                      onClick={() => onCellClick(x, y)}
                      className={`w-[85px] h-[85px] xl:w-[110px] xl:h-[110px] bg-stone-900/80 border border-brass/10 rounded-xl flex items-center justify-center relative transition-all cursor-default shadow-[0_10px_20px_rgba(0,0,0,0.6)]
                        ${isTarget ? 'bg-stone-800/90 border-brass/50 translate-z-2' : 'hover:bg-stone-800/80 hover:-translate-y-1 hover:border-brass/30'}
                      `}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* Steampunk Highlight Ring */}
                      {isTarget && (
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`absolute inset-0 rounded-xl border-2 border-dashed pointer-events-none z-0
                            ${state.isFreeMoving ? 'border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.4)]' : 
                              (state.selectedCardIdx !== null && CARD_DATA[activeP.hand[state.selectedCardIdx]].type === 'ataque' ? 
                                'border-rust shadow-[0_0_25px_rgba(139,49,3,0.4)]' : 
                                'border-brass shadow-[0_0_25px_rgba(181,166,66,0.4)]')
                            }
                          `}
                        />
                      )}

                      <AnimatePresence>
                        {p1Here && (
                          <div style={{ transform: 'rotateZ(35deg) rotateX(-55deg) translateY(-20px)', transformStyle: 'preserve-3d' }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                            <motion.div 
                              layoutId="p1"
                              className={`w-14 h-14 rounded-full flex items-center justify-center heading-font text-xl font-black border-4 shadow-[0_15px_30px_rgba(0,0,0,0.8)] bg-gradient-to-br from-copper to-orange-900 border-brass text-stone-900 relative pointer-events-auto
                                ${state.turn === 1 ? 'ring-4 ring-copper/50 scale-110' : 'opacity-80 scale-90'}
                              `}
                            >
                              <span className="drop-shadow-md">1</span>
                              {state.turn === 1 && (
                                <motion.div 
                                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                                  transition={{ repeat: Infinity, duration: 2 }}
                                  className="absolute inset-0 rounded-full bg-copper -z-10"
                                />
                              )}
                              <div className="absolute -bottom-2 w-8 h-2 bg-black/50 blur-sm rounded-full" style={{ transform: 'translateY(20px)' }} />
                            </motion.div>
                          </div>
                        )}
                        {p2Here && (
                          <div style={{ transform: 'rotateZ(35deg) rotateX(-55deg) translateY(-20px)', transformStyle: 'preserve-3d' }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                            <motion.div 
                              layoutId="p2"
                              className={`w-14 h-14 rounded-full flex items-center justify-center heading-font text-xl font-black border-4 shadow-[0_15px_30px_rgba(0,0,0,0.8)] bg-gradient-to-br from-rust to-red-900 border-red-500 text-stone-900 relative pointer-events-auto
                                ${state.turn === 2 ? 'ring-4 ring-rust/50 scale-110' : 'opacity-80 scale-90'}
                              `}
                            >
                              <span className="drop-shadow-md">2</span>
                              {state.turn === 2 && (
                                <motion.div 
                                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                                  transition={{ repeat: Infinity, duration: 2 }}
                                  className="absolute inset-0 rounded-full bg-rust -z-10"
                                />
                              )}
                              <div className="absolute -bottom-2 w-8 h-2 bg-black/50 blur-sm rounded-full" style={{ transform: 'translateY(20px)' }} />
                            </motion.div>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
              <button 
                onClick={cycleCard}
                disabled={activeP.freeMoves <= 0 || state.selectedCardIdx === null}
                className="group relative heading-font px-6 py-3 bg-stone-900 border border-stone-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-stone-500 hover:text-copper hover:border-copper transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw size={14} />
                  Purgar Válvula (Gasta Vapor)
                </div>
              </button>
              <button 
                onClick={endTurn}
                className="heading-font px-10 py-3 bg-stone-900 border border-stone-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-brass hover:border-brass transition-all active:scale-95"
              >
                <div className="flex items-center gap-2">
                  Siguiente Excavación
                  <ChevronRight size={14} />
                </div>
              </button>
            </div>
          </section>

          {/* RIGHT: Enemy Area */}
          <aside className="w-1/4 min-w-[250px] max-w-[300px] p-6 flex flex-col justify-center items-center border-l border-white/5 relative z-10 bg-gradient-to-l from-black/40 to-transparent">
            {/* Enemy Illustration Space */}
            <div className="w-full aspect-[3/4] max-h-[40vh] bg-gradient-to-t from-rust/10 to-transparent rounded-2xl border border-rust/20 flex flex-col items-center justify-end p-4 relative overflow-hidden mb-6 shadow-2xl">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 1 }}
              >
                <Skull size={120} className="text-rust/40 mb-4 drop-shadow-[0_0_15px_rgba(139,49,3,0.5)]" strokeWidth={1} />
              </motion.div>
              <div className="w-full h-4 bg-black/50 rounded-full blur-sm absolute bottom-4"></div>
            </div>

            {/* Enemy Info */}
            <div className="w-full bg-stone-900/60 border border-stone-800/50 rounded-xl p-4 backdrop-blur-sm text-center shadow-xl">
              <h3 className="heading-font text-[12px] text-rust uppercase tracking-widest mb-1">
                {state.dungeon.currentEnemyKey ? ENEMIES[state.dungeon.currentEnemyKey].name : 'Enemigo'}
              </h3>
              <p className="text-[10px] text-stone-500 uppercase font-bold mb-3">Amenaza Detectada</p>
              
              <div className="flex justify-center gap-2 flex-wrap">
                {state.players[2].status.frozen && <span className="px-2 py-1 bg-blue-900/50 text-blue-400 text-[8px] rounded uppercase font-bold border border-blue-700/50">Congelado</span>}
                {state.players[2].status.burned && <span className="px-2 py-1 bg-orange-900/50 text-orange-400 text-[8px] rounded uppercase font-bold border border-orange-700/50">Quemado</span>}
                {state.players[2].status.shocked && <span className="px-2 py-1 bg-yellow-900/50 text-yellow-400 text-[8px] rounded uppercase font-bold border border-yellow-700/50">Electrizado</span>}
                {!state.players[2].status.frozen && !state.players[2].status.burned && !state.players[2].status.shocked && (
                  <span className="text-[9px] text-stone-600 font-bold uppercase">Sin estados alterados</span>
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* BOTTOM: Hand (Cards) */}
        <div className="h-56 bg-zinc-950 border-t border-white/10 p-4 flex flex-col justify-center relative z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-white/10 px-4 py-1 rounded-full text-[9px] text-stone-400 uppercase tracking-widest font-bold shadow-lg flex items-center gap-2">
            <span>Mano Actual ({playerP.hand.length}/5)</span>
            <span className={`px-2 py-0.5 rounded text-[8px] ${isPlayerTurn ? 'bg-copper/20 text-copper' : 'bg-rust/20 text-rust'}`}>
              {isPlayerTurn ? 'TU TURNO' : 'TURNO ENEMIGO'}
            </span>
          </div>
          
          <div className="flex justify-center items-end gap-4 h-full pb-2">
            {playerP.hand.map((cid, idx) => {
              const c = CARD_DATA[cid];
              const isSelected = state.selectedCardIdx === idx;
              const canPlay = isPlayerTurn && playerP.ap > 0;
              return (
                <motion.div 
                  key={`${cid}-${idx}`}
                  layout
                  onClick={() => canPlay && calculateTargets(idx)}
                  className={`group relative w-44 bg-gradient-to-b ${c.color} rounded-xl p-4 shadow-xl flex flex-col shrink-0 cursor-pointer border-2 transition-all origin-bottom
                    ${isSelected ? 'h-64 border-brass scale-110 -translate-y-4 shadow-[0_0_30px_rgba(181,166,66,0.3)] z-30' : 'h-44 border-stone-800 hover:scale-105 hover:-translate-y-2 z-10 hover:z-20'}
                    ${!canPlay && !isSelected ? 'opacity-50 grayscale-[0.5] cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-xl shadow-inner border border-white/10">
                      {c.icon}
                    </div>
                    <span className="text-[9px] px-2 py-0.5 bg-black/40 rounded-full opacity-80 uppercase font-bold text-white border border-white/10">{c.type}</span>
                  </div>
                  
                  <div className="flex-grow flex flex-col justify-center">
                    <h4 className="heading-font text-sm font-black uppercase leading-tight text-white mb-1 drop-shadow-md">{c.name}</h4>
                    <p className="text-[10px] opacity-90 leading-snug text-white drop-shadow-sm">{c.desc}</p>
                    
                    <AnimatePresence>
                      {isSelected && c.detailedDesc && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="text-[9px] text-stone-300 leading-relaxed border-t border-white/10 pt-2">
                            {c.detailedDesc}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="mt-auto pt-2 border-t border-white/20 flex justify-between text-[10px] font-black opacity-90 uppercase text-white">
                    <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded"><Footprints size={10} /> R: {c.range}</div>
                    <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded">
                      {c.type === 'ataque' ? <Hammer size={10} /> : c.type === 'defensa' ? <Shield size={10} /> : <Cog size={10} />}
                      P: {c.val || '-'}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

  return (
    <div className="min-h-screen bg-[#0a0908] text-stone-300 font-sans selection:bg-brass/30 relative overflow-hidden">
      {/* Global Background Pattern */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#b5a642 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(181,166,66,0.05)_0%,transparent_60%)]"></div>
      
      <div className="relative z-10 h-full">
        <LootModal />
        <ViewContent />
      </div>
    </div>
  );
}
