import { Card, GearPiece } from './types';

export const GRID_SIZE = 4;

export const CARD_DATA: Record<string, Card> = {
  "slash": { name: "Corte de Sierra", type: "ataque", val: 12, range: 1, push: 0, desc: "Sierra industrial.", detailedDesc: "Un ataque cuerpo a cuerpo básico pero confiable. Utiliza una sierra dentada impulsada por vapor para infligir daño moderado a un enemigo adyacente.", color: "from-stone-600 to-stone-900", icon: "⚙️" },
  "heavy_cleave": { name: "Impacto Hidráulico", type: "ataque", val: 24, range: 1, push: 1, desc: "Presión máxima.", detailedDesc: "Libera toda la presión acumulada en un solo golpe devastador. Inflige un gran daño y empuja al objetivo una casilla hacia atrás, desequilibrándolo.", color: "from-orange-900 to-black", icon: "🔨" },
  "ignis_slash": { name: "Soplete Térmico", type: "ataque", val: 18, range: 1, push: 0, desc: "Calor residual.", detailedDesc: "Aplica una llama concentrada sobre la armadura del enemigo. Además del daño inicial, aplica el estado 'Quemado', causando daño continuo en turnos posteriores.", color: "from-orange-700 to-red-900", icon: "🔥", effect: 'burn' },
  "bash": { name: "Golpe de Plancha", type: "ataque", val: 8, range: 1, push: 1, desc: "Empuje metálico.", detailedDesc: "Utiliza tu escudo o una placa de metal pesada para golpear al enemigo. El daño es bajo, pero garantiza empujar al objetivo una casilla lejos de ti.", color: "from-blue-900 to-slate-900", icon: "🛡️" },
  "block": { name: "Refuerzo", type: "defensa", val: 10, range: 0, push: 0, desc: "+10 Escudo.", detailedDesc: "Activa placas de blindaje adicionales y redirige el vapor hacia los escudos deflectores. Te otorga 10 puntos de blindaje temporal para absorber daño entrante.", color: "from-stone-700 to-stone-800", icon: "🛡️" },
  "step": { name: "Avance", type: "mov.", val: 0, range: 1, push: 0, desc: "Moverse 1.", detailedDesc: "Un movimiento táctico básico. Te permite reposicionarte una casilla en cualquier dirección ortogonal para acercarte al enemigo o esquivar un ataque inminente.", color: "from-amber-900 to-stone-900", icon: "👣" },
  "leap": { name: "Propulsión", type: "mov.", val: 0, range: 2, push: 0, desc: "Moverse 2.", detailedDesc: "Utiliza una ráfaga de vapor a presión desde tus botas para propulsarte rápidamente. Te permite moverte hasta dos casillas de distancia en un solo turno.", color: "from-orange-900 to-amber-950", icon: "💨" },
  "sharpen": { name: "Calibración", type: "buff", val: 8, range: 0, push: 0, desc: "+8 ataque.", detailedDesc: "Ajustas las válvulas y engranajes de tus armas. Aumenta permanentemente el daño de todos tus ataques durante el resto del combate actual en 8 puntos.", color: "from-brass to-copper", icon: "🔧" },
  "shot": { name: "Remache", type: "ataque", val: 16, range: 2, push: 1, desc: "Proyectil industrial.", detailedDesc: "Dispara un remache de acero al rojo vivo a media distancia. Inflige buen daño y tiene la fuerza suficiente para empujar al objetivo una casilla hacia atrás.", color: "from-zinc-700 to-zinc-900", icon: "🔩" },
  "plasma_shot": { name: "Descarga Plasma", type: "ataque", val: 14, range: 2, push: 0, desc: "Perfora blindaje.", detailedDesc: "Dispara un haz de plasma supercalentado. Este ataque ignora completamente el blindaje del enemigo, infligiendo daño directamente a su salud (HP).", color: "from-cyan-700 to-blue-900", icon: "💠", effect: 'pierce' },
  "burst": { name: "Fuego Rápido", type: "ataque", val: 10, range: 2, push: 0, desc: "Válvula abierta.", detailedDesc: "Abre las válvulas de escape para disparar una ráfaga rápida de proyectiles menores. Ideal para rematar enemigos debilitados a media distancia.", color: "from-orange-600 to-red-800", icon: "🔥" },
  "pistol_shot": { name: "Tiro Corto", type: "ataque", val: 12, range: 2, push: 1, desc: "Impacto seco.", detailedDesc: "Un disparo rápido y contundente con tu arma de fuego secundaria. Inflige daño moderado y empuja al objetivo para mantener la distancia de seguridad.", color: "from-stone-500 to-stone-700", icon: "🔫" },
  "volt_shot": { name: "Arco Eléctrico", type: "ataque", val: 10, range: 2, push: 0, desc: "Sobrecarga AP.", detailedDesc: "Dispara un arco de electricidad estática. Además del daño, aplica el estado 'Electrizado', que puede aturdir o reducir los puntos de acción (AP) del enemigo.", color: "from-yellow-600 to-amber-700", icon: "⚡", effect: 'shock' },
  "kinetic_punch": { name: "Puño de Vapor", type: "ataque", val: 15, range: 1, push: 2, desc: "Pistón neumático.", detailedDesc: "Un golpe cuerpo a cuerpo potenciado por un pistón neumático gigante. Inflige buen daño y empuja violentamente al objetivo dos casillas hacia atrás.", color: "from-blue-800 to-indigo-950", icon: "🥊" },
  "gravity_pull": { name: "Gancho Magnético", type: "ataque", val: 10, range: 2, push: -1, desc: "Imán industrial.", detailedDesc: "Activa un potente electroimán que inflige daño por magnetismo y atrae al objetivo una casilla hacia ti. Excelente para preparar combos cuerpo a cuerpo.", color: "from-purple-900 to-black", icon: "🧲", effect: 'gravity' },
  "hammer_smash": { name: "Demolición", type: "ataque", val: 22, range: 1, push: 1, desc: "Impacto sísmico.", detailedDesc: "Un golpe aplastante con un martillo pesado. Diseñado para demoler rocas, es igualmente efectivo contra armaduras enemigas. Empuja al objetivo una casilla.", color: "from-stone-800 to-black", icon: "🔨" },
  "frost_smash": { name: "Mazo Criogénico", type: "ataque", val: 18, range: 1, push: 1, desc: "Nitrógeno líquido.", detailedDesc: "Un golpe cuerpo a cuerpo que libera nitrógeno líquido al impactar. Inflige gran daño y aplica el estado 'Congelado', inmovilizando al enemigo temporalmente.", color: "from-blue-400 to-blue-800", icon: "❄️", effect: 'freeze' },
  "medkit": { name: "Inyector Vapor", type: "defensa", val: 30, range: 0, push: 0, desc: "Repara 30 HP.", detailedDesc: "Un inyector médico de emergencia que utiliza vapor esterilizado para cerrar heridas y reparar tejidos. Restaura 30 puntos de salud (HP). Se consume al usar.", color: "from-emerald-800 to-green-950", icon: "💉", consumable: true },
  "stimulant": { name: "Sobrecarga", type: "buff", val: 15, range: 0, push: 0, desc: "+15 Daño.", detailedDesc: "Te inyectas un estimulante alquímico peligroso. Aumenta masivamente tu poder de ataque en 15 puntos para el resto del combate. Se consume al usar.", color: "from-rose-800 to-red-950", icon: "🧪", consumable: true },
  "smoke_bomb": { name: "Cortina Vapor", type: "mov.", val: 0, range: 3, push: 0, desc: "Escape rápido.", detailedDesc: "Liberas una densa nube de vapor a alta presión que ciega a los enemigos, permitiéndote reposicionarte hasta 3 casillas de distancia de forma segura. Se consume al usar.", color: "from-stone-400 to-stone-600", icon: "💨", consumable: true },
  "gravity_blast": { name: "Onda Gravitatoria", type: "ataque", val: 15, range: 2, push: 3, desc: "Empuje masivo.", detailedDesc: "Emite un pulso de gravedad invertida. Inflige daño moderado pero tiene un poder de empuje colosal, lanzando al objetivo 3 casillas hacia atrás.", color: "from-indigo-900 to-black", icon: "🌀", effect: 'gravity' },
  "overclock": { name: "Overclock", type: "buff", val: 20, range: 0, push: 0, desc: "Máximo AP.", detailedDesc: "Fuerzas los límites de tu equipo a riesgo de sobrecalentamiento. Te otorga una bonificación temporal masiva a tus capacidades ofensivas.", color: "from-red-600 to-yellow-500", icon: "⚡" },
  "acid_spray": { name: "Spray Ácido", type: "ataque", val: 12, range: 2, push: 0, desc: "Corroe armadura.", detailedDesc: "Rocía un químico altamente corrosivo. Este ataque ignora el blindaje del enemigo (efecto perforante) y daña directamente sus sistemas vitales.", color: "from-lime-600 to-green-900", icon: "🧪", effect: 'pierce' },
  "tesla_coil": { name: "Bobina Tesla", type: "ataque", val: 16, range: 3, push: 0, desc: "Rayo en cadena.", detailedDesc: "Despliega una mini-bobina que dispara un rayo eléctrico a larga distancia. Aplica el estado 'Electrizado' al objetivo, interfiriendo con sus circuitos.", color: "from-cyan-400 to-blue-800", icon: "⚡", effect: 'shock' },
  "drill_dash": { name: "Embestida Taladro", type: "ataque", val: 20, range: 2, push: 2, desc: "Ataque y movimiento.", detailedDesc: "Enciendes un taladro frontal y te abalanzas sobre el enemigo. Combina un fuerte daño cuerpo a cuerpo con un empuje de 2 casillas.", color: "from-stone-500 to-stone-800", icon: "🌪️" },
  "heal_aura": { name: "Vapor Curativo", type: "defensa", val: 20, range: 0, push: 0, desc: "Regeneración.", detailedDesc: "Liberas una nube de vapor con propiedades regenerativas a tu alrededor. Restaura 20 puntos de salud (HP) de forma segura y constante.", color: "from-emerald-500 to-teal-900", icon: "💨" },
  "sniper_shot": { name: "Tiro Preciso", type: "ataque", val: 25, range: 4, push: 0, desc: "Largo alcance.", detailedDesc: "Te tomas tu tiempo para apuntar a los puntos débiles del enemigo desde una distancia segura. Inflige un daño masivo a un rango máximo de 4 casillas.", color: "from-zinc-400 to-zinc-800", icon: "🎯" },
  "shield_bash": { name: "Carga Escudo", type: "ataque", val: 14, range: 1, push: 3, desc: "Empuje brutal.", detailedDesc: "Cargas con todo tu peso detrás de tu escudo reforzado. Inflige daño moderado pero empuja violentamente al enemigo 3 casillas hacia atrás.", color: "from-slate-600 to-slate-900", icon: "🛡️" }
};

