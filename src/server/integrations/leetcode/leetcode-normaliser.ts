import { DSA_TOPICS } from '@/lib/constants';

// Mappings from LeetCode tag slugs to our canonical topic slugs
const LEETCODE_TAG_MAPPINGS: Record<string, string> = {
  'array': 'arrays',
  'string': 'strings',
  'linked-list': 'linked-lists',
  'stack': 'stacks',
  'queue': 'queues',
  'tree': 'trees',
  'binary-tree': 'trees',
  'binary-search-tree': 'binary-search-trees',
  'heap': 'heaps',
  'heap-priority-queue': 'heaps',
  'graph': 'graphs',
  'dynamic-programming': 'dynamic-programming',
  'greedy': 'greedy',
  'backtracking': 'backtracking',
  'sorting': 'sorting',
  'binary-search': 'binary-search',
  'hash-table': 'hashing',
  'hash-map': 'hashing',
  'two-pointers': 'two-pointers',
  'sliding-window': 'sliding-window',
  'recursion': 'recursion',
  'divide-and-conquer': 'divide-and-conquer',
  'bit-manipulation': 'bit-manipulation',
  'math': 'math',
  'trie': 'trie',
  'union-find': 'union-find'
};

export interface NormalizedTopicStats {
  topicSlug: string;
  topicName: string;
  totalSolved: number;
  // Estimates based on difficulty weights
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
}

export function normalizeLeetCodeStats(
  tagStats: { tagSlug: string; tagName: string; solvedCount: number }[],
  easySolvedTotal: number,
  mediumSolvedTotal: number,
  hardSolvedTotal: number
): NormalizedTopicStats[] {
  // Initialize counts for all 23 canonical topics
  const counts: Record<string, number> = {};
  DSA_TOPICS.forEach((topic) => {
    counts[topic.slug] = 0;
  });

  // Aggregate raw counts using mappings
  tagStats.forEach((tag) => {
    const canonicalSlug = LEETCODE_TAG_MAPPINGS[tag.tagSlug];
    if (canonicalSlug && counts[canonicalSlug] !== undefined) {
      counts[canonicalSlug] += tag.solvedCount;
    }
  });

  const totalTopicSolved = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

  // Distribute Easy/Medium/Hard solved count proportionally to solve count
  return DSA_TOPICS.map((topic) => {
    const solved = counts[topic.slug];
    const proportion = solved / totalTopicSolved;

    // Distribute overall solved count proportionally
    const easy = Math.min(solved, Math.round(easySolvedTotal * proportion));
    const hard = Math.min(solved - easy, Math.round(hardSolvedTotal * proportion));
    const medium = Math.max(0, solved - easy - hard);

    return {
      topicSlug: topic.slug,
      topicName: topic.name,
      totalSolved: solved,
      easySolved: easy,
      mediumSolved: medium,
      hardSolved: hard
    };
  });
}
