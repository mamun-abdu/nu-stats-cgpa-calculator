/* NU Statistics CGPA Calculator — UI layer (no framework). */
(function () {
  'use strict';
  var D = window.NU_DATA, C = window.NUCalc;
  var KEY = 'nuStatsCgpa.v1';
  var HONOURS = ['y1', 'y2', 'y3', 'y4'];
  var YEARS = {};
  D.years.forEach(function (y) { YEARS[y.id] = y; });

  // ---------- State ----------
  var state = load();
  function blank() {
    var s = { tab: 'y1', bnDigits: true, years: {}, cgpa: {} };
    D.years.forEach(function (y) { s.years[y.id] = { c: {}, sel: defaultSel(y) }; });
    HONOURS.forEach(function (id) { s.cgpa[id] = { mode: 'auto', gpa: '', credits: '' }; });
    return s;
  }
  function defaultSel(y) {
    // Pre-select the first N courses of each "pick any N" group.
    var sel = [], seen = {};
    y.courses.forEach(function (c) {
      if (!c.pick) return;
      seen[c.section] = (seen[c.section] || 0) + 1;
      if (seen[c.section] <= c.pick) sel.push(c.code);
    });
    return sel;
  }
  function load() {
    var s = blank();
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (raw && typeof raw === 'object') {
        if (typeof raw.tab === 'string') s.tab = raw.tab;
        if (typeof raw.bnDigits === 'boolean') s.bnDigits = raw.bnDigits;
        Object.keys(s.years).forEach(function (id) {
          var r = raw.years && raw.years[id];
          if (r && typeof r === 'object') {
            if (r.c && typeof r.c === 'object') s.years[id].c = r.c;
            if (Array.isArray(r.sel)) s.years[id].sel = r.sel;
          }
        });
        HONOURS.forEach(function (id) {
          var r = raw.cgpa && raw.cgpa[id];
          if (r && typeof r === 'object') {
            s.cgpa[id] = { mode: ['auto', 'manual', 'off'].indexOf(r.mode) >= 0 ? r.mode : 'auto', gpa: String(r.gpa || ''), credits: String(r.credits || '') };
          }
        });
      }
    } catch (e) { /* ignore corrupt storage */ }
    return s;
  }
  var saveTimer;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    }, 120);
  }

  // ---------- Helpers ----------
  function n(x) { return state.bnDigits ? C.toBangla(x) : String(x); }
  function f2(x) { return x === null || x === undefined ? '—' : n(Number(x).toFixed(2)); }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 2000);
  }
  function fullMarks(c) { return c.marks || 100; }
  function isCounted(yid, c) { return !c.pick || state.years[yid].sel.indexOf(c.code) >= 0; }
  function sectionLabel(s) { return s || 'কোর্সসমূহ'; }

  function yearResult(yid) {
    var y = YEARS[yid], ys = state.years[yid];
    return C.computeGPA(y.courses.map(function (c) {
      var e = ys.c[c.code] || {};
      return { credits: c.credits, letter: e.g || '', counted: isCounted(yid, c) };
    }));
  }
  function countedCourses(yid) { return YEARS[yid].courses.filter(function (c) { return isCounted(yid, c); }).length; }

  function cgpaInputs() {
    return HONOURS.map(function (id) {
      var cs = state.cgpa[id], r = yearResult(id);
      if (cs.mode === 'off') return { id: id, gpa: null, credits: 0 };
      if (cs.mode === 'manual') {
        var g = C.parseNum(cs.gpa), cr = C.parseNum(cs.credits);
        if (isNaN(cr)) cr = YEARS[id].totalCredits;
        return { id: id, gpa: isNaN(g) ? null : g, credits: cr };
      }
      return { id: id, gpa: r.gpa, credits: r.credits };
    });
  }

  // ---------- Tabs ----------
  var TAB_DEFS = D.years.map(function (y) { return { id: y.id, label: y.label, en: y.labelEn }; })
    .concat([{ id: 'cgpa', label: 'CGPA', en: 'সমন্বিত' }, { id: 'scale', label: 'গ্রেডিং', en: 'Scale' }]);
  if (TAB_DEFS.map(function (t) { return t.id; }).indexOf(state.tab) < 0) state.tab = 'y1';

  function renderTabs() {
    var host = document.getElementById('tabs');
    host.innerHTML = '';
    TAB_DEFS.forEach(function (t) {
      var b = el('button', {
        class: 'tab', role: 'tab', id: 'tab-' + t.id, type: 'button',
        'aria-selected': String(state.tab === t.id), 'aria-controls': 'panel', tabindex: state.tab === t.id ? '0' : '-1',
        onclick: function () { selectTab(t.id, false); }
      }, [el('span', { class: 't-main', text: t.label }), el('span', { class: 't-sub', 'data-sub': t.id, text: t.en })]);
      host.appendChild(b);
    });
    host.onkeydown = function (e) {
      var ids = TAB_DEFS.map(function (t) { return t.id; }), i = ids.indexOf(state.tab), j = i;
      if (e.key === 'ArrowRight') j = (i + 1) % ids.length;
      else if (e.key === 'ArrowLeft') j = (i - 1 + ids.length) % ids.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = ids.length - 1;
      else return;
      e.preventDefault(); selectTab(ids[j], true);
    };
    updateTabSubs();
  }
  function updateTabSubs() {
    D.years.forEach(function (y) {
      var s = document.querySelector('[data-sub="' + y.id + '"]');
      if (!s) return;
      var r = yearResult(y.id);
      s.textContent = r.gpa === null ? y.labelEn : 'GPA ' + f2(r.gpa);
    });
    var cs = document.querySelector('[data-sub="cgpa"]');
    if (cs) { var c = C.computeCGPA(cgpaInputs()); cs.textContent = c.cgpa === null ? 'সমন্বিত' : f2(c.cgpa); }
  }
  function selectTab(id, focus) {
    state.tab = id; save();
    renderTabs(); renderPanel();
    var b = document.getElementById('tab-' + id);
    if (b) { b.scrollIntoView({ block: 'nearest', inline: 'center' }); if (focus) b.focus(); }
    window.scrollTo({ top: 0 });
  }

  // ---------- Year panel ----------
  function gradeOptions(selected) {
    var s = el('select', null, [el('option', { value: '', text: '— গ্রেড —' })]);
    C.GRADES.forEach(function (g) {
      s.appendChild(el('option', { value: g.letter, text: g.letter + '  (' + n(g.point.toFixed(2)) + ')', selected: g.letter === selected }));
    });
    return s;
  }

  function renderYear(yid) {
    var y = YEARS[yid], ys = state.years[yid];
    var panel = el('section', { class: 'panel', id: 'panel', role: 'tabpanel', 'aria-labelledby': 'tab-' + yid });

    panel.appendChild(el('div', { class: 'panel-head' }, [
      el('div', null, [
        el('h2', null, [y.label + ' ', el('span', { class: 'en', text: '· ' + y.labelEn })]),
        el('p', { class: 'syllabus', text: y.syllabus })
      ])
    ]));

    // Summary card
    var ringVal = el('div', { class: 'ring-val', id: 'sumGpa' });
    var ring = el('div', { class: 'ring', id: 'sumRing', role: 'img', 'aria-label': 'GPA' }, [
      el('div', { class: 'ring-inner' }, [ringVal, el('div', { class: 'ring-lbl', text: 'GPA (৪.০০ স্কেল)' })])
    ]);
    function stat(k, id, cls) { return el('div', { class: 'stat ' + (cls || '') , id: id + 'Box' }, [el('div', { class: 'k', text: k }), el('div', { class: 'v', id: id })]); }
    panel.appendChild(el('div', { class: 'card summary', 'aria-live': 'polite' }, [
      ring,
      el('div', { class: 'stats' }, [
        stat('লেটার গ্রেড', 'sumLetter'), stat('ক্রেডিট গণনা', 'sumCredits'),
        stat('কোর্স সম্পন্ন', 'sumGraded'), stat('ফেল (F)', 'sumFails')
      ]),
      el('div', { class: 'progress', 'aria-hidden': 'true' }, [el('span', { id: 'sumBar' })])
    ]));

    // Toolbar
    var quickSel = gradeOptions('');
    quickSel.id = 'quickGrade';
    quickSel.className = 'btn';
    quickSel.style.paddingRight = '14px';
    quickSel.setAttribute('aria-label', 'সব খালি কোর্সে একই গ্রেড বসান');
    quickSel.firstChild.textContent = 'খালি ঘরে একই গ্রেড…';
    quickSel.addEventListener('change', function () {
      var g = quickSel.value; if (!g) return;
      y.courses.forEach(function (c) {
        if (!isCounted(yid, c)) return;
        var e = ys.c[c.code];
        if (!e || !e.g) ys.c[c.code] = { g: g, m: '' };
      });
      save(); renderPanel(); toast('খালি কোর্সগুলোতে ' + g + ' বসানো হয়েছে');
    });
    panel.appendChild(el('div', { class: 'toolbar' }, [
      quickSel,
      el('button', { class: 'btn danger', type: 'button', text: '↺ এই বর্ষ রিসেট', onclick: function () {
        if (!confirm(y.label + '-এর সব গ্রেড মুছে ফেলবেন?')) return;
        state.years[yid] = { c: {}, sel: defaultSel(y) }; save(); renderPanel(); toast('রিসেট হয়েছে');
      } }),
      el('button', { class: 'btn', type: 'button', text: 'CGPA দেখুন →', onclick: function () { selectTab('cgpa'); } })
    ]));

    // Sections
    var groups = [], idx = {};
    y.courses.forEach(function (c) {
      var k = c.section || '';
      if (!(k in idx)) { idx[k] = groups.length; groups.push({ name: k, pick: c.pick || 0, courses: [] }); }
      groups[idx[k]].courses.push(c);
    });
    groups.forEach(function (g, gi) {
      var head = el('div', { class: 'section-head' }, [el('h3', { id: 'sec-' + yid + '-' + gi, text: sectionLabel(g.name) })]);
      var pill = el('span', { class: 'pill' });
      head.appendChild(pill);
      var list = el('div', { class: 'courses', role: 'list', 'aria-labelledby': 'sec-' + yid + '-' + gi });
      g.courses.forEach(function (c) { list.appendChild(courseRow(yid, c, g)); });
      var sec = el('div', { class: 'section' }, [head, list]);
      sec._update = function () {
        if (g.pick) {
          var chosen = g.courses.filter(function (c) { return ys.sel.indexOf(c.code) >= 0; }).length;
          pill.textContent = 'যেকোনো ' + n(g.pick) + 'টি · ' + n(chosen) + '/' + n(g.pick) + ' নির্বাচিত';
          pill.className = 'pill ' + (chosen === g.pick ? 'ok' : 'warn');
        } else {
          var cr = g.courses.reduce(function (s, c) { return s + c.credits; }, 0);
          pill.textContent = n(g.courses.length) + 'টি কোর্স · ' + n(cr) + ' ক্রেডিট';
        }
      };
      sec._update();
      panel.appendChild(sec);
    });
    return panel;
  }

  function courseRow(yid, c, group) {
    var ys = state.years[yid];
    var entry = ys.c[c.code] || {};
    var uid = yid + '-' + c.code;
    var counted = isCounted(yid, c);
    var full = fullMarks(c);

    var letter = el('span', { class: 'letter none', text: '—' });
    var pt = el('span', { class: 'pt' });
    var sel = gradeOptions(entry.g || '');
    sel.id = 'g-' + uid;
    var marks = el('input', { id: 'm-' + uid, type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: '০–' + C.toBangla(full), value: entry.m || '', 'aria-describedby': 'e-' + uid });
    var err = el('div', { class: 'err', id: 'e-' + uid, 'aria-live': 'polite' });

    var row = el('div', { class: 'card course' + (counted ? '' : ' off'), role: 'listitem' });
    var meta = el('div', { class: 'c-meta' }, [
      el('span', { class: 'code', text: c.code }),
      el('span', { class: 'cr', text: n(c.credits) + ' ক্রেডিট' + (c.marks ? ' · ' + n(c.marks) + ' নম্বর' : '') })
    ]);
    var info = el('div', null, [meta, el('div', { class: 'c-name', text: c.name })]);
    if (group.pick) {
      var cb = el('input', { type: 'checkbox', checked: counted });
      cb.addEventListener('change', function () {
        var chosen = group.courses.filter(function (x) { return ys.sel.indexOf(x.code) >= 0; }).length;
        if (cb.checked && chosen >= group.pick) {
          cb.checked = false;
          toast('এই গ্রুপ থেকে সর্বোচ্চ ' + n(group.pick) + 'টি বেছে নেওয়া যাবে — আগে একটি বাদ দিন');
          return;
        }
        if (cb.checked) ys.sel.push(c.code); else ys.sel = ys.sel.filter(function (x) { return x !== c.code; });
        save(); renderPanel(true);
      });
      info.appendChild(el('label', { class: 'pick', style: 'margin-top:6px' }, [cb, el('span', { text: counted ? 'এই পেপারটি নিয়েছি ✓' : 'এই পেপারটি নিয়েছি?' })]));
    }
    row.appendChild(el('div', { class: 'c-top' }, [info, el('div', { class: 'c-res' }, [letter, pt])]));
    row.appendChild(el('div', { class: 'inputs' }, [
      el('div', { class: 'field' }, [el('label', { for: 'm-' + uid, text: 'প্রাপ্ত নম্বর (' + n(full) + '-এর মধ্যে)' }), marks, err]),
      el('div', { class: 'field' }, [el('label', { for: 'g-' + uid, text: 'অথবা গ্রেড বাছুন' }), sel])
    ]));

    function paint() {
      var e = ys.c[c.code] || {};
      var g = e.g ? C.gradeByLetter(e.g) : null;
      letter.textContent = g ? g.letter : '—';
      letter.className = 'letter' + (g ? (g.point === 0 ? ' f' : '') : ' none');
      pt.textContent = g ? n(g.point.toFixed(2)) + ' পয়েন্ট' : '';
      row.classList.toggle('has-grade', !!g);
      row.classList.toggle('is-fail', !!g && g.point === 0);
    }
    marks.addEventListener('input', function () {
      var raw = marks.value, v = C.parseNum(raw);
      if (raw.trim() === '') { err.textContent = ''; marks.removeAttribute('aria-invalid'); ys.c[c.code] = { g: '', m: '' }; sel.value = ''; }
      else {
        var g = C.gradeFromMarks(v, full);
        if (!g) { err.textContent = '০ থেকে ' + C.toBangla(full) + '-এর মধ্যে নম্বর লিখুন'; marks.setAttribute('aria-invalid', 'true'); ys.c[c.code] = { g: '', m: raw }; sel.value = ''; }
        else { err.textContent = ''; marks.removeAttribute('aria-invalid'); ys.c[c.code] = { g: g.letter, m: raw }; sel.value = g.letter; }
      }
      paint(); save(); updateYearSummary(yid);
    });
    sel.addEventListener('change', function () {
      ys.c[c.code] = { g: sel.value, m: '' };
      marks.value = ''; err.textContent = ''; marks.removeAttribute('aria-invalid');
      paint(); save(); updateYearSummary(yid);
    });
    if (counted === false) { marks.disabled = true; sel.disabled = true; }
    if (entry.m && !C.gradeFromMarks(C.parseNum(entry.m), full)) { err.textContent = '০ থেকে ' + C.toBangla(full) + '-এর মধ্যে নম্বর লিখুন'; marks.setAttribute('aria-invalid', 'true'); }
    paint();
    return row;
  }

  function updateYearSummary(yid) {
    var r = yearResult(yid);
    var g = document.getElementById('sumGpa');
    if (g) {
      g.textContent = f2(r.gpa);
      document.getElementById('sumRing').style.setProperty('--p', r.gpa === null ? 0 : (r.gpa / 4) * 100);
      document.getElementById('sumRing').setAttribute('aria-label', 'GPA ' + (r.gpa === null ? 'এখনো হিসাব হয়নি' : r.gpa.toFixed(2)));
      var L = document.getElementById('sumLetter');
      L.textContent = r.letter || '—';
      document.getElementById('sumCredits').textContent = n(r.credits) + ' / ' + n(r.totalCredits);
      var cc = countedCourses(yid);
      document.getElementById('sumGraded').textContent = n(r.graded) + ' / ' + n(cc);
      document.getElementById('sumFails').textContent = n(r.fails);
      document.getElementById('sumFailsBox').className = 'stat ' + (r.fails ? 'bad' : (r.graded ? 'good' : ''));
      document.getElementById('sumBar').style.width = (cc ? (r.graded / cc) * 100 : 0) + '%';
    }
    updateTabSubs(); updateDock();
  }

  // ---------- CGPA panel ----------
  function renderCGPA() {
    var panel = el('section', { class: 'panel', id: 'panel', role: 'tabpanel', 'aria-labelledby': 'tab-cgpa' });
    panel.appendChild(el('div', { class: 'panel-head' }, [el('div', null, [
      el('h2', null, ['সমন্বিত CGPA ', el('span', { class: 'en', text: '· Honours (৪ বছর)' })]),
      el('p', { class: 'syllabus', text: 'প্রতিটি বর্ষের GPA সেই বর্ষের ক্রেডিট দিয়ে ভারিত (weighted) করে হিসাব করা হয়।' })
    ])]));

    var big = el('div', { class: 'big', id: 'cgpaVal' });
    var meta = el('div', { class: 'meta' }, [el('span', { class: 'chip', id: 'cgpaLetter' }), el('span', { class: 'chip', id: 'cgpaCredits' })]);
    panel.appendChild(el('div', { class: 'card cgpa-hero', 'aria-live': 'polite' }, [el('div', { class: 'lbl', text: 'আপনার CGPA' }), big, meta]));

    var rows = el('div', { class: 'yrows' });
    HONOURS.forEach(function (id) { rows.appendChild(cgpaRow(id)); });
    panel.appendChild(rows);

    panel.appendChild(el('div', { class: 'toolbar' }, [
      el('button', { class: 'btn primary', type: 'button', text: '⧉ ফলাফল কপি করুন', onclick: copySummary }),
      el('button', { class: 'btn', type: 'button', text: '⎙ প্রিন্ট', onclick: function () { window.print(); } }),
      el('button', { class: 'btn danger', type: 'button', text: '↺ সব রিসেট', onclick: function () {
        if (!confirm('সব বর্ষের সব গ্রেড ও CGPA তথ্য মুছে ফেলবেন?')) return;
        var keep = { tab: state.tab, bnDigits: state.bnDigits };
        state = blank(); state.tab = keep.tab; state.bnDigits = keep.bnDigits; save(); renderTabs(); renderPanel(); toast('সব তথ্য মুছে ফেলা হয়েছে');
      } })
    ]));
    panel.appendChild(el('div', { class: 'callout', role: 'note' }, [
      'মাস্টার্সের GPA আলাদাভাবে “মাস্টার্স” ট্যাবে দেখুন; এটি অনার্স CGPA-তে যোগ হয় না। জাতীয় বিশ্ববিদ্যালয় যে ফলাফল প্রকাশ করে, সেটিই চূড়ান্ত।',
      el('span', { lang: 'en', text: 'Masters GPA is shown separately and is not part of the Honours CGPA. The official result is whatever NU publishes.' })
    ]));
    return panel;
  }

  function cgpaRow(id) {
    var y = YEARS[id], cs = state.cgpa[id];
    var gIn = el('input', { id: 'cg-g-' + id, type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: 'যেমন ৩.৫০' });
    var cIn = el('input', { id: 'cg-c-' + id, type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: C.toBangla(y.totalCredits) });
    var note = el('p', { class: 'note' });
    var modes = [['auto', 'অটো'], ['manual', 'নিজে লিখুন'], ['off', 'বাদ দিন']];
    var seg = el('div', { class: 'seg', role: 'group', 'aria-label': y.label + ' GPA উৎস' });
    modes.forEach(function (m) {
      seg.appendChild(el('button', { type: 'button', 'aria-pressed': String(cs.mode === m[0]), text: m[1], onclick: function () {
        cs.mode = m[0]; save();
        var fresh = cgpaRow(id); row.replaceWith(fresh); updateCGPA();
        var b = fresh.querySelector('.seg button[aria-pressed="true"]'); if (b) b.focus();
      } }));
    });
    var row = el('div', { class: 'card yrow' }, [
      el('div', { class: 'yrow-top' }, [el('h3', null, [y.label + ' ', el('span', { class: 'en', style: 'color:var(--muted);font-weight:500;font-size:.85rem', text: '· ' + n(y.totalCredits) + ' ক্রেডিট' })]), seg]),
      note,
      el('div', { class: 'inputs' }, [
        el('div', { class: 'field' }, [el('label', { for: gIn.id, text: 'GPA' }), gIn]),
        el('div', { class: 'field' }, [el('label', { for: cIn.id, text: 'ক্রেডিট' }), cIn])
      ])
    ]);
    if (cs.mode === 'auto') {
      var r = yearResult(id);
      gIn.readOnly = true; cIn.readOnly = true; gIn.placeholder = '—'; cIn.placeholder = '—';
      gIn.value = r.gpa === null ? '' : f2(r.gpa);
      cIn.value = r.credits ? n(r.credits) : '';
      var cc = countedCourses(id);
      if (r.gpa === null) { note.textContent = 'এখনো কোনো গ্রেড দেওয়া হয়নি — ' + y.label + ' ট্যাবে গ্রেড দিন, অথবা প্রকাশিত GPA “নিজে লিখুন”।'; }
      else if (r.graded < cc) { note.textContent = 'আংশিক: ' + n(r.graded) + '/' + n(cc) + ' কোর্সের গ্রেড থেকে হিসাব।'; note.className = 'note warn'; }
      else { note.textContent = 'সব কোর্সের গ্রেড থেকে স্বয়ংক্রিয় হিসাব' + (r.fails ? ' · ' + n(r.fails) + 'টি F' : '') + '।'; }
    } else if (cs.mode === 'manual') {
      gIn.value = cs.gpa; cIn.value = cs.credits;
      note.textContent = 'NU-এর প্রকাশিত GPA জানলে এখানে লিখুন (বাংলা বা ইংরেজি সংখ্যা)। ক্রেডিট খালি রাখলে ' + n(y.totalCredits) + ' ধরা হবে।';
      function onIn() {
        cs.gpa = gIn.value; cs.credits = cIn.value; save();
        var g = C.parseNum(gIn.value), c = C.parseNum(cIn.value);
        gIn.setAttribute('aria-invalid', String(gIn.value.trim() !== '' && (isNaN(g) || g > 4)));
        cIn.setAttribute('aria-invalid', String(cIn.value.trim() !== '' && (isNaN(c) || c <= 0)));
        updateCGPA();
      }
      gIn.addEventListener('input', onIn); cIn.addEventListener('input', onIn);
    } else {
      gIn.disabled = true; cIn.disabled = true; gIn.placeholder = '—'; cIn.placeholder = '—';
      note.textContent = 'এই বর্ষ CGPA হিসাবে ধরা হবে না।';
    }
    return row;
  }

  function updateCGPA() {
    var c = C.computeCGPA(cgpaInputs());
    var v = document.getElementById('cgpaVal');
    if (v) {
      v.textContent = f2(c.cgpa);
      document.getElementById('cgpaLetter').textContent = 'গ্রেড: ' + (c.letter || '—');
      document.getElementById('cgpaCredits').textContent = 'মোট ক্রেডিট: ' + n(c.credits);
    }
    updateTabSubs(); updateDock();
  }

  function copySummary() {
    var lines = ['NU Statistics — GPA/CGPA (unofficial)'];
    cgpaInputs().forEach(function (y) {
      lines.push(YEARS[y.id].labelEn + ': ' + (y.gpa === null ? '—' : y.gpa.toFixed(2) + ' (' + y.credits + ' cr)'));
    });
    var c = C.computeCGPA(cgpaInputs());
    lines.push('CGPA: ' + (c.cgpa === null ? '—' : c.cgpa.toFixed(2) + ' ' + c.letter + ' (' + c.credits + ' cr)'));
    lines.push(location.href.split('#')[0]);
    var text = lines.join('\n');
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { toast('কপি হয়েছে ✓'); }, function () { prompt('কপি করুন:', text); });
  }

  // ---------- Scale panel ----------
  function renderScale() {
    var panel = el('section', { class: 'panel', id: 'panel', role: 'tabpanel', 'aria-labelledby': 'tab-scale' });
    panel.appendChild(el('div', { class: 'panel-head' }, [el('div', null, [
      el('h2', null, ['গ্রেডিং পদ্ধতি ', el('span', { class: 'en', text: '· NU Grading Scale' })]),
      el('p', { class: 'syllabus', text: 'জাতীয় বিশ্ববিদ্যালয়ের অনার্স ও মাস্টার্সে প্রচলিত লেটার গ্রেড ও গ্রেড পয়েন্ট।' })
    ])]));
    var tb = el('tbody');
    D.grades.forEach(function (g) {
      tb.appendChild(el('tr', null, [
        el('td', null, [n(g.min) + (g.min === 0 ? ' – ' + n(g.max) + ' (৪০-এর কম)' : ' – ' + n(g.max))]),
        el('td', null, [el('span', { class: 'letter' + (g.point === 0 ? ' f' : ''), text: g.letter })]),
        el('td', { text: n(g.point.toFixed(2)) })
      ]));
    });
    panel.appendChild(el('div', { class: 'card table-card' }, [el('table', null, [
      el('caption', { class: 'visually-hidden', text: 'NU grading scale' }),
      el('thead', null, [el('tr', null, [el('th', { scope: 'col', text: 'নম্বর (%)' }), el('th', { scope: 'col', text: 'লেটার গ্রেড' }), el('th', { scope: 'col', text: 'গ্রেড পয়েন্ট' })])]),
      tb
    ])]));
    panel.appendChild(el('div', { class: 'card formula' }, [
      el('h3', { text: 'কীভাবে হিসাব হয়' }),
      el('p', null, ['বর্ষের GPA = ', el('code', { text: 'Σ (ক্রেডিট × গ্রেড পয়েন্ট) ÷ Σ ক্রেডিট' })]),
      el('p', null, ['CGPA = ', el('code', { text: 'Σ (বর্ষের GPA × বর্ষের ক্রেডিট) ÷ Σ ক্রেডিট' })]),
      el('p', { text: '৫০ বা ৭৫ নম্বরের কোর্সে প্রাপ্ত নম্বরকে শতকরায় রূপান্তর করে গ্রেড নির্ধারণ করা হয় (যেমন ৫০-এ ৪০ = ৮০% = A+)। ফলাফল দুই দশমিক পর্যন্ত রাউন্ড করা হয়।' }),
      el('p', { text: 'F (০.০০) পাওয়া কোর্সও GPA-তে শূন্য পয়েন্ট হিসেবে গণনা হয়; NU-এর নিয়ম অনুযায়ী এমন কোর্সে পরবর্তীতে মানোন্নয়ন/পুনঃপরীক্ষা দিতে হতে পারে।' })
    ]));
    panel.appendChild(el('div', { class: 'callout', role: 'note' }, [
      'এটি একটি অনানুষ্ঠানিক টুল। জাতীয় বিশ্ববিদ্যালয় যে ফলাফল প্রকাশ করে, সেটিই চূড়ান্ত ও অফিসিয়াল।',
      el('span', { lang: 'en', text: 'Unofficial tool. The official result is whatever National University publishes.' })
    ]));
    return panel;
  }

  // ---------- Dock (mobile live result) ----------
  function updateDock() {
    var dock = document.getElementById('dock');
    var t = state.tab, html = null;
    dock.innerHTML = '';
    if (YEARS[t]) {
      var r = yearResult(t);
      if (r.gpa !== null) {
        dock.appendChild(el('div', { class: 'd-l' }, [el('div', { class: 'd-k', text: YEARS[t].label + ' GPA' }),
          el('div', { class: 'd-v' }, [f2(r.gpa) + ' ', el('small', { text: (r.letter || '') + ' · ' + n(r.credits) + ' ক্রেডিট' + (r.fails ? ' · ' + n(r.fails) + 'F' : '') })])]));
        if (t !== 'ms') dock.appendChild(el('button', { type: 'button', text: 'CGPA →', onclick: function () { selectTab('cgpa'); } }));
        html = true;
      }
    }
    dock.classList.toggle('show', !!html);
  }

  // ---------- Panel router ----------
  function renderPanel(keepScroll) {
    var y = window.scrollY;
    var host = document.getElementById('panels');
    host.innerHTML = '';
    var t = state.tab;
    if (YEARS[t]) { host.appendChild(renderYear(t)); updateYearSummary(t); }
    else if (t === 'cgpa') { host.appendChild(renderCGPA()); updateCGPA(); }
    else { host.appendChild(renderScale()); updateTabSubs(); }
    updateDock();
    if (keepScroll) window.scrollTo({ top: y });
  }

  // ---------- Header controls ----------
  var digitBtn = document.getElementById('digitToggle');
  function paintDigitBtn() {
    digitBtn.textContent = state.bnDigits ? '১২৩' : '123';
    digitBtn.setAttribute('aria-pressed', String(state.bnDigits));
    digitBtn.setAttribute('aria-label', state.bnDigits ? 'বাংলা সংখ্যা চালু — ইংরেজি সংখ্যায় দেখান' : 'English digits on — switch to Bangla digits');
  }
  digitBtn.addEventListener('click', function () { state.bnDigits = !state.bnDigits; save(); paintDigitBtn(); renderTabs(); renderPanel(true); });
  paintDigitBtn();

  document.getElementById('themeToggle').addEventListener('click', function () {
    var root = document.documentElement;
    var dark = root.dataset.theme ? root.dataset.theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('nuStatsCgpa.theme', root.dataset.theme); } catch (e) {}
  });

  // Deep links: #y2, #cgpa, #scale
  var hash = location.hash.replace('#', '');
  if (TAB_DEFS.some(function (t) { return t.id === hash; })) state.tab = hash;
  window.addEventListener('hashchange', function () {
    var h = location.hash.replace('#', '');
    if (TAB_DEFS.some(function (t) { return t.id === h; }) && h !== state.tab) selectTab(h);
  });

  renderTabs();
  renderPanel();
})();
