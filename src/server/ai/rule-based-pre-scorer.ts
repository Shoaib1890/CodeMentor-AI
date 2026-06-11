import { DSA_TOPICS } from '@/lib/constants';

// Target problems to solve per topic depending on the preparation goal
const GOAL_TARGETS: Record<string, Record<string, number>> = {
  internship: {
    // High importance
    arrays: 12, strings: 10, 'linked-lists': 8, stacks: 6, queues: 6, sorting: 6, 'two-pointers': 6, recursion: 6,
    // Medium importance
    trees: 6, 'binary-search-trees': 4, heaps: 4, Hashing: 6, 'sliding-window': 5, binary_search: 6, math: 5,
    // Low importance / Advanced
    graphs: 3, 'dynamic-programming': 4, greedy: 4, backtracking: 3, 'bit-manipulation': 3, trie: 1, 'union-find': 1
  },
  placement: {
    arrays: 20, strings: 15, 'linked-lists': 12, stacks: 10, queues: 8, sorting: 10, 'two-pointers': 10, recursion: 10, Hashing: 12, 'sliding-window': 10, 'binary-search': 10,
    trees: 12, 'binary-search-trees': 8, heaps: 8, graphs: 8, 'dynamic-programming': 10, greedy: 8, backtracking: 6, math: 8,
    'bit-manipulation': 5, trie: 2, 'union-find': 2
  },
  job_switch: {
    arrays: 25, strings: 20, 'linked-lists': 15, stacks: 12, queues: 10, sorting: 10, 'two-pointers': 12, recursion: 12, Hashing: 15, 'sliding-window': 12, 'binary-search': 12,
    trees: 15, 'binary-search-trees': 10, heaps: 10, graphs: 12, 'dynamic-programming': 15, greedy: 10, backtracking: 10, math: 10,
    'bit-manipulation': 8, trie: 4, 'union-find': 4
  }
};

export interface RawTopicStats {
  topicSlug: string;
  topicName: string;
  totalSolved: number;
  totalAttempted: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
}

export interface ScoredTopic {
  topicSlug: string;
  topicName: string;
  weaknessScore: number;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
}

export function calculateWeaknessScores(
  topicStats: RawTopicStats[],
  goal: string = 'placement'
): ScoredTopic[] {
  const targets = GOAL_TARGETS[goal] || GOAL_TARGETS.placement;

  return topicStats.map((stat) => {
    const target = targets[stat.topicSlug] || 8; // default target
    
    if (stat.totalSolved === 0) {
      // If attempted but 0 solved, highest weakness. If not attempted, very high weakness.
      const score = stat.totalAttempted > 0 ? 95.0 : 85.0;
      return {
        topicSlug: stat.topicSlug,
        topicName: stat.topicName,
        weaknessScore: score,
        totalSolved: stat.totalSolved,
        easySolved: stat.easySolved,
        mediumSolved: stat.mediumSolved,
        hardSolved: stat.hardSolved
      };
    }

    // 1. Coverage Component (up to 40 points)
    const coverageRatio = Math.min(1.0, stat.totalSolved / target);
    const coveragePoints = coverageRatio * 40;

    // 2. Difficulty Distribution Component (up to 40 points)
    let difficultyPoints = 0;
    if (stat.hardSolved > 0) {
      difficultyPoints = 40;
    } else if (stat.mediumSolved > 0) {
      // Award up to 30 points for medium solutions
      const medRatio = Math.min(1.0, stat.mediumSolved / Math.max(1, target * 0.4));
      difficultyPoints = 15 + (medRatio * 15);
    } else {
      // Only easy solved
      difficultyPoints = 10;
    }

    // 3. Accuracy / Efficiency Component (up to 20 points)
    // Estimate solve efficiency based on attempted vs solved
    const attemptRatio = stat.totalSolved / Math.max(1, stat.totalAttempted);
    const accuracyPoints = attemptRatio * 20;

    // Strength score out of 100
    const strengthScore = coveragePoints + difficultyPoints + accuracyPoints;

    // Weakness score is the inverse of strength
    const weaknessScore = Math.max(0, Math.min(100, 100 - strengthScore));

    return {
      topicSlug: stat.topicSlug,
      topicName: stat.topicName,
      weaknessScore: Math.round(weaknessScore * 10) / 10,
      totalSolved: stat.totalSolved,
      easySolved: stat.easySolved,
      mediumSolved: stat.mediumSolved,
      hardSolved: stat.hardSolved
    };
  });
}
