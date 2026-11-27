/* All the GPA/CGPA maths. No DOM here, so the tests can load it in Node too. */
(function (root) {
  'use strict';

  var GRADES = [
    { letter: 'A+', point: 4.0, min: 80 },
    { letter: 'A', point: 3.75, min: 75 },
    { letter: 'A-', point: 3.5, min: 70 },
    { letter: 'B+', point: 3.25, min: 65 },
    { letter: 'B', point: 3.0, min: 60 },
    { letter: 'B-', point: 2.75, min: 55 },
    { letter: 'C+', point: 2.5, min: 50 },
    { letter: 'C', point: 2.25, min: 45 },
    { letter: 'D', point: 2.0, min: 40 },
    { letter: 'F', point: 0.0, min: 0 }
  ];

  var BN = '০১২৩৪৫৬৭৮৯';

  // Bangla digits -> ASCII (people type ৩.৫০ a lot)
  function toAscii(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/[০-৯]/g, function (d) { return String(BN.indexOf(d)); })
      .replace(/[٫,]/g, '.')
      .trim();
  }

  // and back again
  function toBangla(str) {
    return String(str).replace(/[0-9]/g, function (d) { return BN[+d]; });
  }

  // NaN when empty or not a number
  function parseNum(str) {
    var s = toAscii(str);
    if (s === '' || !/^\d*\.?\d+$|^\d+\.$/.test(s)) return NaN;
    return parseFloat(s);
  }

  function round2(x) {
    return Math.round((x + 1e-9) * 100) / 100;
  }

  function gradeByLetter(letter) {
    for (var i = 0; i < GRADES.length; i++) if (GRADES[i].letter === letter) return GRADES[i];
    return null;
  }

  function gradeFromPercent(pct) {
    if (typeof pct !== 'number' || !(pct >= 0) || pct > 100) return null;
    for (var i = 0; i < GRADES.length; i++) if (pct >= GRADES[i].min) return GRADES[i];
    return GRADES[GRADES.length - 1];
  }

  function letterFromGPA(gpa) {
    if (typeof gpa !== 'number' || !(gpa >= 0)) return null;
    var g = round2(gpa);
    for (var i = 0; i < GRADES.length; i++) {
      if (GRADES[i].point > 0 && g >= GRADES[i].point) return GRADES[i].letter;
    }
    return 'F';
  }

  // entries: [{ credits, letter, counted }]. Ungraded or unticked ones are skipped.
  function computeGPA(entries) {
    var credits = 0, weighted = 0, fails = 0, graded = 0, countedCredits = 0;
    entries.forEach(function (e) {
      if (e.counted === false) return;
      countedCredits += e.credits;
      var g = e.letter ? gradeByLetter(e.letter) : null;
      if (!g) return;
      graded++;
      credits += e.credits;
      weighted += e.credits * g.point;
      if (g.point === 0) fails++;
    });
    var gpa = credits > 0 ? round2(weighted / credits) : null;
    return {
      gpa: gpa,
      letter: gpa === null ? null : letterFromGPA(gpa),
      credits: credits,
      totalCredits: countedCredits,
      fails: fails,
      graded: graded,
      weighted: weighted
    };
  }

  function computeCGPA(years) {
    var credits = 0, weighted = 0;
    years.forEach(function (y) {
      if (y && typeof y.gpa === 'number' && y.gpa >= 0 && y.gpa <= 4 && typeof y.credits === 'number' && y.credits > 0) {
        credits += y.credits;
        weighted += y.gpa * y.credits;
      }
    });
    var cgpa = credits > 0 ? round2(weighted / credits) : null;
    return { cgpa: cgpa, letter: cgpa === null ? null : letterFromGPA(cgpa), credits: credits };
  }

  var YEAR_IDS = ['y1', 'y2', 'y3', 'y4', 'ms'];
  // Honours and Masters are two different degrees, so they never share a CGPA.
  var LEVELS = { hons: ['y1', 'y2', 'y3', 'y4'], ms: ['ms'] };
  function levelOf(yearId) { return yearId === 'ms' ? 'ms' : 'hons'; }

  function levelCgpa(yearResults, level) {
    var ids = LEVELS[level] || [];
    yearResults = yearResults || {};
    return computeCGPA(ids.map(function (id) { return yearResults[id] || null; }));
  }

  function levelLetters(lettersByYear, level) {
    var out = [];
    (LEVELS[level] || []).forEach(function (id) { (lettersByYear && lettersByYear[id] || []).forEach(function (g) { out.push(g); }); });
    return out;
  }

  // 'old' = 2013-14 syllabus, 'new' = 2024-25 syllabus
  function eraForSession(data, sessionId) {
    for (var i = 0; i < data.sessions.length; i++) if (data.sessions[i].id === sessionId) return data.sessions[i].era;
    return null;
  }

  // null when NU hasn't published that year yet
  function yearFor(data, sessionId, yearId) {
    var era = eraForSession(data, sessionId);
    if (!era) return null;
    return data.eras[era].years[yearId] || null;
  }

  function gradeDistribution(letters) {
    var out = {};
    GRADES.forEach(function (g) { out[g.letter] = 0; });
    letters.forEach(function (l) { if (l in out) out[l]++; });
    return out;
  }

  // Official marks/credits for a year. Non-credit English and the unpicked optionals don't count.
  function officialYearTotals(year) {
    if (!year || !Array.isArray(year.courses)) return null;
    var creditMarks = 0, hasMarks = false, nonCredit = [];
    var groups = {};
    year.courses.forEach(function (c) {
      if (c.nonCredit) {
        nonCredit.push({ code: c.code, name: c.name, marks: typeof c.marks === 'number' ? c.marks : 0 });
        return;
      }
      if (c.pick) {
        var k = c.section || '';
        if (!groups[k]) groups[k] = { pick: c.pick, items: [] };
        groups[k].items.push(c);
        return;
      }
      if (typeof c.marks === 'number') { creditMarks += c.marks; hasMarks = true; }
    });
    Object.keys(groups).forEach(function (k) {
      var g = groups[k], nPick = Math.min(g.pick, g.items.length);
      for (var i = 0; i < nPick; i++) {
        if (typeof g.items[i].marks === 'number') { creditMarks += g.items[i].marks; hasMarks = true; }
      }
    });
    return { creditMarks: hasMarks ? creditMarks : null, credits: year.totalCredits, nonCredit: nonCredit };
  }

  function yearPublished(data, sessionId, yearId) {
    return !!yearFor(data, sessionId, yearId);
  }

  function sessionGroups(data) {
    var groups = [], by = {};
    (data.sessions || []).forEach(function (s) {
      if (!by[s.era]) { by[s.era] = { era: s.era, sessions: [] }; groups.push(by[s.era]); }
      by[s.era].sessions.push(s);
    });
    return groups;
  }

  // GPA needed in the remaining credits to hit a target CGPA.
  function requiredGpa(currentCgpa, earnedCredits, remainingCredits, targetCgpa) {
    function fail(err) { return { ok: false, required: null, possible: false, alreadyMet: false, error: err }; }
    var args = [currentCgpa, earnedCredits, remainingCredits, targetCgpa];
    for (var i = 0; i < args.length; i++) {
      if (typeof args[i] !== 'number' || !isFinite(args[i])) return fail('invalid');
    }
    if (earnedCredits < 0 || remainingCredits < 0) return fail('invalid');
    if (currentCgpa < 0 || currentCgpa > 4 || targetCgpa < 0 || targetCgpa > 4) return fail('invalid');
    if (earnedCredits === 0 && remainingCredits === 0) return fail('invalid');
    if (remainingCredits === 0) {
      var met = currentCgpa + 1e-9 >= targetCgpa;
      return { ok: true, required: null, possible: met, alreadyMet: met, error: met ? null : 'no-remaining' };
    }
    var req = (targetCgpa * (earnedCredits + remainingCredits) - currentCgpa * earnedCredits) / remainingCredits;
    if (req <= 0) return { ok: true, required: 0, possible: true, alreadyMet: true, error: null };
    var reqR = round2(req);
    if (reqR > 4) return { ok: true, required: reqR, possible: false, alreadyMet: false, error: 'impossible' };
    return { ok: true, required: reqR, possible: true, alreadyMet: false, error: null };
  }

  // Honours credits done vs left. unknown = some year isn't published, so I can't count it.
  function remainingHonours(data, sessionId, yearResults) {
    var earned = 0, remaining = 0, unknown = false;
    var ids = ['y1', 'y2', 'y3', 'y4'];
    yearResults = yearResults || {};
    ids.forEach(function (id) {
      var y = yearFor(data, sessionId, id);
      var r = yearResults[id] || {};
      if (typeof r.gpa === 'number' && r.credits > 0) {
        earned += r.credits;
        if (!r.manual && typeof r.totalCredits === 'number' && r.totalCredits > r.credits) remaining += r.totalCredits - r.credits;
      } else if (y) {
        remaining += y.totalCredits;
      } else {
        unknown = true;
      }
    });
    return { earned: earned, remaining: remaining, unknown: unknown };
  }

  function exportPayload(state, now) {
    var d = now ? new Date(now) : new Date();
    return {
      app: 'nu-stats-cgpa-calculator',
      v: 2,
      exportedAt: d.toISOString(),
      lang: state && (state.lang === 'bn' || state.lang === 'en') ? state.lang : 'en',
      session: state && state.session ? state.session : null,
      year: state && state.year ? state.year : 'y1',
      level: state && state.level === 'ms' ? 'ms' : 'hons',
      data: state && state.data ? state.data : {}
    };
  }


  // CGPA after each year in order (the line on the year chart).
  // A year with no GPA yet keeps the previous value; null until the first graded year.
  function runningCgpa(years) {
    var credits = 0, weighted = 0;
    return (years || []).map(function (y) {
      if (y && typeof y.gpa === 'number' && y.gpa >= 0 && y.gpa <= 4 && typeof y.credits === 'number' && y.credits > 0) {
        credits += y.credits;
        weighted += y.gpa * y.credits;
      }
      return credits > 0 ? round2(weighted / credits) : null;
    });
  }

  // "What if" table: the final CGPA if every remaining credit earned the same grade.
  // Uses the same grade points as everything else (GRADES above), F left out on purpose.
  function projectCgpa(currentCgpa, earnedCredits, remainingCredits) {
    var ok = [currentCgpa, earnedCredits, remainingCredits].every(function (x) { return typeof x === 'number' && isFinite(x); });
    if (!ok || currentCgpa < 0 || currentCgpa > 4 || earnedCredits < 0 || remainingCredits <= 0) return [];
    var total = earnedCredits + remainingCredits;
    return GRADES.filter(function (g) { return g.point > 0; }).map(function (g) {
      var final = round2((currentCgpa * earnedCredits + g.point * remainingCredits) / total);
      return { letter: g.letter, point: g.point, cgpa: final, finalLetter: letterFromGPA(final) };
    });
  }

  // ---- CSV (grades as a spreadsheet) ----
  var CSV_COLS = ['session', 'year', 'code', 'course', 'credits', 'counted', 'grade', 'point'];

  function csvCell(v) {
    var s = v === null || v === undefined ? '' : String(v);
    // stop spreadsheet apps from treating a cell as a formula
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  // One row per course of every published year in the session (Honours and Masters),
  // so the file opens cleanly in Excel / Google Sheets.
  function gradesCsv(data, sessionId, saved) {
    var lines = [CSV_COLS.join(',')];
    var years = (saved && saved[sessionId]) || {};
    YEAR_IDS.forEach(function (yid) {
      var y = yearFor(data, sessionId, yid);
      if (!y) return;
      var ys = years[yid] || {}, c = ys.c || {}, sel = Array.isArray(ys.sel) ? ys.sel : null;
      var seen = {};
      y.courses.forEach(function (course) {
        var counted;
        if (course.nonCredit) counted = 'no';
        else if (!course.pick) counted = 'yes';
        else if (sel) counted = sel.indexOf(course.code) >= 0 ? 'yes' : 'no';
        else { seen[course.section] = (seen[course.section] || 0) + 1; counted = seen[course.section] <= course.pick ? 'yes' : 'no'; }
        var g = (c[course.code] || {}).g || '';
        var gr = g ? gradeByLetter(g) : null;
        lines.push([sessionId, yid, course.code, course.name, course.nonCredit ? 0 : course.credits, counted, g, gr ? gr.point.toFixed(2) : ''].map(csvCell).join(','));
      });
    });
    return lines.join('\r\n') + '\r\n';
  }

  // Small RFC 4180 parser: quotes, doubled quotes, CRLF or LF.
  function parseCsv(text) {
    var rows = [], row = [], cell = '', q = false, s = String(text || '').replace(/^\uFEFF/, '');
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (q) {
        if (ch === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && s[i + 1] === '\n') i++;
        row.push(cell); cell = '';
        if (row.length > 1 || row[0] !== '') rows.push(row);
        row = [];
      } else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); if (row.length > 1 || row[0] !== '') rows.push(row); }
    return rows;
  }

  // Reads a grades CSV (the one gradesCsv makes, or one typed by hand with at least
  // year, code and grade columns). Only course codes from the official syllabus are kept.
  function importGradesCsv(data, sessionId, text) {
    function fail(err) { return { ok: false, error: err, session: null, years: null, count: 0, skipped: 0 }; }
    var rows = parseCsv(text);
    if (rows.length < 2) return fail('empty');
    var head = rows[0].map(function (h) { return String(h).trim().toLowerCase(); });
    var col = {};
    CSV_COLS.forEach(function (k) { col[k] = head.indexOf(k); });
    if (col.year < 0 || col.code < 0 || col.grade < 0) return fail('columns');
    var sid = sessionId;
    if (col.session >= 0) {
      var ids = {};
      rows.slice(1).forEach(function (r) { var v = (r[col.session] || '').trim(); if (v) ids[v] = 1; });
      var keys = Object.keys(ids);
      if (keys.length > 1) return fail('many-sessions');
      if (keys.length === 1) sid = keys[0];
    }
    if (!sid || !eraForSession(data, sid)) return fail('session');
    var years = {}, count = 0, skipped = 0;
    rows.slice(1).forEach(function (r) {
      var yid = (r[col.year] || '').trim().toLowerCase();
      var code = (r[col.code] || '').trim().replace(/^'/, '');
      var g = (r[col.grade] || '').trim().toUpperCase();
      var y = YEAR_IDS.indexOf(yid) >= 0 ? yearFor(data, sid, yid) : null;
      var course = null;
      if (y) for (var i = 0; i < y.courses.length; i++) if (y.courses[i].code === code) { course = y.courses[i]; break; }
      if (course && course.nonCredit) return; // listed for completeness, never graded
      if (!course || (g !== '' && !gradeByLetter(g))) { skipped++; return; }
      var out = years[yid] || (years[yid] = { c: {}, picked: [], unpicked: [] });
      if (g) { out.c[code] = { g: g }; count++; }
      if (course.pick && col.counted >= 0) {
        var cv = (r[col.counted] || '').trim().toLowerCase();
        if (cv === 'yes' || cv === 'y' || cv === '1' || cv === 'true') out.picked.push(code);
        else if (cv === 'no' || cv === 'n' || cv === '0' || cv === 'false') out.unpicked.push(code);
      }
    });
    if (!count) return fail('no-grades');
    return { ok: true, error: null, session: sid, years: years, count: count, skipped: skipped };
  }

  var BAD_KEYS = ['__proto__', 'constructor', 'prototype'];
  function safeKey(k) { return BAD_KEYS.indexOf(k) < 0; }
  function validLetter(g) { return g === '' || !!gradeByLetter(g); }

  function sanitizeSavedData(data) {
    var out = {};
    if (!data || typeof data !== 'object' || Array.isArray(data)) return out;
    Object.keys(data).forEach(function (sid) {
      if (!safeKey(sid)) return;
      var years = data[sid];
      if (!years || typeof years !== 'object') return;
      out[sid] = {};
      Object.keys(years).forEach(function (yid) {
        if (YEAR_IDS.indexOf(yid) < 0) return;
        var y = years[yid];
        if (y == null) { out[sid][yid] = null; return; }
        if (typeof y !== 'object') return;
        var c = {};
        if (y.c && typeof y.c === 'object') {
          Object.keys(y.c).forEach(function (code) {
            if (!safeKey(code)) return;
            var e = y.c[code];
            var g = e && typeof e === 'object' ? e.g : e;
            if (typeof g === 'string' && validLetter(g)) c[code] = { g: g };
          });
        }
        var manual = { on: false, gpa: '', credits: '' };
        if (y.manual && typeof y.manual === 'object') {
          manual.on = !!y.manual.on;
          if (y.manual.gpa != null) manual.gpa = String(y.manual.gpa);
          if (y.manual.credits != null) manual.credits = String(y.manual.credits);
        }
        var sel = null;
        if (Array.isArray(y.sel)) sel = y.sel.filter(function (x) { return typeof x === 'string'; });
        out[sid][yid] = { c: c, sel: sel, manual: manual };
      });
    });
    return out;
  }

  // Used for both localStorage and backup files, so treat everything as untrusted.
  // Old saves can have marks or custom courses; those just get dropped.
  function parseImport(input) {
    var obj = input;
    if (typeof input === 'string') {
      var s = input.trim();
      if (!s) return { ok: false, error: 'invalid-json', state: null };
      try { obj = JSON.parse(s); } catch (e) { return { ok: false, error: 'invalid-json', state: null }; }
    }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { ok: false, error: 'invalid-shape', state: null };
    var lang = obj.lang, session = obj.session, year = obj.year, data = obj.data, level = obj.level;
    if (lang != null && lang !== 'en' && lang !== 'bn') return { ok: false, error: 'invalid-lang', state: null };
    if (session != null && typeof session !== 'string') return { ok: false, error: 'invalid-session', state: null };
    if (year != null && year !== '' && YEAR_IDS.indexOf(year) < 0) return { ok: false, error: 'invalid-year', state: null };
    if (level != null && level !== 'hons' && level !== 'ms') return { ok: false, error: 'invalid-level', state: null };
    if (data == null) return { ok: false, error: 'invalid-shape', state: null };
    if (typeof data !== 'object' || Array.isArray(data)) return { ok: false, error: 'invalid-shape', state: null };
    return {
      ok: true,
      error: null,
      state: {
        lang: lang === 'bn' || lang === 'en' ? lang : null,
        session: session || null,
        // Masters used to be a 5th tab
        year: year === 'ms' ? 'y1' : (year && YEAR_IDS.indexOf(year) >= 0 ? year : null),
        level: level === 'ms' || year === 'ms' ? 'ms' : 'hons',
        data: sanitizeSavedData(data)
      }
    };
  }

  var api = {
    YEAR_IDS: YEAR_IDS,
    LEVELS: LEVELS,
    levelOf: levelOf,
    levelCgpa: levelCgpa,
    levelLetters: levelLetters,
    eraForSession: eraForSession,
    yearFor: yearFor,
    officialYearTotals: officialYearTotals,
    yearPublished: yearPublished,
    sessionGroups: sessionGroups,
    requiredGpa: requiredGpa,
    remainingHonours: remainingHonours,
    exportPayload: exportPayload,
    parseImport: parseImport,
    gradeDistribution: gradeDistribution,
    runningCgpa: runningCgpa,
    projectCgpa: projectCgpa,
    gradesCsv: gradesCsv,
    parseCsv: parseCsv,
    csvCell: csvCell,
    importGradesCsv: importGradesCsv,
    GRADES: GRADES,
    toAscii: toAscii,
    toBangla: toBangla,
    parseNum: parseNum,
    round2: round2,
    gradeByLetter: gradeByLetter,
    gradeFromPercent: gradeFromPercent,
    letterFromGPA: letterFromGPA,
    computeGPA: computeGPA,
    computeCGPA: computeCGPA
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NUCalc = api;
})(typeof self !== 'undefined' ? self : this);
