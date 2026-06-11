import { calculateWeaknessScores, ScoredTopic } from './rule-based-pre-scorer';
import problemsJson from '../../lib/constants/problems.json';
import { z } from 'zod';

const weakTopicSchema = z.object({
  rank: z.number(),
  topicSlug: z.string(),
  topicName: z.string(),
  weaknessScore: z.number(),
  severity: z.enum(['critical', 'moderate', 'mild']),
  explanation: z.string(),
  recommendedAction: z.string()
});

const weaknessReportSchema = z.object({
  overallWeaknessScore: z.number(),
  aiSummary: z.string(),
  weakTopics: z.array(weakTopicSchema)
});

interface ProblemSeed {
  leetcodeSlug: string;
  problemTitle: string;
  difficulty: string;
  topicSlug: string;
  leetcodeUrl: string;
}

const problems: ProblemSeed[] = problemsJson as ProblemSeed[];

export interface WeakTopicReport {
  rank: number;
  topicSlug: string;
  topicName: string;
  weaknessScore: number;
  severity: 'critical' | 'moderate' | 'mild';
  explanation: string;
  recommendedAction: string;
}

export interface WeaknessReportData {
  generatedAt: string;
  nextAllowedAt: string;
  overallWeaknessScore: number;
  aiSummary: string;
  weakTopics: WeakTopicReport[];
}

// Helper to get standard problems for a topic to suggest in templates
function getSampleProblems(topicSlug: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium', limit: number = 2): string {
  const filtered = problems.filter(p => p.topicSlug === topicSlug && p.difficulty === difficulty);
  const selected = filtered.length > 0 ? filtered : problems.filter(p => p.topicSlug === topicSlug);
  return selected.slice(0, limit).map(p => p.problemTitle).join(' and ') || 'standard problems';
}

function generateLocalWeaknessReport(scoredTopics: ScoredTopic[], goal: string): WeaknessReportData {
  // Sort by weakness score descending
  const sorted = [...scoredTopics].sort((a, b) => b.weaknessScore - a.weaknessScore);

  // Take top weak topics with score >= 30 (limit to top 10)
  const weakTopicsToReport = sorted.filter(t => t.weaknessScore >= 20).slice(0, 10);

  const weakTopics: WeakTopicReport[] = weakTopicsToReport.map((topic, index) => {
    let severity: 'critical' | 'moderate' | 'mild' = 'mild';
    if (topic.weaknessScore >= 75) severity = 'critical';
    else if (topic.weaknessScore >= 45) severity = 'moderate';

    let explanation = '';
    let recommendedAction = '';

    const easySample = getSampleProblems(topic.topicSlug, 'easy', 1);
    const medSample = getSampleProblems(topic.topicSlug, 'medium', 2);

    if (topic.totalSolved === 0) {
      explanation = `You have not solved any problems in ${topic.topicName} yet. This is a significant gap in your interview preparation since ${topic.topicName} is highly tested.`;
      recommendedAction = `Start by solving 3-4 Easy problems in ${topic.topicName} like ${easySample || 'basic exercises'} to build core conceptual familiarity.`;
    } else if (topic.mediumSolved === 0 && topic.hardSolved === 0) {
      explanation = `You have solved ${topic.totalSolved} Easy problems in ${topic.topicName}, but have not attempted any Medium or Hard challenges. Interviews focus heavily on Medium problems.`;
      recommendedAction = `Progress to Medium difficulty. Solve at least 3-4 Medium-level problems in ${topic.topicName}, starting with ${medSample}.`;
    } else {
      explanation = `Your current solve count of ${topic.totalSolved} in ${topic.topicName} indicates low coverage. You need a higher practice volume to recognize patterns quickly under time pressure.`;
      recommendedAction = `Solve 3 more Medium/Hard problems in ${topic.topicName} to solidify your edge case handling. Try ${medSample}.`;
    }

    return {
      rank: index + 1,
      topicSlug: topic.topicSlug,
      topicName: topic.topicName,
      weaknessScore: topic.weaknessScore,
      severity,
      explanation,
      recommendedAction
    };
  });

  // Calculate overall score
  const activeWeaknessScores = weakTopics.map(t => t.weaknessScore);
  const overallWeaknessScore = activeWeaknessScores.length > 0 
    ? Math.round((activeWeaknessScores.reduce((a, b) => a + b, 0) / activeWeaknessScores.length) * 10) / 10 
    : 0;

  // Generate a premium summary
  let aiSummary = '';
  if (overallWeaknessScore >= 70) {
    const criticalList = weakTopics.filter(t => t.severity === 'critical').map(t => t.topicName).slice(0, 2).join(', ');
    aiSummary = `Your preparation needs urgent structure. You have critical weaknesses in key areas like ${criticalList || 'core topics'}. Focus on establishing foundation problems before attempting mock tests.`;
  } else if (overallWeaknessScore >= 40) {
    const moderateList = weakTopics.filter(t => t.severity === 'moderate').map(t => t.topicName).slice(0, 2).join(', ');
    aiSummary = `You have solid basics, but you need to level up in Medium-difficulty questions. Focus on intermediate topics like ${moderateList || 'key data structures'} to increase your consistency and interview readiness.`;
  } else {
    aiSummary = `Excellent progress! You show strong overall coverage. Fine-tune your speed, attempt harder problems, and practice mock interviews to maximize your placement success.`;
  }

  const now = new Date();
  const nextAllowed = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return {
    generatedAt: now.toISOString(),
    nextAllowedAt: nextAllowed.toISOString(),
    overallWeaknessScore,
    aiSummary,
    weakTopics
  };
}

