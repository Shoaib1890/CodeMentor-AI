export interface DsaTopic {
  slug: string;
  name: string;
}

export const DSA_TOPICS: DsaTopic[] = [
  { slug: 'arrays', name: 'Arrays' },
  { slug: 'strings', name: 'Strings' },
  { slug: 'linked-lists', name: 'Linked Lists' },
  { slug: 'stacks', name: 'Stacks' },
  { slug: 'queues', name: 'Queues' },
  { slug: 'trees', name: 'Trees' },
  { slug: 'binary-search-trees', name: 'Binary Search Trees' },
  { slug: 'heaps', name: 'Heaps' },
  { slug: 'graphs', name: 'Graphs' },
  { slug: 'dynamic-programming', name: 'Dynamic Programming' },
  { slug: 'greedy', name: 'Greedy' },
  { slug: 'backtracking', name: 'Backtracking' },
  { slug: 'sorting', name: 'Sorting' },
  { slug: 'binary-search', name: 'Binary Search' },
  { slug: 'hashing', name: 'Hashing' },
  { slug: 'two-pointers', name: 'Two Pointers' },
  { slug: 'sliding-window', name: 'Sliding Window' },
  { slug: 'recursion', name: 'Recursion' },
  { slug: 'divide-and-conquer', name: 'Divide and Conquer' },
  { slug: 'bit-manipulation', name: 'Bit Manipulation' },
  { slug: 'math', name: 'Math' },
  { slug: 'trie', name: 'Trie' },
  { slug: 'union-find', name: 'Union Find' }
];

export const SEVERITIES = [
  { id: 'critical', label: 'Critical Gap', color: 'text-red-500 bg-red-500/10 border-red-500/20' },
  { id: 'moderate', label: 'Moderate Focus', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { id: 'mild', label: 'Mild Practice', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' }
];

export const PREPARATION_GOALS = [
  { id: 'internship', name: 'Internship Preparation', description: 'Focus on core DSA topics, Easy-to-Medium problems, and speed' },
  { id: 'placement', name: 'Campus Placement', description: 'Comprehensive coverage of all topics, Medium-level focus, standard company questions' },
  { id: 'job_switch', name: 'Job Switch (FAANG)', description: 'Advanced DSA patterns, Medium-to-Hard problems, deep code explanation, system design' }
];
