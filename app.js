document.addEventListener('DOMContentLoaded', () => {

  /* ══════════════════════════════════════════════════════
     SIGN-IN GATE
  ══════════════════════════════════════════════════════ */
  window.togglePwd = function () {
    const inp = document.getElementById('gate-pwd');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  };

  window.handleSignIn = function () {
    const email = document.getElementById('gate-email').value.trim();
    const pwd   = document.getElementById('gate-pwd').value.trim();
    const err   = document.getElementById('gate-error');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      err.textContent = 'Please enter a valid email address.';
      err.style.display = 'block'; return;
    }
    if (pwd.length < 4) {
      err.textContent = 'Password must be at least 4 characters.';
      err.style.display = 'block'; return;
    }
    err.style.display = 'none';

    // derive display name from email
    const name    = email.split('@')[0].replace(/[._]/g,' ').replace(/\b\w/g, c => c.toUpperCase());
    const initials= name.trim().split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();

    document.getElementById('user-name-label').textContent = name;
    document.getElementById('user-avatar').textContent     = initials;

    document.getElementById('signin-gate').style.display  = 'none';
    document.getElementById('dashboard').style.display    = 'block';
    animateProgressBars();
    showPanel('overview');
    showToast('Welcome back, ' + name + '!', 'success');
  };

  // Enter key on gate form
  ['gate-email','gate-pwd'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') window.handleSignIn();
    });
  });

  window.handleSignOut = function () {
    document.getElementById('dashboard').style.display   = 'none';
    document.getElementById('signin-gate').style.display = 'flex';
    document.getElementById('gate-email').value = '';
    document.getElementById('gate-pwd').value   = '';
    document.getElementById('gate-error').style.display = 'none';
    showToast('Signed out successfully.', 'warn');
  };

  /* ══════════════════════════════════════════════════════
     PANEL NAVIGATION
  ══════════════════════════════════════════════════════ */
  window.showPanel = function (name) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const t = document.getElementById('panel-' + name);
    if (t) t.classList.add('active');
    document.querySelectorAll('.nav-btn[data-panel]').forEach(b =>
      b.classList.toggle('active', b.dataset.panel === name));
    document.querySelectorAll('.s-item[data-panel]').forEach(a =>
      a.classList.toggle('active', a.dataset.panel === name));
    if (name === 'candidates') renderList();
  };

  document.querySelectorAll('.nav-btn[data-panel]').forEach(b =>
    b.addEventListener('click', () => showPanel(b.dataset.panel)));
  document.querySelectorAll('.s-item[data-panel]').forEach(a =>
    a.addEventListener('click', () => showPanel(a.dataset.panel)));

  /* ══════════════════════════════════════════════════════
     PROGRESS BARS
  ══════════════════════════════════════════════════════ */
  function animateProgressBars() {
    setTimeout(() => {
      document.querySelectorAll('.prog-fill').forEach(bar => {
        const w = bar.style.width; bar.style.width = '0';
        requestAnimationFrame(() => {
          bar.style.transition = 'width 0.9s cubic-bezier(0.4,0,0.2,1)';
          bar.style.width = w;
        });
      });
    }, 150);
  }

  /* ══════════════════════════════════════════════════════
     TOAST
  ══════════════════════════════════════════════════════ */
  function showToast(msg, type) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className   = 'toast ' + (type || '');
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }
  window.showToast = showToast;

  /* ══════════════════════════════════════════════════════
     CANDIDATE STORE
  ══════════════════════════════════════════════════════ */
  let candidates = [];
  let editingId  = null;

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,5); }
  function initials(n) { return n.trim().split(/\s+/).map(w=>w[0].toUpperCase()).slice(0,2).join(''); }
  function v(id)        { return document.getElementById(id).value.trim(); }
  function sv(id, val)  { const el=document.getElementById(id); if(el) el.value=val||''; }

  /* ── Modal open/close ── */
  window.openModal = function (id) {
    editingId = id || null;
    if (id) {
      const c = candidates.find(x=>x.id===id);
      if (!c) return;
      sv('f-name',   c.name);
      sv('f-sid',    c.studentId);
      sv('f-email',  c.email);
      sv('f-inst',   c.institution !== 'N/A' ? c.institution : '');
      sv('f-course', c.course);
      sv('f-shape',  c.shape);
      sv('f-year',   c.year);
      sv('f-gpa',    c.gpa);
      sv('f-skills', c.skills.join(', '));
      sv('f-notes',  c.notes);
      document.getElementById('modal-title').textContent = 'Edit Candidate';
    } else {
      document.getElementById('modal-title').textContent = 'Add New Candidate';
    }
    document.getElementById('form-error').style.display = 'none';
    document.getElementById('modal-overlay').classList.add('open');
    setTimeout(() => document.getElementById('f-name').focus(), 100);
  };

  window.closeModal = function () {
    document.getElementById('modal-overlay').classList.remove('open');
    window.clearForm();
  };

  window.overlayClick = function (e) {
    if (e.target === document.getElementById('modal-overlay')) window.closeModal();
  };

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') window.closeModal();
  });

  /* ── Clear form ── */
  window.clearForm = function () {
    ['f-name','f-sid','f-email','f-inst','f-course','f-shape','f-year','f-gpa','f-skills','f-notes']
      .forEach(id => sv(id, ''));
    document.getElementById('form-error').style.display = 'none';
    editingId = null;
    document.getElementById('modal-title').textContent = 'Add New Candidate';
  };

  /* ── Validate ── */
  function validate() {
    const name   = v('f-name');
    const sid    = v('f-sid');
    const email  = v('f-email');
    const course = v('f-course');
    if (!name)   return 'Full name is required.';
    if (!sid)    return 'Student ID is required.';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'A valid email address is required.';
    if (!course) return 'Please select a program / course.';
    return null;
  }

  function buildCandidate(forReview) {
    return {
      id:          editingId || uid(),
      name:        v('f-name'),
      studentId:   v('f-sid'),
      email:       v('f-email'),
      institution: v('f-inst')   || 'N/A',
      course:      v('f-course'),
      shape:       v('f-shape'),
      year:        v('f-year'),
      gpa:         v('f-gpa'),
      skills:      v('f-skills').split(',').map(s=>s.trim()).filter(Boolean),
      notes:       v('f-notes'),
      reviewed:    forReview ? true : (editingId ? (candidates.find(c=>c.id===editingId)||{}).reviewed : false),
      createdAt:   editingId ? (candidates.find(c=>c.id===editingId)||{}).createdAt : new Date().toLocaleDateString(),
    };
  }

  /* ── Save candidate ── */
  window.saveCandidate = function () {
    const err = validate();
    if (err) { showErr(err); return; }
    const c = buildCandidate(false);
    if (editingId) {
      const idx = candidates.findIndex(x=>x.id===editingId);
      if (idx !== -1) candidates[idx] = c;
      showToast('Candidate updated.', 'success');
    } else {
      candidates.unshift(c);
      showToast('Candidate saved successfully!', 'success');
    }
    window.closeModal();
    updateOverviewCount();
    showPanel('candidates');
    renderList();
  };

  /* ── Submit for review ── */
  window.submitForReview = function () {
    const err = validate();
    if (err) { showErr(err); return; }
    const c = buildCandidate(true);
    if (editingId) {
      const idx = candidates.findIndex(x=>x.id===editingId);
      if (idx !== -1) candidates[idx] = c;
    } else {
      candidates.unshift(c);
    }
    window.closeModal();
    updateOverviewCount();
    showPanel('candidates');
    renderList();
    showToast('Submitted for review!', 'warn');
  };

  /* ── Edit / Delete / Toggle review ── */
  window.editCandidate   = function(id) { openModal(id); };
  window.deleteCandidate = function(id) {
    if (!confirm('Remove this candidate?')) return;
    candidates = candidates.filter(c=>c.id!==id);
    renderList(); updateOverviewCount();
    showToast('Candidate removed.', '');
  };
  window.toggleReview = function(id) {
    const c = candidates.find(x=>x.id===id);
    if (!c) return;
    c.reviewed = !c.reviewed;
    renderList();
    showToast(c.reviewed ? 'Marked for review.' : 'Review status cleared.', c.reviewed ? 'warn' : '');
  };

  function showErr(msg) {
    const el = document.getElementById('form-error');
    el.textContent = msg; el.style.display = 'block';
  }

  /* ── Render list ── */
  window.renderList = function () {
    const q       = (document.getElementById('cand-search')?.value||'').toLowerCase();
    const list    = document.getElementById('cand-list');
    const empty   = document.getElementById('cand-empty');
    const counter = document.getElementById('cand-count');
    const stats   = document.getElementById('cand-stats');
    if (!list) return;

    const filtered = candidates.filter(c =>
      c.name.toLowerCase().includes(q)      ||
      c.studentId.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)     ||
      c.course.toLowerCase().includes(q)    ||
      c.skills.some(s=>s.toLowerCase().includes(q))
    );

    // Stats
    if (candidates.length > 0) {
      stats.style.display = 'grid';
      document.getElementById('stat-total').textContent  = candidates.length;
      document.getElementById('stat-i').textContent      = candidates.filter(c=>c.shape==='I').length;
      document.getElementById('stat-t').textContent      = candidates.filter(c=>c.shape==='T').length;
      document.getElementById('stat-pi').textContent     = candidates.filter(c=>c.shape==='Pi').length;
      document.getElementById('stat-review').textContent = candidates.filter(c=>c.reviewed).length;
    } else { stats.style.display = 'none'; }

    counter.textContent = candidates.length + ' registered candidate' + (candidates.length!==1?'s':'') +
      (filtered.length!==candidates.length ? ' · ' + filtered.length + ' shown' : '');

    if (filtered.length === 0) {
      list.innerHTML = ''; empty.style.display = ''; return;
    }
    empty.style.display = 'none';

    const shapeLabel = { I:'I-Shaped', T:'T-Shaped', Pi:'Π-Shaped' };
    const shapeColor = { I:'teal', T:'emerald', Pi:'gold' };

    list.innerHTML = filtered.map(c => {
      const sc   = shapeColor[c.shape] || 'gray';
      const sl   = shapeLabel[c.shape] || '';
      const sPill= sl ? '<span class="cp '+sc+'">'+sl+'</span>' : '';
      const rPill= c.reviewed ? '<span class="cp review">⭐ Under Review</span>' : '';
      const gpB  = c.gpa   ? '<span class="cp gray">GPA: '+c.gpa+'</span>' : '';
      const yrB  = c.year  ? '<span class="cp gray">'+c.year+'</span>' : '';
      const skills= c.skills.length ? '<div class="cand-skills">'+c.skills.map(s=>'<span class="sk">'+s+'</span>').join('')+'</div>' : '';
      const notes = c.notes ? '<div class="cand-notes">'+c.notes+'</div>' : '';
      return '<div class="cand-card'+(c.reviewed?' reviewed':'')+'">'+
        '<div class="cand-top">'+
          '<div class="cand-info">'+
            '<div class="cand-avtr">'+initials(c.name)+'</div>'+
            '<div>'+
              '<div class="cand-name">'+c.name+'</div>'+
              '<div class="cand-meta">'+c.studentId+' &nbsp;&middot;&nbsp; '+c.email+' &nbsp;&middot;&nbsp; '+c.institution+'</div>'+
            '</div>'+
          '</div>'+
          '<div class="cand-btns">'+
            '<button class="ibtn review" title="Toggle Review" onclick="toggleReview(\''+c.id+'\')">&#9733;</button>'+
            '<button class="ibtn edit"   title="Edit"          onclick="editCandidate(\''+c.id+'\')">&#9998;</button>'+
            '<button class="ibtn del"    title="Delete"        onclick="deleteCandidate(\''+c.id+'\')">&#10005;</button>'+
          '</div>'+
        '</div>'+
        '<div class="cand-pills">'+
          '<span class="cp teal">'+c.course+'</span>'+
          sPill + yrB + gpB + rPill +
        '</div>'+
        skills + notes +
      '</div>';
    }).join('');
  };

  /* ── Overview count sync ── */
  function updateOverviewCount() {
    const el = document.getElementById('overview-count');
    if (el) el.textContent = candidates.length;
  }

  /* ── Export CSV ── */
  window.exportCSV = function () {
    if (candidates.length === 0) { showToast('No candidates to export.', ''); return; }
    const H = ['Name','Student ID','Email','Institution','Course','Talent Shape','Year','GPA','Skills','Notes','Under Review','Registered'];
    const R = candidates.map(c => [
      c.name, c.studentId, c.email, c.institution,
      c.course, c.shape, c.year, c.gpa,
      c.skills.join('; '), c.notes,
      c.reviewed ? 'Yes' : 'No', c.createdAt
    ].map(v=>'"'+String(v||'').replace(/"/g,'""')+'"').join(','));
    const csv  = [H.join(',')].concat(R).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'),{href:url,download:'candidates_'+new Date().toISOString().slice(0,10)+'.csv'});
    a.click(); URL.revokeObjectURL(url);
    showToast('Exported ' + candidates.length + ' candidate(s) as CSV.', 'success');
  };

});
