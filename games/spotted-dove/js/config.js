// 全局配置
export const CONFIG = {
  world: {
    size: 120,          // 地面尺寸
    treeCount: 18,      // 树数量
    bushCount: 14,      // 灌木数量
  },
  bird: {
    baseSpeed: 12,      // 基础飞行速度
    speedPerLevel: 0.8, // 每级速度加成
    boostMult: 1.9,     // 加速倍率
    turnSpeed: 0.0025,  // 鼠标灵敏度
    staminaMax: 100,
    staminaMaxPerLevel: 20, // Lv3/5/7… 每级耐力上限增益
    staminaDrainFly: 8,    // 平飞每秒消耗
    staminaDrainBoost: 34, // 加速时额外消耗
    staminaRegen: 30,      // 地面休息每秒恢复
    staminaRegenBranch: 70, // 树枝休息每秒恢复（更快）
  },
  berry: {
    maxCount: 22,
    radius: 0.35,      // 碰撞半径
    score: 10,
    staminaGain: 15,    // 每颗红浆果恢复的耐力
    goldScore: 50,      // 金浆果积分
    goldStaminaGain: 50, // 金浆果耐力恢复
    goldChance: 0.15,   // 刷新时有 15% 概率成为金浆果
    goldMax: 2,         // 场上金浆果数量上限
    respawnDelay: 6,    // 被拾取后重生等待（秒），资源可再生
    levelThreshold: 50, // 每级所需积分增量
    initialCount: 12,   // 开局/重置时的浆果数
  },
  leaves: { count: 40 }, // 落叶粒子数量
};
