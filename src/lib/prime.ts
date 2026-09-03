export interface PrimeLevelInfo {
  level: number;
  name: string;
  minPoints: number;
  color: string;
  badge: string;
  frameClass: string;
  hasAudio: boolean;
  hasSpecialBadge: boolean;
}

export const PRIME_LEVELS: PrimeLevelInfo[] = [
  { level: 1, name: 'PRIME 1', minPoints: 100, color: 'text-gray-300', badge: '🏅 P1', frameClass: 'border-2 border-gray-300', hasAudio: true, hasSpecialBadge: false },
  { level: 2, name: 'PRIME 2', minPoints: 1000, color: 'text-blue-300', badge: '🏅 P2', frameClass: 'border-2 border-blue-400', hasAudio: true, hasSpecialBadge: false },
  { level: 3, name: 'PRIME 3', minPoints: 4000, color: 'text-purple-400', badge: '🏅 P3', frameClass: 'border-2 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]', hasAudio: true, hasSpecialBadge: false },
  { level: 4, name: 'PRIME 4', minPoints: 14000, color: 'text-pink-400', badge: '🏅 P4', frameClass: 'border-2 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]', hasAudio: true, hasSpecialBadge: false },
  { level: 5, name: 'PRIME 5', minPoints: 29000, color: 'text-emerald-400', badge: '🔥 P5', frameClass: 'border-2 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]', hasAudio: true, hasSpecialBadge: false },
  { level: 6, name: 'PRIME 6', minPoints: 36000, color: 'text-cyan-400', badge: '⚡ P6', frameClass: 'border-2 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.7)]', hasAudio: true, hasSpecialBadge: false },
  { level: 7, name: 'PRIME 7', minPoints: 100000, color: 'text-amber-400', badge: '👑 P7', frameClass: 'border-2 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.8)]', hasAudio: true, hasSpecialBadge: false },
  { level: 8, name: 'PRIME 8', minPoints: 200000, color: 'text-[#D4AF37]', badge: '🏆 PRIME 8', frameClass: 'border-4 border-[#D4AF37] shadow-[0_0_40px_rgba(212,175,55,0.9)] animate-pulse', hasAudio: true, hasSpecialBadge: true },
];

export const getPrimeLevel = (totalEarnedPoints: number): PrimeLevelInfo | null => {
  let currentPrime: PrimeLevelInfo | null = null;
  for (const p of PRIME_LEVELS) {
    if (totalEarnedPoints >= p.minPoints) {
      currentPrime = p;
    }
  }
  return currentPrime;
};

export const getNextPrime = (totalEarnedPoints: number): PrimeLevelInfo | null => {
  for (const p of PRIME_LEVELS) {
    if (totalEarnedPoints < p.minPoints) {
      return p;
    }
  }
  return null;
};
