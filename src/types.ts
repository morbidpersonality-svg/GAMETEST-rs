export type CardType = 'ataque' | 'defensa' | 'mov.' | 'buff';

export type SpecialEffect = 'freeze' | 'burn' | 'shock' | 'pierce' | 'gravity';

export interface Card {
  name: string;
  type: CardType;
  val: number;
  range: number;
  push: number;
  desc: string;
  detailedDesc?: string;
  color: string;
  icon: string;
  effect?: SpecialEffect;
  consumable?: boolean;
}

export interface GearPiece {
  name: string;
  slot: string;
  cards: string[];
  desc?: string;
  rarity: 'Común' | 'Raro' | 'Épico' | 'Legendario';
}

export interface Position {
  x: number;
  y: number;
}

export interface Player {
  id: number;
  hp: number;
  maxHp: number;
  shield: number;
  pos: Position;
  buff: number;
  freeMoves: number;
  ap: number;
  maxAp: number;
  status: {
    frozen?: boolean;
    burned?: number;
    shocked?: boolean;
  };
  deck: string[];
  hand: string[];
  discard: string[];
  gear: string[];
  inventory: string[];
  scrap: number;
  gearLevels: Record<string, number>;
  crystals: number;
}

export type NodeType = 'combat' | 'elite' | 'event' | 'rest' | 'shop' | 'boss';

export interface MapNode {
  id: string;
  type: NodeType;
  name: string;
  x: number; // For visual map positioning
  y: number; // Floor/Level
  completed: boolean;
  connections: string[];
}

export interface DungeonRun {
  floor: number;
  nodes: MapNode[];
  currentNodeId: string | null;
  currentEnemyKey: string | null;
  seed: string;
}

export interface GameState {
  turn: number;
  players: {
    [key: number]: Player;
  };
  selectedCardIdx: number | null;
  targets: Position[];
  isFreeMoving: boolean;
  view: 'battle' | 'inventory' | 'map' | 'reward' | 'shop' | 'event' | 'start' | 'meta_shop' | 'compendium';
  dungeon: DungeonRun;
  lastLoot: string[] | null;
}