export const GEAR_PIECES: Record<string, GearPiece> = {
  // COMÚN: Efectos menores (Empuje)
  "helmet": { name: "Casco Minero", slot: "Cabeza", cards: ["block"], rarity: 'Común' },
  "armor": { name: "Chaleco Reforzado", slot: "Cuerpo", cards: ["block", "block"], rarity: 'Común' },
  "shield": { name: "Plancha de Acero", slot: "Mano I.", cards: ["block", "sharpen"], rarity: 'Común' },
  "boots": { name: "Botas de Trabajo", slot: "Pies", cards: ["step", "leap"], rarity: 'Común' },
  "wrench": { name: "Llave Inglesa", slot: "Mano D.", cards: ["slash", "bash"], rarity: 'Común' },
  "pistol_rusty": { name: "Pistola Oxidada", slot: "Mano D.", cards: ["pistol_shot", "pistol_shot"], rarity: 'Común' },
  "pickaxe": { name: "Pico de Minero", slot: "Bimanual", cards: ["heavy_cleave", "slash"], rarity: 'Común' },
  "consumable_heal": { name: "Kit de Reparación", slot: "Consum.", cards: ["medkit"], desc: "Uso único", rarity: 'Común' },
  "consumable_smoke": { name: "Válvula de Escape", slot: "Consum.", cards: ["smoke_bomb"], desc: "Uso único", rarity: 'Común' },

  // RARA: Reducen/alteran Movimiento o AP
  "pistol_volt": { name: "Soldador de Arco", slot: "Mano D.", cards: ["volt_shot", "burst"], rarity: 'Raro' },
  "hammer_ice": { name: "Martillo Glacies", slot: "Mano D.", cards: ["frost_smash", "heavy_cleave"], rarity: 'Raro' },
  "helmet_vision": { name: "Lámpara de Carburo", slot: "Cabeza", cards: ["block"], desc: "+1 Rango", rarity: 'Raro' },
  "armor_thorns": { name: "Blindaje de Púas", slot: "Cuerpo", cards: ["block", "sharpen"], desc: "Daño al atacante", rarity: 'Raro' },
  "shield_heavy": { name: "Escudo Antidisturbios", slot: "Mano I.", cards: ["block", "shield_bash"], rarity: 'Raro' },
  "rifle_acid": { name: "Lanza-Ácido", slot: "Bimanual", cards: ["acid_spray", "acid_spray"], rarity: 'Raro' },
  "consumable_power": { name: "Célula de Energía", slot: "Consum.", cards: ["stimulant"], desc: "Uso único", rarity: 'Raro' },

  // ÉPICA: Mejoran características específicas (ej: solo cartas de 2 mov)
  "boots_jump": { name: "Botas de Vapor", slot: "Pies", cards: ["leap", "leap"], desc: "Solo Propulsión", rarity: 'Épico' },
  "greatsword_fire": { name: "Cortadora Térmica", slot: "Bimanual", cards: ["ignis_slash", "ignis_slash"], desc: "Pura quemadura", rarity: 'Épico' },
  "power_glove_grav": { name: "Exo-Brazo Atlas", slot: "Mano D.", cards: ["gravity_pull", "kinetic_punch"], rarity: 'Épico' },
  "rifle_plasma": { name: "Lanza-Remaches", slot: "Bimanual", cards: ["plasma_shot", "plasma_shot"], rarity: 'Épico' },
  "drill_arm": { name: "Brazo Taladro", type: "Mano D.", cards: ["drill_dash", "heavy_cleave"], rarity: 'Épico' },
  "armor_regen": { name: "Traje Bio-Vapor", slot: "Cuerpo", cards: ["block", "heal_aura"], rarity: 'Épico' },

  // LEGENDARIA: Efectos que normalmente no están en esa pieza
  "pistol_gravity": { name: "Pistola de Vacío", slot: "Mano D.", cards: ["gravity_blast", "pistol_shot"], desc: "Rango con Empuje Masivo", rarity: 'Legendario' },
  "helmet_overclock": { name: "Casco de Sobrecarga", slot: "Cabeza", cards: ["overclock"], desc: "Buff en Cabeza", rarity: 'Legendario' },
  "boots_phase": { name: "Botas de Fase", slot: "Pies", cards: ["leap", "smoke_bomb"], desc: "Movimiento Evasivo", rarity: 'Legendario' },
  "rifle_sniper": { name: "Rifle Gauss", slot: "Bimanual", cards: ["sniper_shot", "sniper_shot"], desc: "Rango Extremo", rarity: 'Legendario' },
  "tesla_pack": { name: "Mochila Tesla", slot: "Cuerpo", cards: ["block", "tesla_coil"], desc: "Ataque en Cuerpo", rarity: 'Legendario' }
};

