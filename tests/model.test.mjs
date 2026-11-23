import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAnswers, isRating, toggleTool, validateStep, validateAll,
  endpointConfigured, buildPayload, submitSurvey
} from '../model.js';
import { domains, SURVEY_VERSION } from '../survey-data.js';

const domainKeys = [
  'surgical_intraoperative', 'clinical_outside_or', 'research',
  'education_communication', 'entrepreneurship'
];
const metadata = { id: 'test-submission-42', timestamp: '2026-11-23T15:45:00.000Z' };
const endpoint = 'https://formspree.io/f/abcdefgh';

function completedAnswers() {
  const answers = createAnswers();
  answers.experience = 'not_yet_used';
  answers.confidence = 1;
  answers.tools = ['none'];
  answers.goal = 'optimize_existing';
  domainKeys.forEach((key, index) => {
    answers.current[key] = index + 1;
    answers.future[key] = 10 - index;
  });
  return answers;
}

test('initial answers contain no implicit selections or ratings, and instances are independent', () => {
  const first = createAnswers();
  const second = createAnswers();
  assert.equal(first.experience, null);
  assert.equal(first.confidence, null);
  assert.equal(first.goal, null);
  assert.deepEqual(first.tools, []);
  assert.deepEqual(Object.keys(first.current), domainKeys);
  assert.deepEqual(Object.keys(first.future), domainKeys);
  assert.ok(Object.values(first.current).every(value => value === null));
  assert.ok(Object.values(first.future).every(value => value === null));
  first.current.research = 5;
  first.tools.push('chatgpt');
  assert.equal(second.current.research, null);
  assert.equal(first.future.research, null);
  assert.deepEqual(second.tools, []);
});

test('only integer numeric ratings from 1 through 10 are valid', () => {
  for (let value = 1; value <= 10; value++) assert.equal(isRating(value), true);
  for (const value of [null, undefined, '', '5', 'N/A', 0, 11, 1.5, NaN, Infinity]) {
    assert.equal(isRating(value), false, `${String(value)} must not be recorded as a numeric rating`);
  }
});

test('Q1–Q4 require deliberate responses, including at least one tools choice', () => {
  assert.deepEqual(Object.keys(validateStep(createAnswers(), 1)).sort(), ['confidence', 'experience', 'goal', 'tools']);
  const answers = completedAnswers();
  assert.deepEqual(validateStep(answers, 1), {});
  for (const [field, invalid] of [['experience', 'invented'], ['confidence', 0], ['confidence', 6], ['confidence', '1'], ['goal', 'both']]) {
    const changed = { ...answers, [field]: invalid };
    assert.ok(validateStep(changed, 1)[field], `${field} rejects ${invalid}`);
  }
});

test('selecting no recent tools is exclusive, and selecting a tool clears no recent use', () => {
  assert.deepEqual(toggleTool(['chatgpt', 'claude'], 'none', true), ['none']);
  assert.deepEqual(toggleTool(['none'], 'chatgpt', true), ['chatgpt']);
  assert.deepEqual(toggleTool(['none'], 'none', false), []);
  const answers = completedAnswers();
  answers.tools = ['none', 'chatgpt'];
  assert.match(validateStep(answers, 1).tools, /on its own/i);
});

test('tools limit is five distinct selections, includes Other, and allows removal', () => {
  const selected = ['chatgpt', 'claude', 'gemini', 'cursor', 'other'];
  assert.deepEqual(toggleTool(selected, 'openevidence', true), selected);
  assert.deepEqual(toggleTool(selected, 'claude', true), selected);
  assert.deepEqual(toggleTool(selected, 'claude', false), ['chatgpt', 'gemini', 'cursor', 'other']);
  assert.deepEqual(selected, ['chatgpt', 'claude', 'gemini', 'cursor', 'other']);
  const answers = completedAnswers();
  for (const tools of [['chatgpt', 'claude', 'gemini', 'cursor', 'other', 'openevidence'], ['chatgpt', 'chatgpt'], ['invented']]) {
    answers.tools = tools;
    assert.ok(validateStep(answers, 1).tools);
  }
});

test('Other requires a nonblank description only while selected', () => {
  const answers = completedAnswers();
  answers.tools = ['other'];
  answers.other = '   \n ';
  assert.ok(validateStep(answers, 1).other);
  answers.other = '  A local research assistant  ';
  assert.deepEqual(validateStep(answers, 1), {});
  answers.tools = ['chatgpt'];
  answers.other = '';
  assert.deepEqual(validateStep(answers, 1), {});
});

test('all five domains are required separately; current accepts N/A and future does not', () => {
  assert.deepEqual(domains.map(domain => domain.key), domainKeys);
  const answers = createAnswers();
  assert.equal(Object.keys(validateStep(answers, 2)).length, 5);
  assert.equal(Object.keys(validateStep(answers, 3)).length, 5);
  answers.current.research = 5;
  assert.equal(Object.keys(validateStep(answers, 2)).length, 4);
  assert.equal(Object.keys(validateStep(answers, 3)).length, 5);
  for (const key of domainKeys) answers.current[key] = 'N/A';
  assert.deepEqual(validateStep(answers, 2), {});
  for (const key of domainKeys) answers.future[key] = 'N/A';
  assert.equal(Object.keys(validateStep(answers, 3)).length, 5);
});

test('each rating group rejects bounds, fractions, and numeric strings without altering the other group', () => {
  for (const group of ['current', 'future']) {
    for (const invalid of [0, 11, 3.5, '5', null]) {
      const answers = completedAnswers();
      const other = group === 'current' ? 'future' : 'current';
      const original = structuredClone(answers[other]);
      answers[group].research = invalid;
      assert.ok(validateStep(answers, group === 'current' ? 2 : 3)[`${group}_research`]);
      assert.deepEqual(answers[other], original);
    }
  }
});

