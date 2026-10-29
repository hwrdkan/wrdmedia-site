(() => {
  'use strict';
  const lanes = {"ai": {"label": "AI Enablement", "headline": "AI enablement. Systems. Adoption.", "focus": "Assistants, agentic workflows, source-grounded support, and the training that helps teams use them.", "roles": ["bauer", "agency", "courts", "healthy", "mds", "goodtv", "dwindle", "wrd"], "proof": ["mentor", "training", "intake", "visual", "recruiting", "lifecycle", "voice", "search", "leadership", "network"], "skills": ["ai", "crm", "growth", "media"]}, "crm": {"label": "Lifecycle & CRM", "headline": "Lifecycle marketing. CRM. Revenue operations.", "focus": "The complete GoHighLevel journey: acquisition, qualification, booking, nurture, retention, re-engagement, and referral.", "roles": ["courts", "healthy", "bauer", "agency", "mds", "goodtv", "dwindle", "wrd"], "proof": ["lifecycle", "recruiting", "intake", "mentor", "visual", "voice", "training", "search", "leadership", "network"], "skills": ["crm", "ai", "growth", "media"]}, "marketing": {"label": "Marketing Leadership", "headline": "Marketing leadership. Organic growth. Content.", "focus": "Organic lead generation across Facebook, Instagram, LinkedIn, and email, with W-2 team and nationwide creator-network leadership.", "roles": ["healthy", "courts", "bauer", "agency", "mds", "goodtv", "dwindle", "wrd"], "proof": ["recruiting", "search", "lifecycle", "leadership", "network", "intake", "mentor", "training", "visual", "voice"], "skills": ["growth", "media", "crm", "ai"]}, "consulting": {"label": "Consulting", "headline": "Fractional AI & growth consulting.", "focus": "Discovery, systems, documentation, and team training delivered as one engagement, with adoption built into the deliverable.", "roles": ["wrd", "bauer", "agency", "courts", "healthy", "mds", "goodtv", "dwindle"], "proof": ["intake", "recruiting", "visual", "search", "lifecycle", "mentor", "training", "voice", "leadership", "network"], "skills": ["ai", "crm", "growth", "media"]}};
  const strengths = {"ai": ["Claude Code & GPT/Codex direction", "AI assistants & agentic workflows", "Prompt engineering", "Knowledge-base design", "Source-grounded assistants", "Voice AI, SMS & website chat agents"], "crm": ["GoHighLevel", "CRM architecture & pipelines", "Lifecycle & customer journeys", "Email & SMS programs", "Qualification & lead routing", "Calendars & appointment booking"], "growth": ["Organic lead generation", "Facebook, Instagram, LinkedIn & email", "SEO, AEO & GEO", "Local search & Google Business", "Content systems", "WordPress"], "media": ["Video direction & production", "Branded content", "Videography & editing", "Social media & YouTube", "AI image/video generation", "Adobe Premiere Pro"]};
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  let lane = 'ai';
  let dateOrder = false;
  let filter = 'all';
  const chronological = ['bauer','agency','courts','healthy','mds','goodtv','dwindle','wrd'];
  const reorder = (selector, ids) => {
    const parent = $(selector);
    const children = [...parent.children];
    ids.forEach((id, i) => {
      const child = children.find((node) => node.dataset.id === id);
      if (child) { parent.append(child); child.classList.toggle('is-featured', i < 2); }
    });
  };
  function orderRoles() {
    reorder('#role-list', dateOrder ? chronological : lanes[lane].roles);
    $('#order-label').textContent = dateOrder ? 'Date order by role start, newest first. Concurrent roles retained.' : `Ordered for ${lanes[lane].label}. All roles shown.`;
    $('#chronological').setAttribute('aria-pressed', String(dateOrder));
    if (dateOrder) $$('#role-list .role').forEach((r) => r.classList.remove('is-featured'));
  }
  function setLane(next, updateUrl = true) {
    if (!Object.hasOwn(lanes, next)) return;
    lane = next;
    const config = lanes[lane];
    $$('[data-lane]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lane === lane)));
    $('#focus-label').textContent = `${config.label} focus`;
    $('#focus-headline').textContent = config.headline;
    $('#focus-copy').textContent = config.focus;
    $('#focus-strengths').replaceChildren(...strengths[config.skills[0]].map((text) => {
      const chip = document.createElement('span'); chip.textContent = text; return chip;
    }));
    reorder('#proof-list', config.proof);
    reorder('#skill-list', config.skills);
    orderRoles();
    $$('#proof-list details').forEach((r, i) => { r.open = i < 2; });
    $$('#role-list details').forEach((r, i) => { r.open = i === 0; });
    $('#lane-status').textContent = `${config.label} selected. Work, experience, and skill groups prioritized. All resume facts remain available.`;
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set('lane', lane);
      history.replaceState(null, '', url);
    }
  }
  function filterSkills() {
    const term = $('#skill-search').value.trim().toLocaleLowerCase();
    let total = 0;
    $$('#skill-list .skill-group').forEach((group) => {
      let matches = 0;
      const categoryMatches = filter === 'all' || group.dataset.id === filter;
      const groupMatches = group.querySelector('h3').textContent.toLocaleLowerCase().includes(term);
      group.querySelectorAll('li').forEach((item) => {
        const show = categoryMatches && (groupMatches || item.textContent.toLocaleLowerCase().includes(term));
        item.hidden = !show;
        if (show) matches++;
      });
      group.hidden = matches === 0;
      total += matches;
    });
    $('#no-skills').hidden = total !== 0;
    $('#skill-count').textContent = `${total} ${total === 1 ? 'skill' : 'skills'} shown`;
  }
  $$('[data-lane]').forEach((button) => button.addEventListener('click', () => setLane(button.dataset.lane)));
  $('#chronological').addEventListener('click', () => { dateOrder = !dateOrder; orderRoles(); });
  function syncExpand() {
    const allOpen = $$('#role-list details').every((r) => r.open);
    $('#expand-all').textContent = allOpen ? 'Collapse all roles' : 'Expand all roles';
    $('#expand-all').setAttribute('aria-expanded', String(allOpen));
  }
  $('#expand-all').addEventListener('click', () => {
    const expand = !$$('#role-list details').every((r) => r.open);
    $$('#role-list details').forEach((r) => { r.open = expand; });
    syncExpand();
  });
  $$('#role-list details').forEach((r) => r.addEventListener('toggle', syncExpand));
  $$('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    $$('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    filterSkills();
  }));
  $('#skill-search').addEventListener('input', filterSkills);
  // Expand details and reveal filtered skills for paper; restore the reader's state afterward.
  let printState = null;
  function preparePrint() {
    if (printState) return;
    printState = {details: $$('details').map((r) => [r, r.open]), hidden: $$('#skill-list [hidden]').map((r) => r)};
    $$('details').forEach((r) => { r.open = true; });
    printState.hidden.forEach((r) => { r.hidden = false; });
  }
  function restorePrint() {
    if (!printState) return;
    printState.details.forEach(([r, open]) => { r.open = open; });
    printState.hidden.forEach((r) => { r.hidden = true; });
    printState = null;
    syncExpand();
  }
  window.addEventListener('beforeprint', preparePrint);
  window.addEventListener('afterprint', restorePrint);
  function loadLane() {
    const fromUrl = new URL(location.href).searchParams.get('lane');
    setLane(Object.hasOwn(lanes, fromUrl) ? fromUrl : 'ai', false);
  }
  window.addEventListener('popstate', loadLane);
  loadLane();
  filterSkills();
})();
