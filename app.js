/* NU Statistics CGPA — UI (plain JS, no framework) */
(function () {
  'use strict';
  var D = window.NU_DATA, C = window.NUCalc, STR = window.NU_STR;
  var KEY = 'nuStatsCgpa.v2';
  var HON = ['y1', 'y2', 'y3', 'y4'];
  var ALL = ['y1', 'y2', 'y3', 'y4', 'ms'];
  var GCOL = { 'A+': '#3f8f5f', 'A': '#5d9b5f', 'A-': '#86a957', 'B+': '#b9ad4a', 'B': '#dba63c', 'B-': '#e5933a', 'C+': '#e07d3b', 'C': '#d8683b', 'D': '#c9583f', 'F': '#c4413a' };
  var DARKTXT = { 'B+': 1, 'B': 1, 'B-': 1 };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- state ----------
  var state = load();
  function load() {
    var s = { lang: (navigator.language || '').indexOf('bn') === 0 ? 'bn' : 'en', session: null, year: 'y1', data: {} };
    try {
      var r = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (r && typeof r === 'object') {
        if (r.lang === 'en' || r.lang === 'bn') s.lang = r.lang;
        if (typeof r.session === 'string' && C.eraForSession(D, r.session)) s.session = r.session;
        if (ALL.indexOf(r.year) >= 0) s.year = r.year;
        if (r.data && typeof r.data === 'object') s.data = r.data;
      }
    } catch (e) {}
    return s;
  }
  var tSave;
  function save() { clearTimeout(tSave); tSave = setTimeout(function () { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }, 100); }
  function yst(yid) {
    var s = state.data[state.session] || (state.data[state.session] = {});
    var y = s[yid];
    if (!y || typeof y !== 'object') {
      y = s[yid] = { c: {}, sel: null, custom: [], manual: { on: false, gpa: '', credits: '' } };
    }
    if (!y.c) y.c = {}; if (!Array.isArray(y.custom)) y.custom = []; if (!y.manual) y.manual = { on: false, gpa: '', credits: '' };
    if (!Array.isArray(y.sel)) y.sel = defaultSel(C.yearFor(D, state.session, yid));
    return y;
  }
  function defaultSel(y) {
    var sel = [], seen = {};
    if (!y) return sel;
    y.courses.forEach(function (c) { if (!c.pick) return; seen[c.section] = (seen[c.section] || 0) + 1; if (seen[c.section] <= c.pick) sel.push(c.code); });
    return sel;
  }

  // ---------- helpers ----------
  function t(k, v) {
    var s = (STR[state.lang] && STR[state.lang][k]) || STR.en[k] || k;
    if (v) Object.keys(v).forEach(function (x) { s = s.split('{' + x + '}').join(v[x]); });
    return s;
  }
  function n(x) { return state.lang === 'bn' ? C.toBangla(x) : String(x); }
  function f2(x) { return x === null || x === undefined ? '–' : n(Number(x).toFixed(2)); }
  function sessLabel(id) { var a = id.split('-'); return n(a[0] + '–' + a[1].slice(2)); }
  function eraLabel(era) { return era === 'old' ? t('oldSyl') : t('newSyl'); }
  function el(tag, a, kids) {
    var e = document.createElement(tag);
    if (a) for (var k in a) {
      var v = a[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    (kids || []).forEach(function (c) { if (c !== null && c !== undefined && c !== false) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  var SVGNS = 'http://www.w3.org/2000/svg';
  function sv(tag, a) { var e = document.createElementNS(SVGNS, tag); for (var k in a) e.setAttribute(k, a[k]); return e; }
  function toast(m) { var x = document.getElementById('toast'); x.textContent = m; x.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(function () { x.classList.remove('show'); }, 2200); }
  function countUp(node, to) {
    var from = parseFloat(node.dataset.v || '0');
    node.dataset.v = to === null ? '0' : String(to);
    if (to === null) { node.textContent = '–'; return; }
    if (reduceMotion || from === to) { node.textContent = f2(to); return; }
    var t0 = performance.now(), dur = 650;
    cancelAnimationFrame(node._raf);
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      node.textContent = f2(from + (to - from) * e);
      if (p < 1) node._raf = requestAnimationFrame(step);
    })(t0);
  }

  // ---------- calculations ----------
  function isCounted(yid, c) { return !c.nonCredit && (!c.pick || yst(yid).sel.indexOf(c.code) >= 0); }
  function entries(yid) {
    var y = C.yearFor(D, state.session, yid), s = yst(yid), out = [];
    if (y) y.courses.forEach(function (c) { out.push({ credits: c.credits, letter: (s.c[c.code] || {}).g || '', counted: isCounted(yid, c) }); });
    s.custom.forEach(function (c) { out.push({ credits: c.credits, letter: c.g || '', counted: true }); });
    return out;
  }
  function yearResult(yid) {
    var y = C.yearFor(D, state.session, yid), s = yst(yid), r = C.computeGPA(entries(yid));
    r.manual = false;
    if (s.manual.on) {
      var g = C.parseNum(s.manual.gpa), cr = C.parseNum(s.manual.credits);
      if (isNaN(cr)) cr = y ? y.totalCredits : NaN;
      r = { gpa: !isNaN(g) && g >= 0 && g <= 4 ? C.round2(g) : null, credits: isNaN(cr) ? 0 : cr, manual: true, fails: 0, graded: 0, totalCredits: isNaN(cr) ? 0 : cr };
      r.letter = r.gpa === null ? null : C.letterFromGPA(r.gpa);
      r.needCredits = isNaN(cr);
    }
    return r;
  }
  function cgpa() { return C.computeCGPA(HON.map(function (id) { var r = yearResult(id); return { gpa: r.gpa, credits: r.credits }; })); }
  function allLetters() {
    var out = [];
    ALL.forEach(function (yid) {
      if (yst(yid).manual.on) return;
      var y = C.yearFor(D, state.session, yid), s = yst(yid);
      if (y) y.courses.forEach(function (c) { var g = (s.c[c.code] || {}).g; if (g && isCounted(yid, c)) out.push(g); });
      s.custom.forEach(function (c) { if (c.g) out.push(c.g); });
    });
    return out;
  }

  // ---------- chrome (header, footer, lang) ----------
  function applyLang() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll('[data-i18n]').forEach(function (e) { e.textContent = t(e.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (e) { e.setAttribute('aria-label', t(e.dataset.i18nAria)); });
    var lb = document.getElementById('langBtn');
    lb.textContent = t('langSwitch'); lb.lang = state.lang === 'en' ? 'bn' : 'en';
    lb.setAttribute('aria-label', state.lang === 'en' ? 'বাংলায় দেখুন' : 'Switch to English');
    document.title = state.lang === 'bn' ? 'পরিসংখ্যান সিজিপিএ ক্যালকুলেটর · জাতীয় বিশ্ববিদ্যালয়' : 'NU Statistics CGPA Calculator';
    var sb = document.getElementById('sessionBtn');
    sb.hidden = !state.session;
    if (state.session) { sb.textContent = sessLabel(state.session); sb.setAttribute('aria-label', t('sessionChip', { s: sessLabel(state.session) }) + ' · ' + t('change')); }
    document.getElementById('disclaimer').textContent = t('disclaimer');
    var fc = document.getElementById('footCredit'); fc.innerHTML = '';
    var parts = t('credit').split(/(\{link\}|\{me\}|\{src\})/);
    parts.forEach(function (p) {
      if (p === '{link}') fc.appendChild(el('a', { href: 'https://www.nu.ac.bd/syllabus-honours.php', target: '_blank', rel: 'noopener', text: t('nuSite') }));
      else if (p === '{me}') fc.appendChild(el('a', { href: 'https://github.com/mamun-abdu', target: '_blank', rel: 'noopener', text: 'Mamun Abdu' }));
      else if (p === '{src}') fc.appendChild(el('a', { href: 'https://github.com/mamun-abdu/nu-stats-cgpa-calculator', target: '_blank', rel: 'noopener', text: t('source') }));
      else fc.appendChild(document.createTextNode(p));
    });
  }

  // ---------- session picker ----------
  function sessionGrid(onPick) {
    var g = el('div', { class: 'sessions', role: 'group', 'aria-label': t('pickTitleShort') });
    D.sessions.slice().reverse().forEach(function (s) {
      g.appendChild(el('button', { type: 'button', class: 'sess' + (s.era === 'new' ? ' new' : ''), 'aria-pressed': String(state.session === s.id),
        onclick: function () { onPick(s.id); } }, [el('b', { class: 'num', text: sessLabel(s.id) }), el('span', { text: eraLabel(s.era) })]));
    });
    return g;
  }
  function chooseSession(id) {
    var changed = state.session !== id;
    state.session = id; if (changed) state.year = state.year || 'y1';
    save(); applyLang(); render();
  }
  function openSessionDialog() {
    var d = document.getElementById('sessionDialog'), body = document.getElementById('sdBody');
    body.innerHTML = '';
    body.appendChild(sessionGrid(function (id) { d.close(); chooseSession(id); }));
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
    var cur = body.querySelector('[aria-pressed="true"]'); if (cur) cur.focus();
  }

  // ---------- render ----------
  var main = document.getElementById('main');
  function render() {
    main.innerHTML = '';
    if (!state.session) {
      main.appendChild(el('section', { class: 'hello fade-in' }, [
        el('h1', { text: t('pickHello') }), el('p', { text: t('pickLead') }), sessionGrid(chooseSession)
      ]));
      return;
    }
    var dash = el('div', { class: 'dash fade-in' });
    var side = el('aside', { class: 'side' }, [renderHero(), renderMix()]);
    var right = el('section', { 'aria-label': t('gpa') }, [renderYearTabs(), renderYear(state.year), renderScale()]);
    dash.appendChild(side); dash.appendChild(right);
    main.appendChild(dash);
    refresh();
  }

  // Hero: CGPA + bar chart
  function renderHero() {
    var big = el('div', { class: 'big num', id: 'cgVal', 'aria-live': 'polite' });
    return el('div', { class: 'card hero' }, [
      el('div', { class: 'hero-top' }, [
        el('div', null, [el('div', { class: 'eyebrow', text: t('yourCgpa') }), big]),
        el('span', { class: 'badge', id: 'cgLetter' })
      ]),
      el('p', { class: 'sub', id: 'cgSub' }),
      el('div', { class: 'chart' }, [el('h3', { text: t('gpaByYear') }), el('div', { id: 'bars' })])
    ]);
  }
  function drawBars() {
    var host = document.getElementById('bars'); if (!host) return;
    var W = 300, H = 140, pad = 22, base = H - 22, top = 18;
    var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', class: 'bars', role: 'img' });
    var labels = [], ids = ALL.filter(function (id) { return id !== 'ms' || yearResult('ms').gpa !== null; });
    var bw = Math.min(38, (W - pad * 2) / ids.length - 14), step = (W - pad * 2) / ids.length;
    svg.appendChild(sv('line', { x1: pad - 6, x2: W - pad + 6, y1: base, y2: base }));
    ids.forEach(function (id, i) {
      var r = yearResult(id), x = pad + step * i + (step - bw) / 2;
      var h = r.gpa === null ? 0 : (r.gpa / 4) * (base - top);
      if (r.gpa === null) svg.appendChild(sv('rect', { x: x, y: top, width: bw, height: base - top, rx: 8, class: 'ghost' }));
      else {
        svg.appendChild(sv('rect', { x: x, y: base - h, width: bw, height: h, rx: 8, class: 'b' + (id === 'ms' ? ' ms' : '') }));
        var v = sv('text', { x: x + bw / 2, y: base - h - 5, 'text-anchor': 'middle', class: 'v' }); v.textContent = f2(r.gpa); svg.appendChild(v);
      }
      var lt = sv('text', { x: x + bw / 2, y: H - 6, 'text-anchor': 'middle' }); lt.textContent = t(id + 's'); svg.appendChild(lt);
      labels.push(t(id) + ': ' + (r.gpa === null ? '–' : r.gpa.toFixed(2)));
    });
    svg.setAttribute('aria-label', t('gpaByYear') + '. ' + labels.join(', '));
    host.innerHTML = ''; host.appendChild(svg);
  }

  // Grade mix donut
  function renderMix() {
    return el('div', { class: 'card mix' }, [el('h3', { text: t('gradeMix') }), el('div', { class: 'mix-body', id: 'mixBody' })]);
  }
  function drawMix() {
    var host = document.getElementById('mixBody'); if (!host) return;
    var letters = allLetters(), dist = C.gradeDistribution(letters), total = letters.length;
    var R = 46, Cc = 2 * Math.PI * R, off = 0;
    var svg = sv('svg', { viewBox: '0 0 120 120', width: '116', height: '116', class: 'donut', role: 'img' });
    svg.appendChild(sv('circle', { cx: 60, cy: 60, r: R, class: 'track' }));
    var desc = [];
    C.GRADES.forEach(function (g) {
      var k = dist[g.letter]; if (!k) return;
      var len = (k / total) * Cc;
      svg.appendChild(sv('circle', { cx: 60, cy: 60, r: R, stroke: GCOL[g.letter], 'stroke-dasharray': Math.max(0, len - 1.5) + ' ' + Cc, 'stroke-dashoffset': -off, transform: 'rotate(-90 60 60)' }));
      off += len; desc.push(g.letter + ' ' + k);
    });
    var tx = sv('text', { x: 60, y: 62, 'text-anchor': 'middle' }); tx.textContent = n(total); svg.appendChild(tx);
    var ts = sv('text', { x: 60, y: 78, 'text-anchor': 'middle', class: 's' }); ts.textContent = t('coursesGraded'); svg.appendChild(ts);
    svg.setAttribute('aria-label', t('gradeMix') + ': ' + (desc.join(', ') || t('noGradesYet')));
    var lg = el('ul', { class: 'legend' });
    if (!total) lg.appendChild(el('li', { class: 'c', text: t('noGradesYet') }));
    C.GRADES.forEach(function (g) { if (dist[g.letter]) lg.appendChild(el('li', null, [el('i', { style: 'background:' + GCOL[g.letter] }), g.letter + ' ', el('span', { class: 'c num', text: '×' + n(dist[g.letter]) })])); });
    host.innerHTML = ''; host.appendChild(svg); host.appendChild(lg);
  }

  // Year tabs
  function renderYearTabs() {
    var bar = el('div', { class: 'years', role: 'tablist', 'aria-label': t('gpa') });
    ALL.forEach(function (id) {
      var y = C.yearFor(D, state.session, id);
      bar.appendChild(el('button', { type: 'button', role: 'tab', class: 'yt', id: 'yt-' + id, 'aria-selected': String(state.year === id), 'aria-controls': 'yearPanel', tabindex: state.year === id ? '0' : '-1',
        onclick: function () { selectYear(id); } }, [el('span', null, [t(id + 's'), y ? null : el('span', { class: 'dot', title: t('notPubTitle'), 'aria-label': t('notPubTitle') })]), el('small', { class: 'num', 'data-ygpa': id })]));
    });
    bar.addEventListener('keydown', function (e) {
      var i = ALL.indexOf(state.year), j = i;
      if (e.key === 'ArrowRight') j = (i + 1) % ALL.length; else if (e.key === 'ArrowLeft') j = (i - 1 + ALL.length) % ALL.length;
      else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = ALL.length - 1; else return;
      e.preventDefault(); selectYear(ALL[j], true);
    });
    return bar;
  }
  function selectYear(id, focus) {
    state.year = id; save();
    document.querySelectorAll('.yt').forEach(function (b) { var on = b.id === 'yt-' + id; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    var old = document.getElementById('yearPanel'); var fresh = renderYear(id); fresh.classList.add('fade-in'); old.replaceWith(fresh);
    refresh();
    var b = document.getElementById('yt-' + id); if (b) { b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); if (focus) b.focus(); }
  }

  function gradeSelect(cur, label) {
    var s = el('select', { class: 'gsel', 'aria-label': label }, [el('option', { value: '', text: '—' })]);
    C.GRADES.forEach(function (g) { s.appendChild(el('option', { value: g.letter, text: g.letter, selected: g.letter === cur })); });
    paintSel(s);
    return s;
  }
  function paintSel(s) {
    var v = s.value; s.classList.toggle('set', !!v);
    s.style.background = v ? GCOL[v] : ''; s.style.color = v ? (DARKTXT[v] ? '#2a2420' : '#fff') : '';
  }

  function renderYear(yid) {
    var y = C.yearFor(D, state.session, yid), s = yst(yid), era = C.eraForSession(D, state.session);
    var card = el('div', { class: 'card year', id: 'yearPanel', role: 'tabpanel', 'aria-labelledby': 'yt-' + yid });
    var yn = el('div', { class: 'n num', id: 'yVal' });
    card.appendChild(el('div', { class: 'yh' }, [
      el('div', null, [
        el('h2', { text: t(yid) }),
        el('div', { class: 'tag' }, y ? [t('syllabusTag', { e: n(y.syllabus.replace('-', '–')) }), ' · ', el('a', { href: y.source, target: '_blank', rel: 'noopener', text: t('officialPdf') })] : [t('notPubTitle')])
      ]),
      el('div', { class: 'ygpa' }, [yn, el('div', { class: 'l', id: 'yLetter' })])
    ]));
    card.appendChild(el('div', { class: 'meter', 'aria-hidden': 'true' }, [el('span', { id: 'yBar' })]));
    card.appendChild(el('div', { class: 'facts', id: 'yFacts' }));

    // manual GPA toggle
    var cb = el('input', { type: 'checkbox', checked: s.manual.on, id: 'man-' + yid });
    card.appendChild(el('label', { class: 'switch', for: 'man-' + yid }, [cb, el('span', { class: 'tr', 'aria-hidden': 'true' }), el('span', { text: t('manualToggle') })]));
    var mg = el('input', { id: 'mg-' + yid, type: 'text', inputmode: 'decimal', autocomplete: 'off', value: s.manual.gpa, placeholder: n('3.50') });
    var mc = el('input', { id: 'mc-' + yid, type: 'text', inputmode: 'decimal', autocomplete: 'off', value: s.manual.credits, placeholder: y ? n(y.totalCredits) : n('32') });
    var mnote = el('p', { id: 'mNote', text: t('manualNote') });
    var man = el('div', { class: 'manual', hidden: !s.manual.on }, [
      mnote,
      el('div', { class: 'field' }, [el('label', { for: mg.id, text: t('manualGpa') }), mg]),
      el('div', { class: 'field' }, [el('label', { for: mc.id, text: t('manualCredits') }), mc])
    ]);
    card.appendChild(man);
    var body = el('div', { class: s.manual.on ? 'dim' : '' });
    cb.addEventListener('change', function () { s.manual.on = cb.checked; man.hidden = !cb.checked; body.className = cb.checked ? 'dim' : ''; save(); refresh(); });
    function onMan() {
      s.manual.gpa = mg.value; s.manual.credits = mc.value; save();
      var g = C.parseNum(mg.value), c = C.parseNum(mc.value);
      mg.setAttribute('aria-invalid', String(mg.value.trim() !== '' && (isNaN(g) || g > 4)));
      mc.setAttribute('aria-invalid', String(mc.value.trim() !== '' && (isNaN(c) || c <= 0)));
      refresh();
    }
    mg.addEventListener('input', onMan); mc.addEventListener('input', onMan);

    if (y) {
      var qs = gradeSelect('', t('quickFill')); qs.className = 'ghost-btn'; qs.style.cssText = ''; qs.firstChild.textContent = t('quickFill');
      qs.addEventListener('change', function () {
        var g = qs.value; if (!g) return;
        y.courses.forEach(function (c) { if (isCounted(yid, c) && !(s.c[c.code] || {}).g) s.c[c.code] = { g: g, m: '' }; });
        save(); selectYear(yid); toast(t('filled', { g: g }));
      });
      body.appendChild(el('div', { class: 'tools' }, [qs, el('button', { type: 'button', class: 'ghost-btn', text: t('reset'), onclick: function () {
        if (!confirm(t('resetQ', { y: t(yid) }))) return;
        state.data[state.session][yid] = null; save(); selectYear(yid); toast(t('cleared'));
      } })]));

      var groups = [], idx = {};
      y.courses.forEach(function (c) { var k = c.section || ''; if (!(k in idx)) { idx[k] = groups.length; groups.push({ key: k, pick: c.pick || 0, courses: [] }); } groups[idx[k]].courses.push(c); });
      groups.forEach(function (g) {
        var title = g.pick ? t(g.key, { n: n(g.pick) }) : t(g.key || 'courses');
        var cnt = el('span', { class: 'cnt num' });
        var list = el('div', { class: 'list', role: 'list' });
        g.courses.forEach(function (c) { list.appendChild(courseRow(yid, c, g, update)); });
        function update() {
          if (!g.pick) { cnt.textContent = n(g.courses.filter(function (c) { return !c.nonCredit; }).reduce(function (a, c) { return a + c.credits; }, 0)) + ' ' + t('cr'); return; }
          var k = g.courses.filter(function (c) { return s.sel.indexOf(c.code) >= 0; }).length;
          cnt.textContent = t('chosen', { a: n(k), b: n(g.pick) }); cnt.className = 'cnt num ' + (k === g.pick ? 'ok' : 'warn');
        }
        update();
        body.appendChild(el('div', { class: 'group' }, [el('div', { class: 'gh' }, [el('h3', { text: title }), cnt]), list]));
      });
    } else {
      body.appendChild(el('div', { class: 'empty' }, [
        el('div', { html: '<svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="8" width="40" height="48" rx="8" fill="var(--soft)" stroke="var(--line)" stroke-width="2"/><path d="M22 22h20M22 30h20M22 38h12" stroke="var(--line)" stroke-width="3" stroke-linecap="round"/><circle cx="46" cy="46" r="10" fill="var(--sun)"/><path d="M46 41v6M46 50.5v.5" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>' }),
        el('h3', { text: t('notPubTitle') }),
        el('p', { text: t('notPubText', { y: t(yid) }) })
      ]));
    }

    // custom courses
    var cl = el('div', { class: 'list', role: 'list' });
    function drawCustom() {
      cl.innerHTML = '';
      s.custom.forEach(function (c, i) {
        var sel = gradeSelect(c.g || '', t('gradeFor', { c: c.name }));
        sel.addEventListener('change', function () { c.g = sel.value; paintSel(sel); save(); refresh(); });
        cl.appendChild(el('div', { class: 'row', role: 'listitem' }, [
          el('div', null, [el('div', { class: 'r-name', text: c.name }), el('div', { class: 'r-meta num', text: n(c.credits) + ' ' + t('cr') })]),
          el('div', { class: 'ctl' }, [sel, el('button', { type: 'button', class: 'xbtn', 'aria-label': t('remove', { c: c.name }), text: '×', onclick: function () { s.custom.splice(i, 1); save(); drawCustom(); refresh(); } })])
        ]));
      });
      cl.hidden = !s.custom.length;
    }
    drawCustom();
    var an = el('input', { id: 'an-' + yid, type: 'text', autocomplete: 'off', maxlength: '80' });
    var ac = el('input', { id: 'ac-' + yid, type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: n('4') });
    var ag = gradeSelect('', t('gradePh')); ag.id = 'ag-' + yid; ag.className = 'gsel'; ag.style.width = '100%';
    var form = el('form', { class: 'add', novalidate: true }, [
      el('div', { class: 'field' }, [el('label', { for: an.id, text: t('courseName') }), an]),
      el('div', { class: 'field' }, [el('label', { for: ac.id, text: t('creditsLbl') }), ac]),
      el('div', { class: 'field' }, [el('label', { for: ag.id, text: t('gradePh') }), ag]),
      el('button', { class: 'btn go', type: 'submit', text: t('add') })
    ]);
    ag.addEventListener('change', function () { paintSel(ag); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = an.value.trim(), cr = C.parseNum(ac.value);
      if (!name || isNaN(cr) || cr <= 0 || cr > 20) { toast(t('addErr')); (name ? ac : an).focus(); return; }
      s.custom.push({ name: name, credits: cr, g: ag.value }); save();
      an.value = ''; ac.value = ''; ag.value = ''; paintSel(ag); drawCustom(); refresh(); an.focus();
    });
    body.appendChild(el('div', { class: 'group' }, [el('div', { class: 'gh' }, [el('h3', { text: y ? t('myCourses') : t('addCourse') })]), cl, form]));
    card.appendChild(body);
    if (yid === 'ms') card.appendChild(el('p', { class: 'sub', text: t('msNote') }));
    return card;
  }

  function courseRow(yid, c, g, groupUpdate) {
    var s = yst(yid), e = s.c[c.code] || {}, full = c.marks || 100;
    var counted = isCounted(yid, c);
    var meta = el('div', { class: 'r-meta num' }, [el('span', { text: c.code }), c.nonCredit ? null : el('span', { text: n(c.credits) + ' ' + t('cr') }), c.marks ? el('span', { text: n(c.marks) + ' ' + t('marks') }) : null]);
    var row = el('div', { class: 'row' + (counted || c.nonCredit ? '' : ' off'), role: 'listitem' });
    row.appendChild(el('div', null, [el('div', { class: 'r-name', text: c.name }), meta]));
    if (c.nonCredit) { meta.appendChild(el('span', { class: 'nc', text: t('nonCredit') })); return row; }
    if (g.pick) {
      var cb = el('input', { type: 'checkbox', checked: counted });
      cb.addEventListener('change', function () {
        var k = g.courses.filter(function (x) { return s.sel.indexOf(x.code) >= 0; }).length;
        if (cb.checked && k >= g.pick) { cb.checked = false; toast(t('pickLimit', { n: n(g.pick) })); return; }
        if (cb.checked) s.sel.push(c.code); else s.sel = s.sel.filter(function (x) { return x !== c.code; });
        row.classList.toggle('off', !cb.checked); save(); groupUpdate(); refresh();
      });
      meta.appendChild(el('label', null, [cb, t('took')]));
    }
    var uid = yid + '-' + c.code;
    var mk = el('input', { class: 'in num', id: 'm-' + uid, type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: t('marksPh'), value: e.m || '', 'aria-label': c.name + ' · ' + t('marksOf', { m: n(full) }), title: t('marksOf', { m: n(full) }) });
    var sel = gradeSelect(e.g || '', t('gradeFor', { c: c.name })); sel.id = 'g-' + uid;
    mk.addEventListener('input', function () {
      var raw = mk.value, v = C.parseNum(raw), gr = raw.trim() === '' ? null : C.gradeFromMarks(v, full);
      var bad = raw.trim() !== '' && !gr;
      mk.setAttribute('aria-invalid', String(bad)); mk.title = bad ? t('marksErr', { m: n(full) }) : t('marksOf', { m: n(full) });
      s.c[c.code] = { g: gr ? gr.letter : '', m: raw }; sel.value = gr ? gr.letter : ''; paintSel(sel);
      save(); refresh();
    });
    mk.addEventListener('blur', function () { if (mk.getAttribute('aria-invalid') === 'true') toast(t('marksErr', { m: n(full) })); });
    sel.addEventListener('change', function () { s.c[c.code] = { g: sel.value, m: '' }; mk.value = ''; mk.removeAttribute('aria-invalid'); paintSel(sel); save(); refresh(); });
    row.appendChild(el('div', { class: 'ctl' }, [mk, sel]));
    return row;
  }

  function renderScale() {
    var tb = el('tbody');
    D.grades.forEach(function (g) {
      tb.appendChild(el('tr', null, [el('td', { class: 'num', text: g.min === 0 ? '< ' + n(40) : n(g.min) + '–' + n(g.max) }),
        el('td', null, [el('span', { class: 'badge', style: 'background:' + GCOL[g.letter] + ';color:' + (DARKTXT[g.letter] ? '#2a2420' : '#fff') + ';height:24px;font-size:.82rem', text: g.letter })]),
        el('td', { class: 'num', text: n(g.point.toFixed(2)) })]));
    });
    return el('div', { class: 'more' }, [el('details', { class: 'card' }, [
      el('summary', { text: t('scale') }),
      el('div', { class: 'scale-body' }, [
        el('table', null, [el('thead', null, [el('tr', null, [el('th', { scope: 'col', text: t('scaleMarks') }), el('th', { scope: 'col', text: t('scaleLetter') }), el('th', { scope: 'col', text: t('scalePoint') })])]), tb]),
        el('ul', { class: 'how' }, [el('li', { text: t('how1') }), el('li', { text: t('how2') }), el('li', { text: t('how3') })])
      ])
    ])]);
  }

  // live updates
  function refresh() {
    if (!state.session) return;
    var c = cgpa();
    var v = document.getElementById('cgVal');
    if (v) {
      countUp(v, c.cgpa); v.classList.toggle('dim', c.cgpa === null);
      var L = document.getElementById('cgLetter'); L.textContent = c.letter || '–'; L.hidden = !c.letter;
      var used = HON.filter(function (id) { var r = yearResult(id); return r.gpa !== null && r.credits > 0; }).length;
      document.getElementById('cgSub').textContent = c.cgpa === null ? t('cgpaEmpty') : t('fromYears', { n: n(used), c: n(c.credits) });
    }
    ALL.forEach(function (id) { var s = document.querySelector('[data-ygpa="' + id + '"]'); if (s) { var r = yearResult(id); s.textContent = r.gpa === null ? '·' : f2(r.gpa); } });
    var yid = state.year, r = yearResult(yid), y = C.yearFor(D, state.session, yid);
    var yv = document.getElementById('yVal');
    if (yv) {
      countUp(yv, r.gpa);
      document.getElementById('yLetter').textContent = r.gpa === null ? t('gpa') : t('gpa') + ' · ' + r.letter;
      var total = r.manual ? r.credits : r.totalCredits;
      document.getElementById('yBar').style.width = (total ? Math.min(100, (r.credits / total) * 100) : 0) + '%';
      var f = document.getElementById('yFacts'); f.innerHTML = '';
      f.appendChild(el('span', { class: 'num', text: t('creditsOf', { a: n(r.credits), b: n(total || (y ? y.totalCredits : 0)) }) }));
      if (!r.manual && r.graded) f.appendChild(el('span', { class: r.fails ? 'bad' : 'good', text: r.fails ? t('fails', { n: n(r.fails) }) : t('noFails') }));
      var mn = document.getElementById('mNote'); if (mn) { mn.textContent = r.needCredits ? t('manualNeedCredits') : t('manualNote'); }
    }
    drawBars(); drawMix();
  }

  // ---------- header controls ----------
  document.getElementById('langBtn').addEventListener('click', function () { state.lang = state.lang === 'en' ? 'bn' : 'en'; save(); applyLang(); render(); });
  document.getElementById('sessionBtn').addEventListener('click', openSessionDialog);
  document.getElementById('themeBtn').addEventListener('click', function () {
    var r = document.documentElement, dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    r.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('nuStatsCgpa.theme', r.dataset.theme); } catch (e) {}
  });
  document.querySelector('.mark').addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });

  applyLang();
  render();
})();