test('optional answers can remain empty, and a fully answered survey validates', () => {
  const answers = completedAnswers();
  assert.equal(answers.project, '');
  assert.equal(answers.comments, '');
  assert.deepEqual(validateAll(answers), {});
  assert.equal(Object.keys(validateAll(createAnswers())).length, 14);
});

test('payload preserves stable fields, independent numeric ratings, explicit N/A, and source labels', () => {
  const answers = completedAnswers();
  answers.current.surgical_intraoperative = 'N/A';
  answers.tools = ['chatgpt', 'other'];
  answers.other = '  Research assistant  ';
  answers.project = '  An education workflow  ';
  answers.comments = '  More clinical examples, please.  ';
  const before = structuredClone(answers);
  const payload = buildPayload(answers, metadata);
  assert.equal(payload.survey_version, SURVEY_VERSION);
  assert.equal(payload.submission_id, metadata.id);
  assert.equal(payload.submitted_at, metadata.timestamp);
  assert.equal(payload.ai_experience_key, 'not_yet_used');
  assert.match(payload.ai_experience, /I have not yet used AI tools/);
  assert.equal(payload.confidence, 1);
  assert.equal(payload.confidence_label, 'Not at all confident');
  assert.deepEqual(payload.selected_tools, ['ChatGPT', 'Other — please specify']);
  assert.equal(payload.other_tool, 'Research assistant');
  assert.equal(payload.primary_learning_goal_key, 'optimize_existing');
  assert.match(payload.primary_learning_goal, /Optimize existing tools/);
  assert.equal(payload.project_description, 'An education workflow');
  assert.equal(payload.additional_comments, 'More clinical examples, please.');
  assert.equal(payload.current_use_surgical_intraoperative, 'N/A');
  for (const key of domainKeys) {
    assert.equal(payload[`current_use_${key}`], answers.current[key]);
    assert.equal(payload[`future_interest_${key}`], answers.future[key]);
  }
  assert.deepEqual(answers, before);
  assert.equal(Object.keys(payload).filter(key => key.startsWith('current_use_')).length, 5);
  assert.equal(Object.keys(payload).filter(key => key.startsWith('future_interest_')).length, 5);
  assert.equal(Object.keys(payload).some(key => /coordinate|image|score|email|name|patient/i.test(key)), false);
});

test('payload excludes stale Other text and rejects any incomplete required answer', () => {
  const answers = completedAnswers();
  answers.other = 'stale text that was deselected';
  assert.equal(buildPayload(answers, metadata).other_tool, '');
  answers.future.research = null;
  assert.throws(() => buildPayload(answers, metadata), /Complete the required answers/);
});

test('endpoint requires a configured HTTPS Formspree form and blocks preview placeholders without dispatch', async () => {
  assert.equal(endpointConfigured(endpoint), true);
  const invalid = [null, undefined, '', 'https://formspree.io/f/YOUR_FORM_ID', 'https://formspree.io/f/PLACEHOLDER', 'http://formspree.io/f/abcdefgh', 'https://other.example/f/abcdefgh'];
  let requests = 0;
  for (const value of invalid) {
    assert.equal(endpointConfigured(value), false);
    await assert.rejects(submitSurvey(value, {}, async () => { requests++; return { ok: true }; }), /have not been sent/);
  }
  assert.equal(requests, 0);
});

test('submission sends exactly one JSON POST and confirms only after a successful response', async () => {
  const payload = buildPayload(completedAnswers(), metadata);
  const controller = new AbortController();
  const calls = [];
  const result = await submitSurvey(endpoint, payload, async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200 };
  }, controller.signal);
  assert.equal(result, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, endpoint);
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers.Accept, 'application/json');
  assert.equal(calls[0].options.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(calls[0].options.body), payload);
  assert.equal(calls[0].options.signal, controller.signal);
});

test('non-success responses, rate limits, and network errors never auto-retry or mutate answers', async () => {
  for (const failure of [400, 500, 429, 'network']) {
    const answers = completedAnswers();
    const originalAnswers = structuredClone(answers);
    const payload = buildPayload(answers, metadata);
    const originalPayload = structuredClone(payload);
    let requests = 0;
    await assert.rejects(submitSurvey(endpoint, payload, async () => {
      requests++;
      if (failure === 'network') throw new TypeError('Network request failed');
      return { ok: false, status: failure };
    }), failure === 429 ? /not confirmed.*wait a minute/i : failure === 'network' ? /Network request failed/ : /not confirmed/i);
    assert.equal(requests, 1, `failure ${failure} must require a deliberate new call to retry`);
    assert.deepEqual(answers, originalAnswers);
    assert.deepEqual(payload, originalPayload);
  }
});

test('a deliberate retry can succeed using the same submission metadata and original answers', async () => {
  const answers = completedAnswers();
  const payload = buildPayload(answers, metadata);
  let requests = 0;
  const fetcher = async () => ({ ok: ++requests === 2, status: requests === 1 ? 503 : 200 });
  await assert.rejects(submitSurvey(endpoint, payload, fetcher), /not confirmed/i);
  assert.equal(requests, 1);
  assert.equal(await submitSurvey(endpoint, payload, fetcher), true);
  assert.equal(requests, 2);
  assert.equal(payload.submission_id, metadata.id);
  assert.equal(payload.submitted_at, metadata.timestamp);
  assert.deepEqual(validateAll(answers), {});
});
