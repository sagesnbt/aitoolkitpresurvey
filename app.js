import { FORMSPREE_ENDPOINT } from './config.js';
import { COURSE_TITLE, experienceOptions, confidenceOptions, toolOptions, goalOptions, domains, questions, projectInstruction, commentsInstruction, profileExplanation } from './survey-data.js';
import { createAnswers, toggleTool, isRating, validateStep, validateAll, buildPayload, submitSurvey } from './model.js';
import { profileSvg } from './charts.js';

const app = document.querySelector('#app');
const answers = createAnswers();
let step = 0, errors = {}, sending = false, sent = false, submissionError = '', metadata = null;
const steps = ['Welcome', 'Your starting point', 'Current AI use', 'Future interests', 'Projects & comments', 'Review & submit'];
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const checked = condition => condition ? ' checked' : '';
const announce = message => { document.querySelector('#announcer').textContent = message; };
const errorFor = key => `<p class="field-error" id="${key}-error"${errors[key] ? '' : ' hidden'}>${errors[key] || ''}</p>`;
const description = (key, hint = '') => `aria-describedby="${hint ? hint + ' ' : ''}${key}-error"${errors[key] ? ' aria-invalid="true"' : ''}`;

function welcome() {
  return `<main id="main" class="welcome" tabindex="-1">
    <div class="welcome-copy"><p class="eyebrow">A starting point for your course</p><h1>${COURSE_TITLE}</h1>
      <p class="subtitle">Pre-Course Survey</p><p class="welcome-intro">Help us tailor the course to your experience and goals. No prior coding experience is required.</p>
      <button class="button primary" data-action="start">Begin survey</button><p class="small-note">8 questions · Your perspective across 5 domains</p>
    </div>
    <aside class="welcome-art" aria-label="The five survey domains"><p class="eyebrow">Your work. Your possibilities.</p>${profileSvg(null, 'welcome', true)}
      <p class="art-caption">Five domains.<br><em>One toolkit shaped around you.</em></p>
    </aside>
    <div class="welcome-bottom"><div><h2>Start with your experience</h2><p>Share the tools you use, the areas you want to explore, and the ideas you might bring to the course.</p></div>
      <div><h2>Your responses</h2><p>Responses will be sent to the course directors through Formspree when you select Submit. Please do not enter patient-identifying or confidential information.</p><p class="small-note">Your answers stay in this tab during the survey. Closing or refreshing it clears them.</p></div></div>
  </main>`;
}
function navigation() {
  return `<aside class="survey-rail" aria-label="Survey sections"><p class="eyebrow">Pre-Course Survey</p><ol>${steps.slice(1).map((label, i) => `<li class="${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}"${step === i + 1 ? ' aria-current="step"' : ''}><span class="step-number">${step > i + 1 ? '✓' : i + 1}</span><span>${label}</span></li>`).join('')}</ol><p class="rail-note">A clearer picture of where you are, and where you want to go.</p></aside>`;
}
function questionHeader(number, key, instruction) {
  return `<legend><span class="question-number">Question ${number}</span>${questions[key]}</legend><p class="field-hint" id="${key}-hint">${instruction}</p>`;
}
function radioOptions(name, options) {
  return options.map(([key, title, text]) => `<label class="option"><input type="radio" name="${name}" value="${key}" required${checked(answers[name] === key)} ${description(name, `${name}-hint`)}><span><strong>${title}</strong>${text ? `<span class="option-description">${text}</span>` : ''}</span></label>`).join('');
}
function toolsMarkup() {
  return `<div class="tool-counter" role="status" aria-live="polite">${answers.tools.length} of 5 selected</div><div class="tool-grid">${toolOptions.map(([key, label]) => `<label class="option tool-option ${key === 'none' || key === 'institution_specific' ? 'span-two' : ''}"><input type="checkbox" name="tools" value="${key}" id="tool-${key}"${checked(answers.tools.includes(key))} aria-describedby="tools-hint tools-error tool-limit"><span>${label}</span></label>`).join('')}</div>
    <p id="tool-limit" class="field-error" role="status" aria-live="polite"></p>
    <div class="other-field"${answers.tools.includes('other') ? '' : ' hidden'}><label for="other">Other AI tool <span class="required-word">(required)</span></label><input id="other" name="other" type="text" value="${esc(answers.other)}" autocomplete="off" ${description('other')}>${errorFor('other')}</div>`;
}
function experienceStep() {
  return `<p class="eyebrow">Your starting point</p><h1 id="step-heading" tabindex="-1">A little about your experience</h1><p class="section-intro">Tell us how AI fits into your work today, and what brings you here. All four questions are required.</p>
    <fieldset id="experience-field">${questionHeader(1, 'experience', 'Select the highest level you can comfortably perform.')}<div class="option-stack">${radioOptions('experience', experienceOptions)}</div>${errorFor('experience')}</fieldset>
    <fieldset id="confidence-field">${questionHeader(2, 'confidence', 'Select one.')}<div class="confidence-grid">${confidenceOptions.map((label, i) => `<label class="confidence-option"><input type="radio" name="confidence" value="${i + 1}" required${checked(answers.confidence === i + 1)} ${description('confidence', 'confidence-hint')}><span><b>${i + 1}</b>${label}</span></label>`).join('')}</div>${errorFor('confidence')}</fieldset>
    <fieldset id="tools-field">${questionHeader(3, 'tools', 'Select up to five. If you have used fewer than five, select all that apply. The no-recent-use option must be selected on its own.')}<div id="tools-controls">${toolsMarkup()}</div>${errorFor('tools')}</fieldset>
    <fieldset id="goal-field">${questionHeader(4, 'goal', 'Select one, even if both interest you.')}<div class="option-stack">${radioOptions('goal', goalOptions)}</div>${errorFor('goal')}</fieldset>`;
}
function ratingCard(domain, group) {
  const value = answers[group][domain.key], na = value === 'N/A', selected = isRating(value);
  const id = `${group}_${domain.key}`, sliderValue = selected ? value : 5;
  const low = group === 'current' ? 'Never' : 'Not at all interested';
  const high = group === 'current' ? 'For nearly every relevant task' : 'Extremely interested';
  return `<fieldset class="rating-card" id="${id}-field" style="--domain-color:${domain.color};--domain-pale:${domain.pale}">
    <legend id="${id}-label"><span class="domain-dot"></span>${domain.name}</legend><p class="domain-examples" id="${id}-examples">${domain.examples}</p>
    <div class="rating-top"><span class="rating-state ${selected ? 'answered' : ''}" id="${id}-state" aria-live="polite">${na ? 'Not applicable' : selected ? `Selected: ${value} / 10` : 'Unanswered'}</span>${group === 'current' ? `<label class="na-option"><input type="checkbox" name="na" data-group="${group}" data-key="${domain.key}"${checked(na)} aria-label="Not applicable: ${domain.name}">Not applicable</label>` : ''}</div>
    <div class="slider-controls"><input type="range" min="1" max="10" step="1" value="${sliderValue}" id="${id}-range" name="rating" data-group="${group}" data-key="${domain.key}" aria-labelledby="${id}-label" aria-describedby="${id}-examples ${id}-anchors ${id}-state ${id}-error"${errors[id] ? ' aria-invalid="true"' : ''} aria-valuetext="${na ? 'Not applicable' : selected ? `${value} out of 10` : 'Unanswered; thumb at 5. Adjust or use Confirm 5 to answer.'}"${na ? ' disabled' : ''} style="--fill:${(sliderValue - 1) / 9 * 100}%">
      <div class="precise-rating"><label class="sr-only" for="${id}-number">${domain.name}: exact ${group === 'current' ? 'current-use' : 'future-interest'} rating, 1 to 10</label><input type="number" min="1" max="10" step="1" inputmode="numeric" id="${id}-number" name="exact-rating" data-group="${group}" data-key="${domain.key}" value="${selected ? value : ''}" placeholder="—" aria-describedby="${id}-state ${id}-error"${na ? ' disabled' : ''}><span>/ 10</span></div></div>
    <div class="scale-anchors" id="${id}-anchors"><span>1 · ${low}</span><span>10 · ${high}</span></div>
    <button type="button" class="confirm-rating" data-action="confirm-rating" data-group="${group}" data-key="${domain.key}" aria-label="Confirm ${sliderValue} out of 10 for ${domain.name}"${na ? ' disabled' : ''}>Confirm ${sliderValue}</button>${errorFor(id)}
  </fieldset>`;
}
function ratingsStep(group) {
  const current = group === 'current';
  return `<p class="eyebrow">Question ${current ? '5' : '6'} · ${current ? 'Current AI use' : 'Future learning interests'}</p><h1 id="step-heading" tabindex="-1">${current ? 'Where are you now?' : 'Where would you like to go?'}</h1>
    <h2 class="section-question">${questions[group]}</h2><p class="section-intro">${current ? '<strong>Think about the past 30 days.</strong> Rate each area from 1 = Never to 10 = For nearly every relevant task. Select N/A if the area is not part of your work.' : 'Consider both improving your use of existing tools and creating new tools. Rate each area from 1 = Not at all interested to 10 = Extremely interested.'}</p>
    <p class="rating-instruction">Each area needs an answer. Move a slider, enter a number, or select <strong>Confirm 5</strong> to choose its starting position. An untouched slider is unanswered.</p>
    <div class="rating-list">${domains.map(d => ratingCard(d, group)).join('')}</div>`;
}
function commentsStep() {
  return `<p class="eyebrow">Questions 7 & 8 · Optional</p><h1 id="step-heading" tabindex="-1">Ideas to bring with you</h1><p class="section-intro">Have a project to share, or something else on your mind? You can also leave both questions blank.</p>
    <div class="text-question"><label for="project"><span class="question-number">Question 7 · Optional</span>${questions.project}</label><p id="project-hint" class="field-hint">${projectInstruction}</p><textarea id="project" name="project" rows="6" aria-describedby="project-hint" autocomplete="off">${esc(answers.project)}</textarea></div>
    <div class="text-question"><label for="comments"><span class="question-number">Question 8 · Optional</span>${questions.comments}</label><p id="comments-hint" class="field-hint">${commentsInstruction}</p><textarea id="comments" name="comments" rows="5" aria-describedby="comments-hint" autocomplete="off">${esc(answers.comments)}</textarea></div>
    <p class="privacy-reminder">Please do not include patient-identifying or confidential information.</p>`;
}
const optionLabel = (options, key) => { const o = options.find(o => o[0] === key); return o ? `${o[1]}${o[2] ? ': ' + o[2] : ''}` : 'Unanswered'; };
function profiles() {
  return `<section class="profiles-section" aria-label="Your circular profiles"><div class="profiles"><article class="profile-card"><p class="eyebrow">Current AI use</p><h2>Where I am now</h2>${profileSvg(answers.current, 'current')}<p class="chart-footnote">Past 30 days · N/A leaves a spoke unfilled</p></article><article class="profile-card"><p class="eyebrow">Future learning interests</p><h2>Where I want to go</h2>${profileSvg(answers.future, 'future')}<p class="chart-footnote">Using existing tools and building new ones</p></article></div>
    <p class="profile-explanation">${profileExplanation} Each spoke is an independent rating on the same 0–10 radius; zero is a visual origin, not a survey answer.</p>
    <div class="rating-table-wrap"><table class="rating-table"><caption>All domain ratings · 1–10</caption><thead><tr><th scope="col">Domain</th><th scope="col">Current use</th><th scope="col">Future interest</th></tr></thead><tbody>${domains.map(d => `<tr><th scope="row"><span class="domain-dot" style="background:${d.color}"></span>${d.name}</th><td>${esc(answers.current[d.key] ?? 'Unanswered')}</td><td>${esc(answers.future[d.key] ?? 'Unanswered')}</td></tr>`).join('')}</tbody></table></div>
    <p class="small-note legend-note">Current use: 1 = Never; 10 = For nearly every relevant task. N/A = Not applicable.<br>Future interest: 1 = Not at all interested; 10 = Extremely interested.</p>
  </section>`;
}
function editButton(target, label) { return sent ? '' : `<button type="button" class="text-button" data-action="edit" data-step="${target}"${sending ? ' disabled' : ''}>Edit ${label}</button>`; }
function answerSummary() {
  return `<section class="answer-summary" aria-labelledby="answers-heading"><div class="summary-heading"><h2 id="answers-heading">Your answers</h2>${editButton(1, 'questions 1–4')}</div><dl>
    <div><dt>1. AI experience</dt><dd>${esc(optionLabel(experienceOptions, answers.experience))}</dd></div>
    <div><dt>2. Confidence</dt><dd>${answers.confidence} — ${esc(confidenceOptions[answers.confidence - 1])}</dd></div>
    <div><dt>3. Frequently used tools</dt><dd>${answers.tools.map(k => esc(toolOptions.find(o => o[0] === k)[1])).join('; ')}${answers.tools.includes('other') ? `<br>Other: ${esc(answers.other)}` : ''}</dd></div>
    <div><dt>4. Primary learning goal</dt><dd>${esc(optionLabel(goalOptions, answers.goal))}</dd></div>
    </dl><div class="summary-edit-row">${editButton(2, 'current use')}${editButton(3, 'future interests')}</div>
    <div class="summary-heading"><h2>Projects & comments</h2>${editButton(4, 'questions 7–8')}</div><dl>
    <div><dt>7. Project or workflow</dt><dd class="preserve-lines">${esc(answers.project) || 'Not provided'}</dd></div><div><dt>8. Additional comments</dt><dd class="preserve-lines">${esc(answers.comments) || 'Not provided'}</dd></div></dl></section>`;
}
function reviewStep() {
  return `<p class="eyebrow">${sent ? 'Survey complete' : 'Review & submit'}</p><h1 id="step-heading" tabindex="-1">${sent ? 'Thank you for sharing.' : 'Your AI toolkit, in perspective.'}</h1>
    ${sent ? `<div class="success-message" role="status"><strong>Your survey was submitted successfully.</strong><p>Formspree accepted your responses for the course directors. Your profiles are still available below.</p><p class="small-note">Submission ID: ${esc(metadata.id)}</p></div>` : '<p class="section-intro">Review your responses and the two profiles they create. You can edit any section before submitting.</p>'}
    <div class="print-title"><p>${COURSE_TITLE}</p><p>Pre-Course Survey · Participant profiles</p></div>
    ${profiles()}<button type="button" class="button secondary print-button" data-action="print">Print / save as PDF</button>${answerSummary()}
    ${sent ? '' : `<div class="submission-notice"><p>When you select Submit, your responses will be sent to the course directors through Formspree. Please check that you have not included patient-identifying or confidential information.</p><p class="small-note">Your answers stay in memory in this tab. Closing or refreshing clears them.</p></div><div class="submission-error" id="submission-error" role="alert"${submissionError ? '' : ' hidden'}><strong>Submission not confirmed</strong><p>${esc(submissionError)}</p><p>Your answers are preserved in this tab. Please keep it open.</p></div>`}`;
}
function render(focus = true) {
  if (!step) { app.innerHTML = welcome(); if (focus) document.querySelector('#main').focus(); return; }
  const content = step === 1 ? experienceStep() : step === 2 ? ratingsStep('current') : step === 3 ? ratingsStep('future') : step === 4 ? commentsStep() : reviewStep();
  app.innerHTML = `<div class="survey-layout ${step === 5 ? 'review-layout' : ''}">${navigation()}<main id="main" class="survey-main" tabindex="-1"><div class="progress-row"><span>${sent ? 'Complete' : `Step ${step} of 5`}</span><span>${sent ? '100%' : `${step * 20}%`}</span></div><progress max="5" value="${step}" aria-label="Survey progress">${step} of 5</progress>
    <form id="survey-form" novalidate aria-busy="${sending}">${Object.keys(errors).length ? `<div class="validation-summary" role="alert" tabindex="-1">Please complete the highlighted answers below.</div>` : ''}${content}
    ${sent ? '' : `<div class="form-navigation"><button type="button" class="button secondary" data-action="back"${sending ? ' disabled' : ''}>Back</button><span class="navigation-note">${step === 4 ? 'Both questions are optional' : step === 5 ? 'Send when you’re ready' : 'Required answers'}</span><button type="submit" class="button primary"${sending ? ' disabled' : ''}>${sending ? '<span class="spinner" aria-hidden="true"></span>Submitting…' : step === 5 ? submissionError ? 'Retry submission' : 'Submit survey' : 'Continue'}</button></div>`}</form></main></div>`;
  if (focus) {
    (document.querySelector('.validation-summary') || document.querySelector('#step-heading')).focus();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
}
function go(next) { step = next; errors = {}; submissionError = ''; render(); }
function syncRating(group, key, value, source) {
  answers[group][key] = value;
  const id = `${group}_${key}`, numeric = document.querySelector(`#${id}-number`), range = document.querySelector(`#${id}-range`), status = document.querySelector(`#${id}-state`), confirm = document.querySelector(`#${id}-field .confirm-rating`);
  if (isRating(value)) {
    range.value = value;
    range.style.setProperty('--fill', `${(value - 1) / 9 * 100}%`);
    range.setAttribute('aria-valuetext', `${value} out of 10`);
    if (source !== numeric) numeric.value = value;
    status.textContent = `Selected: ${value} / 10`; status.classList.add('answered');
    confirm.textContent = `Confirm ${value}`; confirm.setAttribute('aria-label', `Confirm ${value} out of 10 for ${domains.find(d => d.key === key).name}`);
    document.querySelector(`#${id}-error`).hidden = true;
    numeric.removeAttribute('aria-invalid'); range.removeAttribute('aria-invalid');
  } else {
    status.textContent = 'Unanswered'; status.classList.remove('answered');
    range.setAttribute('aria-valuetext', `Unanswered; thumb at ${range.value}. Adjust or confirm to answer.`);
  }
}
app.addEventListener('input', event => {
  if (sending || sent) return;
  const el = event.target;
  if (el.name === 'rating') syncRating(el.dataset.group, el.dataset.key, Number(el.value), el);
  if (el.name === 'exact-rating') syncRating(el.dataset.group, el.dataset.key, el.value !== '' && isRating(Number(el.value)) ? Number(el.value) : null, el);
  if (['other', 'project', 'comments'].includes(el.name)) answers[el.name] = el.value;
});
app.addEventListener('change', event => {
  if (sending || sent) return;
  const el = event.target;
  if (['experience', 'goal'].includes(el.name)) answers[el.name] = el.value;
  if (el.name === 'confidence') answers.confidence = Number(el.value);
  if (el.name === 'tools') {
    const previous = answers.tools;
    answers.tools = toggleTool(previous, el.value, el.checked);
    const overLimit = el.checked && !answers.tools.includes(el.value);
    document.querySelector('#tools-controls').innerHTML = toolsMarkup();
    document.querySelector(`#tool-${el.value}`).focus({ preventScroll: true });
    if (overLimit) document.querySelector('#tool-limit').textContent = 'Five tools are already selected. Deselect one before adding another.';
    if (el.value === 'none' && el.checked) announce('No recent AI use selected. Other tool selections cleared.');
  }
  if (el.name === 'na') {
    answers.current[el.dataset.key] = el.checked ? 'N/A' : null;
    const domain = domains.find(d => d.key === el.dataset.key);
    document.querySelector(`#current_${el.dataset.key}-field`).outerHTML = ratingCard(domain, 'current');
    document.querySelector(`#current_${el.dataset.key}-field .na-option input`).focus({ preventScroll: true });
    announce(`${domain.name}: ${el.checked ? 'Not applicable' : 'Unanswered. Please choose or confirm a rating.'}`);
  }
});
app.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled || sending) return;
  switch (button.dataset.action) {
    case 'start': go(1); break;
    case 'back': go(step - 1); break;
    case 'edit': go(Number(button.dataset.step)); break;
    case 'print': window.print(); break;
    case 'confirm-rating': {
      const { group, key } = button.dataset;
      const value = Number(document.querySelector(`#${group}_${key}-range`).value);
      syncRating(group, key, value); announce(`${domains.find(d => d.key === key).name}: ${value} out of 10 confirmed.`); break;
    }
  }
});
app.addEventListener('submit', async event => {
  event.preventDefault();
  if (sending || sent) return;
  errors = step === 5 ? validateAll(answers) : validateStep(answers, step);
  if (Object.keys(errors).length) {
    if (step === 5) step = Object.keys(validateStep(answers, 1)).length ? 1 : Object.keys(validateStep(answers, 2)).length ? 2 : 3;
    render(); return;
  }
  if (step < 5) { go(step + 1); return; }
  metadata ||= { id: crypto.randomUUID ? crypto.randomUUID() : `survey-${Date.now()}-${Math.random().toString(36).slice(2)}`, timestamp: new Date().toISOString() };
  sending = true; submissionError = ''; render(false); announce('Submitting your survey.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    await submitSurvey(FORMSPREE_ENDPOINT, buildPayload(answers, metadata), globalThis.fetch, controller.signal);
    sent = true; announce('Survey submitted successfully. Your profiles remain available.');
  } catch (error) {
    submissionError = error.message.startsWith('Submission') ? error.message : 'We could not confirm submission. Check your connection and retry when you are ready.';
  } finally {
    clearTimeout(timeout); sending = false; render(sent);
    if (!sent) document.querySelector('#submission-error').scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
});
render(false);
