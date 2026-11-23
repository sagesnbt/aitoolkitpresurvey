import { domains, experienceOptions, confidenceOptions, toolOptions, goalOptions, SURVEY_VERSION } from './survey-data.js';

export function createAnswers() {
  return { experience: null, confidence: null, tools: [], other: '', goal: null,
    current: Object.fromEntries(domains.map(d => [d.key, null])),
    future: Object.fromEntries(domains.map(d => [d.key, null])), project: '', comments: '' };
}
export function isRating(value) { return Number.isInteger(value) && value >= 1 && value <= 10; }
export function toggleTool(selected, key, checked) {
  if (!checked) return selected.filter(k => k !== key);
  if (key === 'none') return ['none'];
  const next = selected.filter(k => k !== 'none');
  if (next.includes(key)) return next;
  return next.length >= 5 ? selected : [...next, key];
}
export function validateStep(answers, step) {
  const errors = {};
  if (step === 1) {
    if (!experienceOptions.some(o => o[0] === answers.experience)) errors.experience = 'Select the experience that best describes you.';
    if (!Number.isInteger(answers.confidence) || answers.confidence < 1 || answers.confidence > 5) errors.confidence = 'Select your confidence level.';
    if (!answers.tools.length) errors.tools = 'Select at least one option, including no recent use if applicable.';
    else if (answers.tools.length > 5 || new Set(answers.tools).size !== answers.tools.length || answers.tools.some(k => !toolOptions.some(o => o[0] === k))) errors.tools = 'Select up to five different tools.';
    else if (answers.tools.includes('none') && answers.tools.length !== 1) errors.tools = 'Select no recent use on its own.';
    if (answers.tools.includes('other') && !answers.other.trim()) errors.other = 'Please specify the other AI tool.';
    if (!goalOptions.some(o => o[0] === answers.goal)) errors.goal = 'Select your higher-priority learning goal.';
  }
  if (step === 2 || step === 3) {
    const group = step === 2 ? 'current' : 'future';
    for (const d of domains) {
      const value = answers[group][d.key];
      if (!isRating(value) && !(group === 'current' && value === 'N/A'))
        errors[`${group}_${d.key}`] = group === 'current' ? 'Choose or confirm a rating, or select Not applicable.' : 'Choose or confirm a rating from 1 to 10.';
    }
  }
  return errors;
}
export function validateAll(answers) {
  return Object.assign({}, ...[1, 2, 3].map(step => validateStep(answers, step)));
}
export function endpointConfigured(endpoint) {
  return typeof endpoint === 'string' && /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint) && !/YOUR|PLACEHOLDER|FORM_ID/i.test(endpoint);
}
function optionText(options, key) {
  const option = options.find(o => o[0] === key);
  return option ? `${option[1]}${option[2] ? ': ' + option[2] : ''}` : '';
}
export function buildPayload(answers, metadata) {
  if (Object.keys(validateAll(answers)).length) throw new Error('Complete the required answers before submission.');
  const payload = {
    survey_version: SURVEY_VERSION,
    submission_id: metadata.id,
    submitted_at: metadata.timestamp,
    ai_experience: optionText(experienceOptions, answers.experience),
    ai_experience_key: answers.experience,
    confidence: answers.confidence,
    confidence_label: confidenceOptions[answers.confidence - 1],
    selected_tools: answers.tools.map(k => toolOptions.find(o => o[0] === k)[1]),
    other_tool: answers.tools.includes('other') ? answers.other.trim() : '',
    primary_learning_goal: optionText(goalOptions, answers.goal),
    primary_learning_goal_key: answers.goal,
    project_description: answers.project.trim(),
    additional_comments: answers.comments.trim()
  };
  for (const d of domains) {
    payload[`current_use_${d.key}`] = answers.current[d.key];
    payload[`future_interest_${d.key}`] = answers.future[d.key];
  }
  return payload;
}
export async function submitSurvey(endpoint, payload, fetcher = globalThis.fetch, signal) {
  if (!endpointConfigured(endpoint)) throw new Error('Submission is not available yet. Your responses have not been sent.');
  const response = await fetcher(endpoint, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal });
  if (!response.ok) {
    if (response.status === 429) throw new Error('Submission was not confirmed. Please wait a minute before trying again.');
    throw new Error('Submission was not confirmed. Please try again when you are ready.');
  }
  return true;
}