export async function detectWeaknesses(
  topicStats: { topicSlug: string; topicName: string; totalAttempted: number; totalSolved: number; easySolved: number; mediumSolved: number; hardSolved: number }[],
  goal: string = 'placement'
): Promise<WeaknessReportData> {
  // First compute rule-based pre-scores
  const scoredTopics = calculateWeaknessScores(topicStats, goal);

  const isGroq = !!process.env.GROQ_API_KEY;
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.log('No GROQ_API_KEY or OPENAI_API_KEY found. Generating local rule-based weakness report.');
    return generateLocalWeaknessReport(scoredTopics, goal);
  }

  // Otherwise call API
  try {
    const promptData = scoredTopics.map(t => ({
      slug: t.topicSlug,
      name: t.topicName,
      solved: t.totalSolved,
      easy: t.easySolved,
      medium: t.mediumSolved,
      hard: t.hardSolved,
      preScore: t.weaknessScore
    }));

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
            content: `You are a DSA coaching expert. Analyze the user's DSA stats and provide a detailed weakness report. 
            Respond ONLY with a JSON object containing:
            {
              "overallWeaknessScore": number, // 0-100 scale
              "aiSummary": "string", // 2 paragraphs explaining the state of preparation
              "weakTopics": [
                {
                  "rank": number, // 1-indexed
                  "topicSlug": "string",
                  "topicName": "string",
                  "weaknessScore": number,
                  "severity": "critical" | "moderate" | "mild",
                  "explanation": "string", // 2-3 specific sentences
                  "recommendedAction": "string" // Actionable task
                }
              ]
            }
            Ensure severity maps to weaknessScore: >=75 critical, 45-74 moderate, <45 mild. Limit weakTopics to top 8 items.`
          },
          {
            role: 'user',
            content: `Goal: ${goal}\nStats:\n${JSON.stringify(promptData, null, 2)}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`${isGroq ? 'Groq' : 'OpenAI'} HTTP error ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.choices[0]?.message?.content;
    const parsed = weaknessReportSchema.parse(JSON.parse(resultText));

    const now = new Date();
    const nextAllowed = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return {
      generatedAt: now.toISOString(),
      nextAllowedAt: nextAllowed.toISOString(),
      overallWeaknessScore: parsed.overallWeaknessScore || 50,
      aiSummary: parsed.aiSummary || 'Summary loaded.',
      weakTopics: parsed.weakTopics || []
    };
  } catch (error) {
    console.error(`${isGroq ? 'Groq' : 'OpenAI'} weakness detection call failed, falling back to local generator:`, error);
    return generateLocalWeaknessReport(scoredTopics, goal);
  }
}
