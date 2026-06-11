import problemsJson from '../../lib/constants/problems.json';
import { WeakTopicReport } from './weakness-detector';
import { z } from 'zod';

const problemSchema = z.object({
  leetcodeSlug: z.string(),
  problemTitle: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  leetcodeUrl: z.string()
});

const weekSchema = z.object({
  weekNumber: z.number(),
  focusTopicSlug: z.string(),
  focusTopicName: z.string(),
  weekDescription: z.string(),
  problems: z.array(problemSchema)
});

const studyPlanSchema = z.object({
  weeks: z.array(weekSchema)
});

interface ProblemSeed {
  leetcodeSlug: string;
  problemTitle: string;
  difficulty: string;
  topicSlug: string;
  leetcodeUrl: string;
}

const problems: ProblemSeed[] = problemsJson as ProblemSeed[];

export interface PlanProblem {
  leetcodeSlug: string;
  problemTitle: string;
  difficulty: string;
  leetcodeUrl: string;
  displayOrder: number;
}

export interface PlanWeek {
  weekNumber: number;
  focusTopicSlug: string;
  focusTopicName: string;
  weekDescription: string;
  problems: PlanProblem[];
}

export interface GeneratedStudyPlan {
  generatedAt: string;
  nextAllowedAt: string;
  targetDate: string;
  daysRemaining: number;
  totalWeeks: number;
  weeks: PlanWeek[];
}

function generateLocalStudyPlan(
  weakTopics: WeakTopicReport[],
  daysRemaining: number,
  targetDateStr: string,
  goal: string
): GeneratedStudyPlan {
  // Calculate total weeks (min 1, max 16)
  let totalWeeks = Math.max(1, Math.min(16, Math.floor(daysRemaining / 7)));

  const weeks: PlanWeek[] = [];

  // Filter topics that we actually have seeded problems for, and sort by rank
  const activeTopics = weakTopics.filter(wt => 
    problems.some(p => p.topicSlug === wt.topicSlug)
  );

  // Fallback if no weak topics found
  const fallbackTopics = [
    { topicSlug: 'arrays', topicName: 'Arrays', severity: 'moderate' },
    { topicSlug: 'strings', topicName: 'Strings', severity: 'moderate' },
    { topicSlug: 'linked-lists', topicName: 'Linked Lists', severity: 'mild' }
  ];

  const topicsToUse = activeTopics.length > 0 ? activeTopics : fallbackTopics;

  // Distribute topics to weeks
  for (let w = 1; w <= totalWeeks; w++) {
    // Round-robin selection of topics, repeating top topics if we run out
    const topicIndex = (w - 1) % topicsToUse.length;
    const topic = topicsToUse[topicIndex];

    const topicSlug = topic.topicSlug;
    const topicName = topic.topicName;
    const severity = (topic as any).severity || 'moderate';

    // Description template
    const weekDescription = `This week focuses on solidifying your skills in ${topicName}. Based on your LeetCode history, you have a ${severity} gap here. Mastering these patterns is critical for top SWE technical interviews.`;

    // Filter problems for this topic
    const topicProblems = problems.filter(p => p.topicSlug === topicSlug);

    // Pick problems based on prep goal
    let selectedProblems: ProblemSeed[] = [];
    const easy = topicProblems.filter(p => p.difficulty === 'easy');
    const medium = topicProblems.filter(p => p.difficulty === 'medium');
    const hard = topicProblems.filter(p => p.difficulty === 'hard');

    if (goal === 'internship') {
      // 2 Easy, 1 Medium
      selectedProblems = [
        ...easy.slice(0, 2),
        ...medium.slice(0, 1)
      ];
    } else if (goal === 'job_switch') {
      // 1 Easy, 2 Medium, 1 Hard
      selectedProblems = [
        ...easy.slice(0, 1),
        ...medium.slice(0, 2),
        ...hard.slice(0, 1)
      ];
    } else {
      // placement: 1 Easy, 2 Medium
      selectedProblems = [
        ...easy.slice(0, 1),
        ...medium.slice(0, 2)
      ];
    }

    // Default fallbacks if not enough problems in specific categories
    if (selectedProblems.length < 3) {
      selectedProblems = topicProblems.slice(0, 4);
    }

    const weekProblems: PlanProblem[] = selectedProblems.map((p, pIndex) => ({
      leetcodeSlug: p.leetcodeSlug,
      problemTitle: p.problemTitle,
      difficulty: p.difficulty,
      leetcodeUrl: p.leetcodeUrl,
      displayOrder: pIndex + 1
    }));

    weeks.push({
      weekNumber: w,
      focusTopicSlug: topicSlug,
      focusTopicName: topicName,
      weekDescription,
      problems: weekProblems
    });
  }

  const now = new Date();
  const nextAllowed = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return {
    generatedAt: now.toISOString(),
    nextAllowedAt: nextAllowed.toISOString(),
    targetDate: targetDateStr,
    daysRemaining,
    totalWeeks,
    weeks
  };
}