export const CRATES = [
  { id: 'basic', name: 'Caja de Chatarra', cost: 50, currency: 'scrap', rarities: ['Común', 'Raro'], color: 'from-stone-500 to-stone-700' },
  { id: 'advanced', name: 'Caja Industrial', cost: 150, currency: 'scrap', rarities: ['Raro', 'Épico'], color: 'from-copper to-orange-900' },
  { id: 'elite', name: 'Caja de Reliquias', cost: 300, currency: 'scrap', rarities: ['Épico', 'Legendario'], color: 'from-brass to-yellow-600' }
];

export interface EnemyTemplate {
  id: string;
  name: string;
  hp: number;
  gear: string[];
  scrapReward: number;
  crystalReward: number;
}

export const ENEMIES: Record<string, EnemyTemplate> = {
  // COMUNES (Pisos 1-3)
  "tunnel_rat": { id: "tunnel_rat", name: "Rata de Túnel", hp: 45, gear: ["boots", "shield"], scrapReward: 5, crystalReward: 0 },
  "scavenger": { id: "scavenger", name: "Chatarrero Errante", hp: 65, gear: ["helmet", "armor", "shield"], scrapReward: 10, crystalReward: 0 },
  "sentry_drone": { id: "sentry_drone", name: "Dron de Vigilancia", hp: 50, gear: ["helmet_vision", "pistol_volt"], scrapReward: 12, crystalReward: 0 },
  "acid_crawler": { id: "acid_crawler", name: "Reptador Ácido", hp: 70, gear: ["rifle_acid", "boots"], scrapReward: 15, crystalReward: 0 },
  
  // ELITES (Pisos 4-6)
  "drill_bot": { id: "drill_bot", name: "Perforador Loco", hp: 120, gear: ["armor_thorns", "hammer_ice", "boots"], scrapReward: 25, crystalReward: 1 },
  "steam_sentinel": { id: "steam_sentinel", name: "Centinela de Vapor", hp: 150, gear: ["armor", "shield_heavy", "hammer_ice"], scrapReward: 30, crystalReward: 2 },
  "shock_trooper": { id: "shock_trooper", name: "Soldado de Choque", hp: 110, gear: ["helmet_overclock", "pistol_volt", "boots_jump"], scrapReward: 35, crystalReward: 2 },
  "tesla_guard": { id: "tesla_guard", name: "Guardia Tesla", hp: 140, gear: ["tesla_pack", "pistol_volt", "boots"], scrapReward: 40, crystalReward: 2 },
  
  // BOSSES (Piso 8)
  "overseer": { id: "overseer", name: "Supervisor de Mina", hp: 250, gear: ["helmet_overclock", "greatsword_fire", "boots_jump", "armor_thorns"], scrapReward: 80, crystalReward: 5 },
  "gear_queen": { id: "gear_queen", name: "Reina de los Engranajes", hp: 220, gear: ["helmet_overclock", "rifle_plasma", "boots_phase", "power_glove_grav"], scrapReward: 100, crystalReward: 8 },
  "mecha_titan": { id: "mecha_titan", name: "Titán Mecánico", hp: 350, gear: ["drill_arm", "armor_regen", "rifle_sniper", "shield_heavy"], scrapReward: 150, crystalReward: 15 }
};

export const DUNGEON_FLOORS = 8;

