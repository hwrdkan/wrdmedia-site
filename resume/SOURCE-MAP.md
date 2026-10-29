# Resume source map and handoff

Owner: Howard Kan. Prepared by GPT on October 29, 2026.

## Authority

Current user request and Muse's `SHARED-DOCS/resumes-2026-10-28/gpt-handoff-interactive-resume-page-2026-10-29.md` in `hwrdkan/mission-control`.

Facts: `SHARED-DOCS/resumes-2026-10-28/final/Howard_Kan_Master_Resume.pdf`, the four final lane Visual PDFs and ATS DOCX files. Matching content baselines are `resume-MASTER-REVISED-2026-10-28.md` and `resume-targeted-{ai-enablement,lifecycle-crm,marketing-leadership,consulting}-REVISED-2026-10-28.md` in the parent source folder. Sources were downloaded from the live repository for this task. Extracted PDF and DOCX text is retained in the task's `resume-evidence` folder, outside this website checkout.

## Claim mapping

`content.json` is the editable page record. Each role, case study, system, and skill group has a `source` pointing to its section in the final Master PDF, matching the revised Master baseline. The generated HTML retains these references as `data-source` attributes. This supports review without adding source-control details to the visitor experience.

- Hero positioning, AI direction method, location and work geography: Master, Profile and contact header. Email: explicit October 29 confirmation recorded in Muse's handoff.
- Titles, companies, dates and role bullets: Master, Experience. Media Distribution Solutions is 2017; roles with overlapping dates remain concurrent.
- Proof cards: Master, Selected Systems and Programs, Experience/full-lifecycle program, Client Engagements, and Conversational AI Depth.
- System descriptions: Master, Selected Systems and Programs and Experience/The Bauer Group.
- Skills: Master, Skill Architecture and Tools and Methods; media capabilities also trace to Experience/GOODTV, Dwindle Distribution and WRD Media.
- Education and languages: separate Master sections with those names.
- JSON-LD: contact header, Profile, Skill Architecture, Education and Languages. No programming or engineering title. No invented birth date, awards or credentials.
- Lane priorities: the corresponding final lane resume's proof and career sections. Additional proof remains available in every lane. The consulting timeline uses WRD Media first to frame independent engagements; this is an editorial ordering choice, not a new role or date.
- Existing portrait and WRD mark reused from this site's assets. No new project screenshots or testimonial images created.

## Implementation

Buildless static HTML, CSS and JavaScript. Run `python resume/build.py` after content/template changes. It generates `index.html`, `resume.js`, and `lanes.json` from `content.json` and `resume.template.js`. Runtime makes no content/API requests. All facts and downloads remain present without JavaScript; ordering/filtering are enhancements. Native buttons and details provide keyboard controls. Lanes can be shared using `?lane=ai`, `crm`, `marketing`, or `consulting`.

Existing fonts, black/silver/bronze palette, portrait and logo retained. No new libraries, analytics, storage, contact submissions, or authentication changes.

Print expands all role/case details, shows all skills, removes screenshot placeholders, download menus and controls, then restores reading state after printing. The supplied final PDFs remain the application versions.

## Deployment gate

Staging only is authorized. Production `main`, live site navigation, sitemap, and indexing policy must remain unchanged until Howard approves. Resume meta and existing HTTP noindex header remain in place. Indexing and adding a navigation link are separate choices for Howard after approval.

Direct Wrangler Pages access was unavailable because the existing OAuth login lacks Pages scopes. Authentication was not changed. Use the existing repository Cloudflare Pages integration with a non-production preview branch.

## Assumptions

- AI Enablement is the default focus; visitors can select all four lanes.
- Preserve all supplied Present dates as written in the final resumes rather than infer employment changes.
- Use the existing site portrait and brand assets.
- Consulting timeline order is editorial; the date-order control restores a newest-start-first view. No ordering is implied between the two 2026 starts because Bauer has no month in the source.
- No rates, salary expectations, testimonials, private application links, or additional project claims are needed for this page.

## Gaps left unfilled

- Project screenshots, approved public demos, and product URLs are absent from the final resumes. Screenshot spaces remain labeled placeholders; no invented interfaces or unverified demo links.
- No measured lead volumes, conversion lift, revenue impact, cost savings, or hours saved. No numeric outcome claims added.
- No team/network counts, Bauer usage/adoption counts, or formal AI/CRM certifications.
- No exact Air AI implementation date or EverBlade engagement dates.
- No written testimonial quote. A statement that a reference is available was not converted into an endorsement.
