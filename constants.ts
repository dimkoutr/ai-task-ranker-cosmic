
import { TierDetails, ThemeName } from './types';

export const AI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

export const AI_PROMPT_TEMPLATE = `
You are an AI assistant that ranks a list of tasks by importance relative to each other.
The user will provide a JSON array of tasks, where each task object has an "id", "text", and optionally a "dueDate" (in "YYYY-MM-DD" ISO format, e.g., "2024-12-31"). A null "dueDate" means no specific due date is set.
The order of tasks in this input array ({TASKS_JSON_ARRAY}) is CRITICALLY IMPORTANT as it reflects the user's EXPLICIT and CURRENT preferred arrangement, especially after any manual re-ordering by the user.

Your job is to:
1. Evaluate all tasks provided based on their content, "dueDate", AND THEIR EXACT POSITION IN THE PROVIDED ARRAY.
2. Assign a numerical rank to each task from 1 (MOST important) to N (LEAST important, where N is the total number of tasks in the list). Each rank in this range must be used exactly once.
3. Ranking Logic (Current Date is {CURRENT_DATE_YYYY_MM_DD}):
   - The user's order in the input array ({TASKS_JSON_ARRAY}) is the MOST CRITICAL signal of importance. This order reflects the user's explicit and immediate preference. YOUR PRIMARY GOAL IS TO MAINTAIN THIS USER-DEFINED ORDER as closely as humanly possible.
   - Exception for Urgency: Tasks that are PAST DUE or DUE TODAY (relative to the current date {CURRENT_DATE_YYYY_MM_DD}) are critical. These tasks should be ranked very highly (e.g., 1, 2, 3...). If such a task appears lower in the user's list, you may elevate its rank above other non-critically-due tasks that the user placed higher.
   - Prioritize User Order for Non-Critical Tasks: For all tasks that are NOT past due or due today (i.e., tasks with future due dates or no due dates), their relative rank MUST strictly follow the user's provided order. If task A is before task B in the input array, and neither is past due/due today, task A MUST receive a better (lower numerical) rank than task B.
   - Relative Order of Critical Tasks: If multiple tasks are past due or due today, their relative order among themselves should also follow the user's provided input order as much as possible. For example, if the user lists PastDueTaskX before PastDueTaskY, PastDueTaskX should generally be ranked higher than PastDueTaskY.
   - Minimal Perturbation: Your ranking should perturb the user's desired order ONLY for the critical due date exceptions mentioned above. The objective is to refine the list by highlighting genuinely urgent items while respecting the user's explicit structure for everything else.
4. Provide a very brief justification (max 15 words) for each task's rank.
   - The \`justification\` MUST be a valid JSON string. This is CRITICALLY IMPORTANT.
   - If your justification text includes a double quote character ("), you MUST escape it as \\\\".
     Example: If justification is 'Use "special" tool', your JSON output for this part should be: "justification": "Use \\\\"special\\\\" tool".
   - If your justification text includes a backslash character (\\\\), you MUST escape it as \\\\\\\\.
     Example: If justification is 'Path C:\\\\temp', output as: "justification": "Path C:\\\\\\\\temp".
   - Include emojis directly as UTF-8 characters (e.g., 🚨, 💡). Do NOT attempt to invent escape sequences like \\\`🚨\\\`. Standard Unicode escape sequences (e.g., \\\\u2728 for ✨) are valid but not necessary if you can include the character directly.
   - Other standard JSON string escapes like \\\\n for newline are also valid if needed.

Respond ONLY with a JSON array of objects. Each object in the array must correspond to one of the input tasks and contain:
- "id": The original id of the task.
- "rank": The numerical rank you assigned (integer, from 1 to N).
- "justification": Your brief justification (string, max 15 words, potentially including emojis, and correctly escaped as per the rules above).

Example of your expected output format (assuming current date allows for 'Due very soon!' or 'Due today'):
[
  {"id": "id_A", "rank": 1, "justification": "User placed first; 🚨 Due very soon!"},
  {"id": "id_C", "rank": 2, "justification": "Critical: Due today; User order maintained."},
  {"id": "id_B", "rank": 3, "justification": "User order; important, no urgent due date."},
  {"id": "id_D", "rank": 4, "justification": "User order; Past Due at C:\\\\\\\\Docs."}
]

Do not include any text, explanations, or markdown (like \`\`\`json) outside of this JSON array. Your entire response should be directly parsable as a JSON array.
`;

export const FREE_TIER_MAX_LISTS = 3;
export const FREE_TIER_MAX_TASKS_PER_LIST = 20;
export const FREE_TIER_THEME: ThemeName = 'cosmic-glow';

export const SUBSCRIPTION_PLANS: TierDetails[] = [
  {
    id: 'free',
    name: 'Free Explorer',
    isFree: true,
    priceMonthly: 'Free',
    features: [
      `Up to ${FREE_TIER_MAX_LISTS} Task Lists`,
      `Up to ${FREE_TIER_MAX_TASKS_PER_LIST} Tasks per List`,
      'Basic AI Ranking',
      `Access to "${FREE_TIER_THEME.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}" Theme`,
      'Community Support',
    ],
    ctaText: 'Continue with Free',
    maxLists: FREE_TIER_MAX_LISTS,
    maxTasksPerList: FREE_TIER_MAX_TASKS_PER_LIST,
    accessToAllThemes: false,
    dataExportImport: false,
    aiRankingType: 'Basic',
  },
  {
    id: 'pro',
    name: 'Pro Voyager',
    priceMonthly: '$4.99',
    priceYearly: '$49.99 (Save 15%)',
    features: [
      'Unlimited Task Lists',
      'Unlimited Tasks per List',
      'Advanced AI Ranking',
      'Access to All Themes',
      'Data Export & Import',
      'Standard Support',
    ],
    highlight: 'Most Popular',
    ctaText: 'Upgrade to Pro',
    maxLists: Infinity,
    maxTasksPerList: Infinity,
    accessToAllThemes: true,
    dataExportImport: true,
    aiRankingType: 'Advanced',
  },
  {
    id: 'cosmic_pro',
    name: 'Galactic Overlord',
    priceMonthly: '$9.99',
    priceYearly: '$99.99 (Save 17%)',
    features: [
      'All Pro Features',
      'Priority AI Processing',
      'Exclusive List Icons (Coming Soon)',
      'Priority Customer Support',
      'Early Access to New Features',
    ],
    ctaText: 'Go Cosmic Pro',
    maxLists: Infinity,
    maxTasksPerList: Infinity,
    accessToAllThemes: true,
    dataExportImport: true,
    aiRankingType: 'Priority',
    exclusiveIcons: true,
    prioritySupport: true,
  },
];

export const getTierDetails = (tierId: TierDetails['id']): TierDetails | undefined => {
    return SUBSCRIPTION_PLANS.find(plan => plan.id === tierId);
};