export async function generateStudyPlan(
  weakTopics: WeakTopicReport[],
  daysRemaining: number,
  targetDateStr: string,
  goal: string = 'placement'
): Promise<GeneratedStudyPlan> {
  const isGroq = !!process.env.GROQ_API_KEY;
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.log('No GROQ_API_KEY or OPENAI_API_KEY found. Generating local rule-based study plan.');
    return generateLocalStudyPlan(weakTopics, daysRemaining, targetDateStr, goal);
  }

  try {
    let totalWeeks = Math.max(1, Math.min(16, Math.floor(daysRemaining / 7)));

    const apiUrl = isGroq 
      ? 'https://api.groq.com/openapi/v1/chat/completions' 
      : 'https://api.openai.com/v1/chat/completions';
    const apiModel = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: apiModel,
        response_format: { type: 'json_object' },
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: `You are an expert DSA coding interview coach. Create a week-by-week study plan.
            You must output a valid JSON object matching this structure:
            {
              "weeks": [
                {
                  "weekNumber": number,
                  "focusTopicSlug": "string",
                  "focusTopicName": "string",
                  "weekDescription": "string", // 2 sentences describing the week focus
                  "problems": [
                    {
                      "leetcodeSlug": "string", // Must match standard LeetCode slug
                      "problemTitle": "string",
                      "difficulty": "easy" | "medium" | "hard",
                      "leetcodeUrl": "string" // link e.g., https://leetcode.com/problems/slug/
                    }
                  ]
                }
              ]
            }
            Ensure problems are real and relevant to the weak topics list. Limit problems per week to 3-5.`
          },
          {
            role: 'user',
            content: `Weeks to plan: ${totalWeeks}\nGoal: ${goal}\nWeak Topics: ${JSON.stringify(weakTopics, null, 2)}\nKnown LeetCode Problems Database: ${JSON.stringify(problems.slice(0, 50))}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`${isGroq ? 'Groq' : 'OpenAI'} Study Plan HTTP error ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.choices[0]?.message?.content;
    const parsed = studyPlanSchema.parse(JSON.parse(resultText));

    // Validate that problems returned exist or fallback to local slugs
    const validatedWeeks = (parsed.weeks || []).map((week: any) => {
      const validatedProblems = (week.problems || []).map((p: any, idx: number) => {
        // Double check if slug exists in database
        const match = problems.find(dbP => dbP.leetcodeSlug === p.leetcodeSlug);
        return {
          leetcodeSlug: match ? match.leetcodeSlug : p.leetcodeSlug,
          problemTitle: match ? match.problemTitle : p.problemTitle,
          difficulty: match ? match.difficulty : p.difficulty,
          leetcodeUrl: match ? match.leetcodeUrl : `https://leetcode.com/problems/${p.leetcodeSlug}/`,
          displayOrder: idx + 1
        };
      });

      return {
        ...week,
        problems: validatedProblems
      };
    });

    const now = new Date();
    const nextAllowed = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return {
      generatedAt: now.toISOString(),
      nextAllowedAt: nextAllowed.toISOString(),
      targetDate: targetDateStr,
      daysRemaining,
      totalWeeks: validatedWeeks.length,
      weeks: validatedWeeks
    };
  } catch (error) {
    console.error(`${isGroq ? 'Groq' : 'OpenAI'} study plan generation failed, falling back to local generator:`, error);
    return generateLocalStudyPlan(weakTopics, daysRemaining, targetDateStr, goal);
  }
}
