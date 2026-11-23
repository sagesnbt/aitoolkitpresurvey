# AI for Surgeons — Pre-Course Survey

A static, mobile-friendly survey for **Building Your AI Toolkit: A Hands-On AI Course for Surgeons**. Participants open a regular URL without an account or app installation. [Course information](https://www.sages.org/course-info/?courseID=97).

The application has no runtime dependencies, build step, custom backend, analytics, or private API credentials. All application assets are included and use relative URLs so they work at a GitHub Pages repository subpath. This package is ready for local preview; it has **not been published**.

## Preview and checks

Install Node.js 18 or later, extract the delivery ZIP, and open a terminal in this folder:

```sh
npm start
```

Open [http://127.0.0.1:4173/survey/](http://127.0.0.1:4173/survey/). The `/survey/` prefix exercises a repository-style subpath. The root URL also works. Set `PORT` if 4173 is occupied. Stop the server with Ctrl+C. No `npm install` is needed, and Node is used only for local preview and tests; GitHub Pages serves the files directly.

```sh
npm test
```

See [VERIFICATION.md](VERIFICATION.md) for checks performed and remaining launch setup. Opening `index.html` directly with a `file:` URL is not the supported preview method because the application uses JavaScript modules.

## Configure Formspree

1. Create a Formspree account and a new form. Configure the course directors' notification recipient in Formspree, and complete any email verification or form activation requested by the dashboard.
2. Copy the form's public endpoint. Replace the **one configuration value** in `config.js`:

   ```js
   export const FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";
   ```

   Substitute the real form ID for `YOUR_FORM_ID`. This endpoint is public; do not add account passwords, API keys, or CAPTCHA secret keys to the repository.
3. Check spam and CAPTCHA settings in Formspree. For an uninterrupted browser-side flow, configure a supported on-page CAPTCHA if the form requires one, or select the form's appropriate CAPTCHA setting in the dashboard. Adding a CAPTCHA requires its public widget/token integration in the application; this package does not include one. Never place its secret key in the site. See [Formspree CAPTCHA settings](https://help.formspree.io/articles/form-and-project-settings/recaptcha-settings).
4. If using **Restrict to Domain**, enter the final published hostname, such as `your-account.github.io`, without protocol or repository path. Local preview or a different hostname may then be treated as spam. Keep the cross-origin referrer available; `no-referrer` and `same-origin` policies can cause submissions to be marked as spam. See [Formspree domain restrictions](https://help.formspree.io/articles/form-and-project-settings/restrict-to-domain).

The app sends a JSON `POST` with `Accept: application/json` and `Content-Type: application/json`. It displays success only for a successful HTTP response, disables submission while a request is pending, and preserves answers after a failure. A missing or placeholder endpoint permits local review but cannot submit. There are no automatic retries; participants deliberately select Retry. See [Formspree's manual fetch example](https://formspree.io/blog/formspree-ajax/) and [current AJAX documentation](https://help.formspree.io/articles/building-your-form/submit-forms-with-javascript-ajax).

Formspree imposes account-plan submission limits and a system limit of 20 posts per minute per form. A 429 response displays a wait-and-retry message. Do not load-test the live endpoint. See [official limits](https://help.formspree.io/articles/form-and-project-settings/system-limits).

## Publish on GitHub Pages

Put the **contents of this folder**, including hidden `.github` and `.nojekyll` files, at the root of the destination repository. `index.html` should be at the repository root, not inside an extra `ai-surgeons-survey` folder. Keep real responses, exports, participant details, and private credentials out of the repository.

For the included workflow:

1. Push the files to the repository's `main` branch.
2. In GitHub, open **Settings → Pages → Build and deployment → Source**, and select **GitHub Actions**.
3. The included `.github/workflows/pages.yml` publishes on pushes to `main` and supports manual **Actions → Deploy to GitHub Pages → Run workflow**. If your default branch has another name, update the workflow's branch setting.
4. When deployment succeeds, use the URL shown in **Settings → Pages**. A project URL is normally `https://your-account.github.io/your-repository/`. Open that URL on a phone and refresh it before sharing.

Alternatively, disable the included deployment workflow, choose **Deploy from a branch**, select `main` and **/(root)**, and save. Keep `.nojekyll` at the root. Use one publishing method; the included custom workflow is intended for the GitHub Actions source setting. [GitHub's publishing-source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) cover both options.

GitHub Pages requires no Node server. The survey uses a single page, so refreshing the published root or repository URL loads the application normally. GitHub Pages sites are public; the site contains only survey code and content.

## Content and data model

The supplied source was `AI_for_Surgeons_Pre_Course_Survey.docx`; no PDF or sketch was supplied. The DOCX provides the eight questions, choices, examples, and anchors. The user's implementation request controls behavior: in particular, Q5 uses the **past 30 days**. The circular profiles follow the prompt's five-spoke description.

- Edit `survey-data.js` for the course title/link, questions, choices, domain examples, colors, and `SURVEY_VERSION`. Increase the version when survey meaning or response coding changes.
- `model.js` defines initial answers, validation, payload field names, and submission. Keep stable keys when editing display wording. Changing keys or scales requires coordinated changes to validation, exports, and meaningful tests.
- `app.js` implements the guided flow; `charts.js` renders the two independent radial profiles; `styles.css` includes mobile and print layouts. Keep asset imports relative.
- Q1–Q6 are required. Q5 ratings are integers 1–10 or explicit `"N/A"`; Q6 ratings are integers 1–10. Unconfirmed slider positions remain unanswered. Q7–Q8 are optional. Profiles are descriptive and do not calculate a score or improvement outcome.

Submitted JSON fields:

| Fields | Meaning |
| --- | --- |
| `survey_version`, `submission_id`, `submitted_at` | Survey version, client-generated submission identifier, and ISO timestamp from the first submission attempt |
| `ai_experience`, `ai_experience_key` | Readable experience choice and stable key |
| `confidence`, `confidence_label` | Integer 1–5 and its labeled anchor |
| `selected_tools`, `other_tool` | Array of readable tool choices; trimmed Other description when selected |
| `primary_learning_goal`, `primary_learning_goal_key` | Readable binary goal choice and stable key |
| `current_use_<domain>` | Each original current-use rating, numeric 1–10 or `"N/A"` |
| `future_interest_<domain>` | Each original future-interest rating, numeric 1–10 |
| `project_description`, `additional_comments` | Optional trimmed text; empty string when unanswered |

The five `<domain>` keys are `surgical_intraoperative`, `clinical_outside_or`, `research`, `education_communication`, and `entrepreneurship`. Chart coordinates and images are not submitted. A deliberate retry reuses the submission ID; this identifier helps directors recognize duplicates but does not guarantee server-side deduplication.

## Privacy, responses, and launch check

Answers stay in memory in the active tab and are sent only after Submit. Back navigation preserves them; refreshing or closing the tab clears them. Profiles remain available after successful submission and can be printed or saved as PDF using the participant's browser. There is no persistent browser storage, response URL, console logging of responses, or public dashboard.

Do not enter patient-identifying or confidential information. Names and email addresses are not requested, but the app does **not** promise anonymity; Formspree processes submissions and directors receive their contents. Keep participant details and response exports outside this public source package and repository.

Directors access responses in the configured form's **Submissions** tab in Formspree and through the form's configured notifications. CSV/JSON export availability depends on the Formspree plan. See [Formspree export instructions](https://help.formspree.io/articles/form-and-project-settings/exporting-submissions/).

**Before launch, perform an end-to-end submission from the final published URL using a clearly labeled synthetic response.** Check the confirmation, all ten original ratings including a Q5 N/A, selected tools and Other text, optional text, version/ID/timestamp, spam inbox, dashboard receipt, and intended notification delivery. Also test the retry flow with a disconnected network. No live Formspree endpoint, dashboard receipt, or email delivery has been verified for this delivery. Local and mocked tests cannot establish those results.
