# Verification record

Verified November 23, 2026. This delivery contains a working static application, a local preview server, automated tests, and a GitHub Pages workflow. No public deployment or live Formspree submission was performed.

## Automated checks

`npm test` passes **22 tests** with Node.js 24.15.0. No dependencies or build installation are needed.

- All initial choices and ten domain answers are unanswered, with independent current/future state.
- Required Q1–Q6 validation; integer rating bounds; Q5-only literal `N/A`; optional Q7–Q8.
- Five distinct tools maximum, exclusive no-recent-use option, and required trimmed Other text.
- Readable stable payload fields, numeric values, explicit N/A, and unchanged submission metadata on deliberate retry.
- Placeholder endpoint blocks any request. Mocked 2xx, 400, 500, 429, and network failures confirm success/failure semantics with no automatic retry.
- Both charts use equally spaced tracks, the same center/order/colors/orientation, and radii proportional to ratings on a 0–10 mapping. N/A and unanswered values never create a recorded zero segment.
- Chart labels, accessible descriptions, and decorative-chart hiding.

JavaScript syntax checks pass. The local preview returns HTTP 200 at `/survey/`, exercising relative asset loading under a repository subpath.

## Browser checks

Checked the actual app in the in-app browser at desktop width and **320px** mobile width:

- Full welcome title, course link, Formspree notice, confidentiality reminder, and no preselected Q1/Q2 choices.
- Incomplete answers show inline errors and move focus to the error summary.
- Sixth tool selection is rejected with a visible explanation and count; no-recent-use clears other selections; Other reveals its required input.
- Untouched sliders block Continue. Confirming the visible starting value records it deliberately. Keyboard arrows, pointer dragging, and numeric entry update the displayed response. Fractional entry is rejected.
- Q5 N/A disables its slider, number input, and confirmation control; clearing N/A returns the domain to unanswered.
- Q6 starts unanswered independently. Back navigation preserves ratings. Optional text can remain blank.
- Review edits return to the chosen section; updated ratings appear in the previews and complete domain table. SVG data verified for ratings 3, 5, 6, 10 and N/A against expected radii.
- Mobile profiles stack; desktop profiles sit side by side. A 320px DOM width check shows no horizontal overflow. Scale endpoint text is 14px and range/numeric controls have 44px heights.
- The shipped placeholder endpoint gives an explicit unconfirmed-submission message, with all answers preserved.

A separate temporary local QA fixture used the unchanged application files with a **mocked fetch** and a synthetic endpoint. It is outside the delivered source and was never connected to Formspree. In that fixture, pending submission disabled the Submit and navigation controls and dispatched one request. A mocked 500 preserved the answers without retrying; an explicit retry followed by a mocked 200 showed success and retained profiles/table/print access. No real responses were transmitted.

## Print and verification limits

The Print / save as PDF control invokes the browser print action. The print stylesheet hides navigation, submission controls, and optional prose responses; it includes both profiles, course title, full domain rating table, N/A, scale anchors, and the interpretation notice. A synthetic fixture rendered with that same print stylesheet was visually inspected for clipping and overlap. Native print-dialog/PDF pagination could not be fully inspected through the available in-app browser; confirm the final PDF on the launch browser.

Pointer dragging, keyboard, and responsive viewport behavior were verified. A physical iOS/Android touchscreen and a screen-reader walkthrough were not available. Native range controls, explicit labels/descriptions, focus styling, live rating announcements, a text table, and reduced-motion support are included.

## Remaining launch setup

1. Set the one `FORMSPREE_ENDPOINT` value in `config.js` to the real, activated form endpoint. Check recipients, spam/CAPTCHA settings, submission limits, and any domain restrictions.
2. Publish the folder contents as a repository root using the included GitHub Pages workflow or the README's branch instructions. No repository or hosting destination was supplied for this delivery.
3. From the final published URL, perform a clearly labeled synthetic end-to-end submission and verify the complete fields, original numeric/N/A values, Formspree dashboard receipt, and intended notifications. **Dashboard receipt and email delivery are unverified.**
4. Check the published URL and refresh on a phone, print/save the final profiles to PDF, and confirm physical touch behavior before sharing with participants.

The supplied survey source was the Word document named in the request. No PDF or reference sketch was supplied. All eight questions, answer choices, domain examples, and anchors were preserved from the Word document; Q5's past-30-days instruction follows the controlling implementation request. No additional survey questions or scores were added.
