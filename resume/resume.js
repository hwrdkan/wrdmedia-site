(() => {
  'use strict';
  const lanes = {"ai": {"label": "AI Enablement", "headline": "AI enablement. Systems. Adoption.", "focus": "Assistants, agentic workflows, source-grounded support, and the training that helps teams use them.", "file": "Howard_Kan_AI_Enablement_Visual.pdf", "roles": ["bauer", "agency", "courts", "healthy", "mds", "goodtv", "dwindle", "wrd"], "proof": ["mentor", "training", "intake", "visual", "recruiting", "lifecycle", "voice", "search", "leadership", "network"], "skills": ["ai", "crm", "growth", "media"]}, "crm": {"label": "Lifecycle & CRM", "headline": "Lifecycle marketing. CRM. Revenue operations.", "focus": "The complete GoHighLevel journey: acquisition, qualification, booking, nurture, retention, re-engagement, and referral.", "file": "Howard_Kan_Lifecycle_CRM_Visual.pdf", "roles": ["courts", "healthy", "bauer", "agency", "mds", "goodtv", "dwindle", "wrd"], "proof": ["lifecycle", "recruiting", "intake", "mentor", "visual", "voice", "training", "search", "leadership", "network"], "skills": ["crm", "ai", "growth", "media"]}, "marketing": {"label": "Marketing Leadership", "headline": "Marketing leadership. Organic growth. Content.", "focus": "Organic lead generation across Facebook, Instagram, LinkedIn, and email, with W-2 team and nationwide creator-network leadership.", "file": "Howard_Kan_Marketing_Leadership_Visual.pdf", "roles": ["healthy", "courts", "bauer", "agency", "mds", "goodtv", "dwindle", "wrd"], "proof": ["recruiting", "search", "lifecycle", "leadership", "network", "intake", "mentor", "training", "visual", "voice"], "skills": ["growth", "media", "crm", "ai"]}, "consulting": {"label": "Consulting", "headline": "Fractional AI & growth consulting.", "focus": "Discovery, systems, documentation, and team training delivered as one engagement, with adoption built into the deliverable.", "file": "Howard_Kan_Fractional_Consulting_Visual.pdf", "roles": ["wrd", "bauer", "agency", "courts", "healthy", "mds", "goodtv", "dwindle"], "proof": ["intake", "recruiting", "visual", "search", "lifecycle", "mentor", "training", "voice", "leadership", "network"], "skills": ["ai", "crm", "growth", "media"]}};
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
    $('#focus-download').href = `/resume/downloads/${config.file}`;
    $('#focus-download').setAttribute('aria-label', `Download ${config.label} resume PDF`);
    reorder('#proof-list', config.proof);
    reorder('#skill-list', config.skills);
    orderRoles();
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
  $('#print-resume').addEventListener('click', () => window.print());
  function loadLane() {
    const fromUrl = new URL(location.href).searchParams.get('lane');
    setLane(Object.hasOwn(lanes, fromUrl) ? fromUrl : 'ai', false);
  }
  window.addEventListener('popstate', loadLane);
  loadLane();
  filterSkills();
})();
