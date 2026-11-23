export const SURVEY_VERSION = 'ai-surgeons-pre-course-1.0';
export const COURSE_TITLE = 'Building Your AI Toolkit: A Hands-On AI Course for Surgeons';
export const COURSE_URL = 'https://www.sages.org/course-info/?courseID=97';

export const experienceOptions = [
  ['everyday_use', '1 — Everyday use', 'I use AI tools such as ChatGPT, Gemini, or Claude for questions, brainstorming, or drafting text.'],
  ['professional_use', '2 — Professional use', 'I use AI for professional tasks, such as preparing educational materials, organizing information, or drafting documents.'],
  ['building_with_guidance', '3 — Building with guidance', 'I use AI to write or modify code, analyze data, or create simple automations, but I need guidance.'],
  ['independent_building', '4 — Independent building and troubleshooting', 'I can independently build, test, and troubleshoot AI-assisted code or automations for my needs.'],
  ['not_yet_used', 'I have not yet used AI tools.', '(Outside the experience scale.)']
];
export const confidenceOptions = ['Not at all confident', 'Slightly confident', 'Moderately confident', 'Very confident', 'Extremely confident'];
export const toolOptions = [
  ['chatgpt', 'ChatGPT'], ['claude', 'Claude'], ['gemini', 'Google Gemini'],
  ['microsoft_copilot', 'Microsoft Copilot'], ['github_copilot', 'GitHub Copilot'],
  ['cursor', 'Cursor'], ['openevidence', 'OpenEvidence'], ['doximity', 'Doximity’s AI tools'],
  ['institution_specific', 'Institution-specific AI tools, including those integrated into your electronic medical record (EMR)'],
  ['other', 'Other — please specify'],
  ['none', 'I have not used AI tools in the past 30 days. (Select this option only.)']
];
export const goalOptions = [
  ['optimize_existing', 'Optimize existing tools', 'Learn to use available AI tools more effectively in clinical practice and professional work.'],
  ['explore_build', 'Explore and build new tools', 'Learn basic coding and AI development to create tools, agents, or models and explore new research applications.']
];
export const domains = [
  { key: 'surgical_intraoperative', name: 'Surgical and intraoperative work', short: 'Surgical', color: '#648274', pale: '#e6eee7', examples: 'Surgical planning, surgical video analysis, intraoperative decision support' },
  { key: 'clinical_outside_or', name: 'Clinical work outside the OR', short: 'Clinical', color: '#69869b', pale: '#e7edf2', examples: 'Documentation, billing and coding; reviewing your own outcomes or performance; institutional quality improvement' },
  { key: 'research', name: 'Research', short: 'Research', color: '#9280a6', pale: '#eee9f3', examples: 'Literature review, data management and analysis, scientific writing' },
  { key: 'education_communication', name: 'Education and communication', short: 'Education', color: '#b58a68', pale: '#f4e9de', examples: 'Teaching materials, presentations, patient education, email, professional communications, social media' },
  { key: 'entrepreneurship', name: 'Entrepreneurship and new ventures', short: 'Ventures', color: '#ac7a85', pale: '#f2e6e9', examples: 'Developing apps, businesses, AI agents, or websites' }
];
export const questions = {
  experience: 'Which statement best describes your current experience using AI?',
  confidence: 'How confident are you in your ability to use AI tools effectively for professional tasks?',
  tools: 'Which AI tools have you used most frequently recently, for personal or professional purposes?',
  goal: 'Which learning goal is your higher priority for this course?',
  current: 'How frequently have you used AI in each of the following areas?',
  future: 'How interested are you in learning to use or build AI tools in each of the following areas?',
  project: 'Have you used or developed an AI tool, project, or workflow that you are proud of or that others could learn from?',
  comments: 'What else would you like the course directors to know?'
};
export const projectInstruction = 'Optional. Briefly describe the problem you addressed, what you created or implemented, and any results. Please indicate whether you would be interested in sharing it during the course.';
export const commentsInstruction = 'Optional. Please share any additional learning goals, topics you would like covered, or needs that would help you participate fully.';
export const profileExplanation = 'These profiles show your current use and future learning interests. They are not a skills assessment or a measured post-course outcome.';
