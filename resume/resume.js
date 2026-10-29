(() => {
  'use strict';
  const lanes = {"ai": {"label": "AI Enablement", "headline": "AI enablement. Systems. Adoption.", "focus": "Assistants, agentic workflows, source-grounded support, and the training that helps teams use them.", "roles": ["bauer", "agency", "courts", "healthy", "mds", "goodtv", "dwindle", "wrd"], "proof": ["mentor", "training", "intake", "visual", "recruiting", "lifecycle", "voice", "search", "leadership", "network"], "skills": ["ai", "crm", "growth", "media"]}, "crm": {"label": "Lifecycle & CRM", "headline": "Lifecycle marketing. CRM. Revenue operations.", "focus": "The complete GoHighLevel journey: acquisition, qualification, booking, nurture, retention, re-engagement, and referral.", "roles": ["courts", "healthy", "bauer", "agency", "mds", "goodtv", "dwindle", "wrd"], "proof": ["lifecycle", "recruiting", "intake", "mentor", "visual", "voice", "training", "search", "leadership", "network"], "skills": ["crm", "ai", "growth", "media"]}, "marketing": {"label": "Marketing Leadership", "headline": "Marketing leadership. Organic growth. Content.", "focus": "Organic lead generation across Facebook, Instagram, LinkedIn, and email, with W-2 team and nationwide creator-network leadership.", "roles": ["healthy", "courts", "bauer", "agency", "mds", "goodtv", "dwindle", "wrd"], "proof": ["recruiting", "search", "lifecycle", "leadership", "network", "intake", "mentor", "training", "visual", "voice"], "skills": ["growth", "media", "crm", "ai"]}, "consulting": {"label": "Consulting", "headline": "Fractional AI & growth consulting.", "focus": "Discovery, systems, documentation, and team training delivered as one engagement, with adoption built into the deliverable.", "roles": ["wrd", "bauer", "agency", "courts", "healthy", "mds", "goodtv", "dwindle"], "proof": ["intake", "recruiting", "visual", "search", "lifecycle", "mentor", "training", "voice", "leadership", "network"], "skills": ["ai", "crm", "growth", "media"]}};
  const strengths = {"ai": ["Claude Code & GPT/Codex direction", "AI assistants & agentic workflows", "Prompt engineering", "Knowledge-base design", "Source-grounded assistants", "Voice AI, SMS & website chat agents"], "crm": ["GoHighLevel", "CRM architecture & pipelines", "Lifecycle & customer journeys", "Email & SMS programs", "Qualification & lead routing", "Calendars & appointment booking"], "growth": ["Organic lead generation", "Facebook, Instagram, LinkedIn & email", "SEO, AEO & GEO", "Local search & Google Business", "Content systems", "WordPress"], "media": ["Video direction & production", "Branded content", "Videography & editing", "Social media & YouTube", "AI image/video generation", "Adobe Premiere Pro"]};
  const roles = {"bauer": {"title": "AI Systems & Agent Growth Consultant", "company": "The Bauer Group", "dates": "2026–Present", "bullets": ["Built the agent training portal with lessons, slide decks, an SOP library, and everyday agent resources in one login-based home.", "Built a source-grounded AI mentor that answers from verified sources with citations and routes exceptions to the broker for a human decision.", "Built and runs multi-channel organic recruiting across email, Facebook, Instagram, and LinkedIn, with targeting screens, contact rules, booking verification, and pre-call briefs.", "Built the Preferred Partners resource hub, a project tracker, a social media management app, and a post-generation app.", "Trains agents and staff on practical AI use."]}, "agency": {"title": "Chief Operating Officer", "company": "Agency Logics LLC", "dates": "Feb 2026–Present", "bullets": ["Leads client operations and delivery for home-service dealer and distributor businesses.", "Built AI, CRM, web, and quote systems, including a photo-to-rendering turf visualizer and a 3D pergola configurator for visual concepts and rough estimates, plus pool, HVAC, and kitchen demo tools.", "Built conversational AI through SMS and voice for lead qualification and appointment booking.", "SEO, AEO, and GEO work across client web properties."]}, "courts": {"title": "Digital Media & Marketing Manager", "company": "365 Custom Courts / Custom Turf / Rubber Surfacing", "dates": "2022–Present", "bullets": ["Multi-brand marketing and creative operations across the 365 brands.", "Owned the complete GoHighLevel lifecycle program from lead capture through post-install retention and referrals.", "SEO WordPress sites, CRM onboarding for new sales hires, and monthly sales reporting; supporting work in paid social strategy and ad copy.", "Prompt-engineered an Air AI voice platform that qualified customers and booked appointments into the CRM."]}, "healthy": {"title": "Digital Media & Marketing Manager", "company": "Healthy Home 365 / Eco Probiotic Systems", "dates": "2018–Present", "bullets": ["Managed a W-2 marketing team of videographers, a graphic designer, a social media administrator, and a digital advertising specialist as direct reports.", "Websites and ecommerce, dealer support, and customer-service operations.", "Marketing support for affiliated startups in construction, real estate, solar, and insurance."]}, "mds": {"title": "Director / Content Creator Network Manager", "company": "Media Distribution Solutions", "dates": "2017", "bullets": ["Recruited, hired, trained, and managed a nationwide network of photographers and videographers across the United States.", "Built the recruiting campaigns and onboarding that scaled the network."]}, "goodtv": {"title": "Director / Director of Photography / Editor", "company": "GOODTV · Taipei", "dates": "2014–2016", "bullets": ["Directed commercials, promotional videos, and short films.", "Produced branded content that grew viewership."]}, "dwindle": {"title": "Videographer / Editor / Social Media Administrator", "company": "Dwindle Distribution", "dates": "2011–2012", "bullets": ["Shot and edited branded content for action-sports brands.", "Managed social media and YouTube channels."]}, "wrd": {"title": "Founder", "company": "WRD Media", "dates": "2008–Present", "bullets": ["Independent media production and consulting company delivering branded content and end-to-end creative projects across industries.", "Client engagements include Artificial Turf Maintenance and EverBlade Turf and Designs."]}};
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
    $('#focus-experience').replaceChildren(...config.roles.slice(0,2).map((id) => {
      const role = roles[id];
      const card = document.createElement('a');
      card.className = 'glass experience-snapshot'; card.href = `#role-${id}`;
      [['span','eyebrow',role.dates],['h3','',role.title],['p','snapshot-company',role.company],['p','',role.bullets[0]],['span','snapshot-link','View experience ↗']].forEach(([tag,cls,text]) => {
        const node = document.createElement(tag); node.className = cls; node.textContent = text; card.append(node);
      });
      return card;
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
