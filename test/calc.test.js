// node test/calc.test.js
const assert = require('assert');
const C = require('../calc.js');
const D = require('../data.js');
let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok -', name); };

t('Bangla digits', () => {
  assert.strictEqual(C.toAscii('৭৮'), '78');
  assert.strictEqual(C.parseNum('৩.৭৫'), 3.75);
  assert.strictEqual(C.parseNum('৬৫'), 65);
  assert.ok(Number.isNaN(C.parseNum('abc')));
  assert.ok(Number.isNaN(C.parseNum('')));
  assert.strictEqual(C.toBangla('3.25'), '৩.২৫');
});

t('percent -> grade boundaries', () => {
  const cases = [[100,'A+'],[80,'A+'],[79,'A'],[75,'A'],[74,'A-'],[70,'A-'],[69,'B+'],[65,'B+'],
    [64,'B'],[60,'B'],[59,'B-'],[55,'B-'],[54,'C+'],[50,'C+'],[49,'C'],[45,'C'],[44,'D'],[40,'D'],[39,'F'],[0,'F']];
  cases.forEach(([p, l]) => assert.strictEqual(C.gradeFromPercent(p).letter, l, `${p}`));
  assert.strictEqual(C.gradeFromPercent(101), null);
  assert.strictEqual(C.gradeFromPercent(-1), null);
});

t('letter from GPA', () => {
  assert.strictEqual(C.letterFromGPA(4), 'A+');
  assert.strictEqual(C.letterFromGPA(3.74), 'A-');
  assert.strictEqual(C.letterFromGPA(3.75), 'A');
  assert.strictEqual(C.letterFromGPA(2.0), 'D');
  assert.strictEqual(C.letterFromGPA(1.99), 'F');
  assert.strictEqual(C.letterFromGPA(null), null);
});

t('mixed grades weighted by credits', () => {
  const r = C.computeGPA([{credits:4,letter:'A+'},{credits:4,letter:'B'},{credits:2,letter:'F'}]);
  assert.strictEqual(r.gpa, 2.8); assert.strictEqual(r.fails, 1); assert.strictEqual(r.letter, 'B-');
  assert.strictEqual(C.computeGPA([{credits:3,letter:'A'},{credits:1,letter:'B+'}]).gpa, 3.63);
});

t('ungraded and unselected courses are excluded', () => {
  const r = C.computeGPA([{credits:4,letter:'A'},{credits:4,letter:''},{credits:4,letter:'F',counted:false}]);
  assert.strictEqual(r.gpa, 3.75); assert.strictEqual(r.credits, 4); assert.strictEqual(r.totalCredits, 8);
});

t('CGPA weighted by yearly credits, ignores missing years', () => {
  const r = C.computeCGPA([{gpa:3.5,credits:36},{gpa:3.25,credits:38},{gpa:3.0,credits:32},{gpa:3.75,credits:40}]);
  assert.strictEqual(r.cgpa, 3.39); assert.strictEqual(r.credits, 146); assert.strictEqual(r.letter, 'B+');
  const r2 = C.computeCGPA([{gpa:3.5,credits:36},{gpa:null,credits:38},{gpa:5,credits:32}]);
  assert.strictEqual(r2.cgpa, 3.5); assert.strictEqual(r2.credits, 36);
  assert.strictEqual(C.computeCGPA([]).cgpa, null);
});

t('14 sessions, 2013-14 .. 2026-27, mapped to the right era', () => {
  assert.strictEqual(D.sessions.length, 14);
  assert.strictEqual(D.sessions[0].id, '2013-2014');
  assert.strictEqual(D.sessions[13].id, '2026-2027');
  for (let y = 2013; y <= 2023; y++) assert.strictEqual(C.eraForSession(D, `${y}-${y + 1}`), 'old', y);
  for (let y = 2024; y <= 2026; y++) assert.strictEqual(C.eraForSession(D, `${y}-${y + 1}`), 'new', y);
  assert.strictEqual(C.eraForSession(D, '2012-2013'), null);
});

t('old era (2013-14 syllabus) year credits match NU', () => {
  const exp = { y1: 28, y2: 28, y3: 32, y4: 40, ms: 36 };
  Object.entries(exp).forEach(([y, cr]) => {
    const yr = C.yearFor(D, '2019-2020', y);
    assert.ok(yr, y); assert.strictEqual(yr.totalCredits, cr, y);
  });
  const y1 = C.yearFor(D, '2013-2014', 'y1');
  assert.strictEqual(y1.courses[0].code, '213601');
  assert.strictEqual(y1.courses[0].name, 'Introductory Statistics');
  const y2 = C.yearFor(D, '2023-2024', 'y2');
  const eng = y2.courses.find(c => c.code === '221109');
  assert.ok(eng.nonCredit, 'English (Compulsory) is non-credit');
});

t('new era (2024-25 syllabus): 1st/2nd published, 3rd/4th/Masters not yet', () => {
  assert.strictEqual(C.yearFor(D, '2024-2025', 'y1').totalCredits, 36);
  assert.strictEqual(C.yearFor(D, '2025-2026', 'y2').totalCredits, 38);
  assert.strictEqual(C.yearFor(D, '2026-2027', 'y1').courses[0].name, 'Introduction to Statistics');
  ['y3', 'y4', 'ms'].forEach(y => assert.strictEqual(C.yearFor(D, '2024-2025', y), null, y));
});

t('every year: fixed + optional picks add up to totalCredits; codes unique', () => {
  Object.values(D.eras).forEach(era => Object.entries(era.years).forEach(([id, y]) => {
    if (!y) return;
    const codes = new Set(y.courses.map(c => c.code));
    assert.strictEqual(codes.size, y.courses.length, id);
    const fixed = y.courses.filter(c => !c.pick && !c.nonCredit).reduce((s, c) => s + c.credits, 0);
    const groups = {};
    y.courses.filter(c => c.pick).forEach(c => { (groups[c.section] ||= []).push(c); });
    const opt = Object.values(groups).reduce((s, g) => s + g.slice(0, g[0].pick).reduce((a, c) => a + c.credits, 0), 0);
    assert.strictEqual(fixed + opt, y.totalCredits, era.id + ' ' + id);
    assert.ok(/^https:\/\/www\.nu\.ac\.bd\//.test(y.source), 'official source for ' + id);
  }));
});

t('old 1st year all A+ = 4.00 over 28 credits', () => {
  const y1 = C.yearFor(D, '2018-2019', 'y1');
  const r = C.computeGPA(y1.courses.map(c => ({ credits: c.credits, letter: 'A+', counted: !c.nonCredit })));
  assert.strictEqual(r.gpa, 4); assert.strictEqual(r.credits, 28);
});

t('grade distribution', () => {
  const d = C.gradeDistribution(['A+', 'A', 'A', 'F', 'x']);
  assert.strictEqual(d['A+'], 1); assert.strictEqual(d.A, 2); assert.strictEqual(d.F, 1); assert.strictEqual(d.B, 0);
  assert.strictEqual(Object.keys(d).length, 10);
});


t('session groups split old then new, and unpublished years are flagged', () => {
  const g = C.sessionGroups(D);
  assert.strictEqual(g.length, 2);
  assert.strictEqual(g[0].era, 'old');
  assert.strictEqual(g[0].sessions.length, 11);
  assert.strictEqual(g[0].sessions[0].id, '2013-2014');
  assert.strictEqual(g[0].sessions[10].id, '2023-2024');
  assert.strictEqual(g[1].era, 'new');
  assert.deepStrictEqual(g[1].sessions.map(s => s.id), ['2024-2025', '2025-2026', '2026-2027']);
  assert.strictEqual(C.yearPublished(D, '2023-2024', 'y4'), true);
  assert.strictEqual(C.yearPublished(D, '2023-2024', 'ms'), true);
  assert.strictEqual(C.yearPublished(D, '2024-2025', 'y1'), true);
  assert.strictEqual(C.yearPublished(D, '2024-2025', 'y2'), true);
  assert.strictEqual(C.yearPublished(D, '2024-2025', 'y3'), false);
  assert.strictEqual(C.yearPublished(D, '2024-2025', 'y4'), false);
  assert.strictEqual(C.yearPublished(D, '2024-2025', 'ms'), false);
  assert.strictEqual(C.yearPublished(D, '2012-2013', 'y1'), false);
});

t('official year totals exclude non-credit English and unchosen optionals', () => {
  const y2 = C.officialYearTotals(C.yearFor(D, '2023-2024', 'y2'));
  assert.strictEqual(y2.creditMarks, 700);
  assert.strictEqual(y2.credits, 28);
  assert.strictEqual(y2.nonCredit.length, 1);
  assert.strictEqual(y2.nonCredit[0].code, '221109');
  assert.strictEqual(y2.nonCredit[0].marks, 100);
  const y1 = C.officialYearTotals(C.yearFor(D, '2023-2024', 'y1'));
  assert.strictEqual(y1.creditMarks, 700);
  assert.strictEqual(y1.nonCredit.length, 0);
  const y4 = C.officialYearTotals(C.yearFor(D, '2023-2024', 'y4'));
  assert.strictEqual(y4.creditMarks, 1000);
  assert.strictEqual(y4.credits, 40);
  const ny1 = C.officialYearTotals(C.yearFor(D, '2024-2025', 'y1'));
  assert.strictEqual(ny1.creditMarks, 900);
  const ny2 = C.officialYearTotals(C.yearFor(D, '2024-2025', 'y2'));
  assert.strictEqual(ny2.creditMarks, 950);
  assert.strictEqual(C.officialYearTotals(null), null);
});

t('target GPA planner covers met, possible, impossible, and invalid cases', () => {
  const even = C.requiredGpa(3.5, 36, 36, 3.75);
  assert.strictEqual(even.ok, true);
  assert.strictEqual(even.required, 4);
  assert.strictEqual(even.possible, true);
  assert.strictEqual(even.alreadyMet, false);
  const hard = C.requiredGpa(3.5, 36, 36, 3.9);
  assert.strictEqual(hard.possible, false);
  assert.strictEqual(hard.error, 'impossible');
  assert.strictEqual(hard.required, 4.3);
  const met = C.requiredGpa(3.8, 100, 8, 3.5);
  assert.strictEqual(met.alreadyMet, true);
  assert.strictEqual(met.required, 0);
  const done = C.requiredGpa(3.5, 128, 0, 3.5);
  assert.strictEqual(done.alreadyMet, true);
  assert.strictEqual(done.required, null);
  const stuck = C.requiredGpa(3.0, 128, 0, 3.5);
  assert.strictEqual(stuck.possible, false);
  assert.strictEqual(stuck.error, 'no-remaining');
  assert.strictEqual(C.requiredGpa(3, 10, 10, 5).error, 'invalid');
  assert.strictEqual(C.requiredGpa(3, -1, 10, 3).error, 'invalid');
  assert.strictEqual(C.requiredGpa(null, 10, 10, 3).error, 'invalid');
});

t('remaining honours credits treat unpublished years as unknown', () => {
  const oldDone = C.remainingHonours(D, '2023-2024', {
    y1: { gpa: 3.5, credits: 28, totalCredits: 28 },
    y2: { gpa: 3.25, credits: 28, totalCredits: 28 }
  });
  assert.strictEqual(oldDone.earned, 56);
  assert.strictEqual(oldDone.remaining, 72);
  assert.strictEqual(oldDone.unknown, false);
  const partial = C.remainingHonours(D, '2023-2024', {
    y1: { gpa: 3.5, credits: 16, totalCredits: 28 }
  });
  assert.strictEqual(partial.earned, 16);
  assert.strictEqual(partial.remaining, 12 + 28 + 32 + 40);
  const neu = C.remainingHonours(D, '2024-2025', {
    y1: { gpa: 3.5, credits: 36, totalCredits: 36 }
  });
  assert.strictEqual(neu.earned, 36);
  assert.strictEqual(neu.remaining, 38);
  assert.strictEqual(neu.unknown, true);
});

t('export payload and import validation, including leftover marks fields', () => {
  const payload = C.exportPayload({
    lang: 'bn',
    session: '2023-2024',
    year: 'y2',
    data: { '2023-2024': { y1: { c: { '213601': { g: 'A+', m: '85' } }, sel: null, manual: { on: false, gpa: '', credits: '' } } } }
  }, '2026-11-15T10:00:00.000Z');
  assert.strictEqual(payload.app, 'nu-stats-cgpa-calculator');
  assert.strictEqual(payload.v, 2);
  assert.strictEqual(payload.exportedAt, '2026-11-15T10:00:00.000Z');
  assert.strictEqual(payload.lang, 'bn');
  const parsed = C.parseImport(JSON.stringify(payload));
  assert.strictEqual(parsed.ok, true);
  assert.strictEqual(parsed.state.lang, 'bn');
  assert.strictEqual(parsed.state.session, '2023-2024');
  assert.deepStrictEqual(parsed.state.data['2023-2024'].y1.c['213601'], { g: 'A+' });
  assert.strictEqual(parsed.state.data['2023-2024'].y1.c['213601'].m, undefined);
  const raw = C.parseImport({ lang: 'en', session: '2024-2025', year: 'y1', data: { '2024-2025': { y1: { c: { '213601': { g: 'B', m: '60' } } } } } });
  assert.strictEqual(raw.ok, true);
  assert.deepStrictEqual(raw.state.data['2024-2025'].y1.c['213601'], { g: 'B' });
  assert.strictEqual(C.parseImport('not-json').error, 'invalid-json');
  assert.strictEqual(C.parseImport('{}').error, 'invalid-shape');
  assert.strictEqual(C.parseImport({ lang: 'fr', session: '2023-2024', data: {} }).error, 'invalid-lang');
  assert.strictEqual(C.parseImport({ lang: 'en', year: 'y9', data: {} }).error, 'invalid-year');
});

t('import drops unknown grades and prototype keys', () => {
  const r = C.parseImport('{"data":{"__proto__":{"y1":{}},"2023-2024":{"y1":{"c":{"__proto__":{"g":"A+"},"213601":{"g":"Z"},"213603":"B","213604":{"g":"<img src=x>"}}}}}}');
  assert.strictEqual(r.ok, true);
  assert.strictEqual(Object.getPrototypeOf(r.state.data), Object.prototype);
  assert.deepStrictEqual(Object.keys(r.state.data), ['2023-2024']);
  const c = r.state.data['2023-2024'].y1.c;
  assert.deepStrictEqual(Object.keys(c), ['213603']);
  assert.strictEqual(Object.getPrototypeOf(c), Object.prototype);
  assert.strictEqual(({}).g, undefined);
});

t('old saved data with custom courses loads, custom courses are dropped', () => {
  const r = C.parseImport({ lang: 'en', session: '2023-2024', year: 'y1', data: { '2023-2024': { y1: { c: { '213601': { g: 'A' } }, custom: [{ name: 'Extra', credits: 4, g: 'A+' }] } } } });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.state.data['2023-2024'].y1.custom, undefined);
  assert.deepStrictEqual(r.state.data['2023-2024'].y1.c, { '213601': { g: 'A' } });
});

t('honours and masters never feed into each other', () => {
  assert.deepStrictEqual(C.LEVELS.hons, ['y1', 'y2', 'y3', 'y4']);
  assert.deepStrictEqual(C.LEVELS.ms, ['ms']);
  assert.strictEqual(C.levelOf('ms'), 'ms');
  assert.strictEqual(C.levelOf('y4'), 'hons');
  const yrs = { y1: { gpa: 3.0, credits: 28 }, y2: { gpa: 3.0, credits: 28 }, ms: { gpa: 4.0, credits: 36 } };
  const h = C.levelCgpa(yrs, 'hons');
  assert.strictEqual(h.cgpa, 3.0);
  assert.strictEqual(h.credits, 56);
  const m = C.levelCgpa(yrs, 'ms');
  assert.strictEqual(m.cgpa, 4.0);
  assert.strictEqual(m.credits, 36);
  assert.strictEqual(C.levelCgpa({ ms: { gpa: 4, credits: 36 } }, 'hons').cgpa, null);
  assert.strictEqual(C.levelCgpa({ y1: { gpa: 3, credits: 28 } }, 'ms').cgpa, null);
  const letters = { y1: ['A', 'B'], y4: ['A+'], ms: ['F', 'F'] };
  assert.deepStrictEqual(C.levelLetters(letters, 'hons'), ['A', 'B', 'A+']);
  assert.deepStrictEqual(C.levelLetters(letters, 'ms'), ['F', 'F']);
  // remaining-credit planner only looks at honours years
  const rem = C.remainingHonours(D, '2023-2024', { y1: { gpa: 3, credits: 28, totalCredits: 28 }, ms: { gpa: 4, credits: 36, totalCredits: 36 } });
  assert.strictEqual(rem.earned, 28);
  assert.strictEqual(rem.remaining, 28 + 32 + 40);
});

t('old saves with Masters as the open tab migrate to the Masters section', () => {
  const r = C.parseImport({ lang: 'en', session: '2023-2024', year: 'ms', data: { '2023-2024': { ms: { c: { '313601': { g: 'A' } } }, y1: { c: { '213601': { g: 'B' } } } } } });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.state.level, 'ms');
  assert.strictEqual(r.state.year, 'y1');
  assert.deepStrictEqual(r.state.data['2023-2024'].ms.c, { '313601': { g: 'A' } });
  assert.deepStrictEqual(r.state.data['2023-2024'].y1.c, { '213601': { g: 'B' } });
  assert.strictEqual(C.parseImport({ session: '2023-2024', year: 'y2', data: {} }).state.level, 'hons');
  assert.strictEqual(C.parseImport({ level: 'ms', data: {} }).state.level, 'ms');
  assert.strictEqual(C.parseImport({ level: 'phd', data: {} }).error, 'invalid-level');
  const p = C.exportPayload({ lang: 'en', session: '2023-2024', year: 'y1', level: 'ms', data: {} });
  assert.strictEqual(p.level, 'ms');
});

// ---- pro-upgrade additions ----

t('running CGPA follows the year results in order', () => {
  assert.deepStrictEqual(C.runningCgpa([{ gpa: 3.75, credits: 28 }, { gpa: 3.25, credits: 28 }, { gpa: 3.5, credits: 32 }]), [3.75, 3.5, 3.5]);
  // a year with no GPA keeps the previous value, and nothing before the first graded year
  assert.deepStrictEqual(C.runningCgpa([null, { gpa: 4, credits: 28 }, { gpa: null, credits: 0 }]), [null, 4, 4]);
  assert.deepStrictEqual(C.runningCgpa([]), []);
  // the last value always equals computeCGPA over the same years
  const ys = [{ gpa: 3.12, credits: 28 }, { gpa: 3.87, credits: 28 }, { gpa: 2.95, credits: 32 }, { gpa: 3.4, credits: 40 }];
  assert.strictEqual(C.runningCgpa(ys)[3], C.computeCGPA(ys).cgpa);
});

t('what-if projections use the NU grade points and leave F out', () => {
  const rows = C.projectCgpa(3.5, 88, 40);
  assert.deepStrictEqual(rows.map(r => r.letter), ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D']);
  assert.strictEqual(rows[0].cgpa, C.round2((3.5 * 88 + 4 * 40) / 128));
  assert.strictEqual(rows[2].cgpa, 3.5); // same grade as now keeps the CGPA
  assert.strictEqual(rows[0].finalLetter, C.letterFromGPA(rows[0].cgpa));
  // agrees with the planner: averaging the GPA it asks for reaches the target
  const need = C.requiredGpa(3.2, 56, 72, 3.5).required;
  assert.ok(C.round2((3.2 * 56 + need * 72) / 128) >= 3.5 - 0.005);
  assert.deepStrictEqual(C.projectCgpa(3.5, 88, 0), []);
  assert.deepStrictEqual(C.projectCgpa(5, 88, 40), []);
  assert.deepStrictEqual(C.projectCgpa(NaN, 88, 40), []);
});

t('CSV export has one row per syllabus course with the right points', () => {
  const saved = { '2023-2024': { y1: { c: { '213601': { g: 'A' }, '213603': { g: 'F' } } }, y4: { c: {}, sel: ['243611', '243615'] } } };
  const lines = C.gradesCsv(D, '2023-2024', saved).trim().split('\r\n');
  assert.strictEqual(lines[0], 'session,year,code,course,credits,counted,grade,point');
  const y1 = C.yearFor(D, '2023-2024', 'y1');
  assert.strictEqual(lines.filter(l => l.startsWith('2023-2024,y1,')).length, y1.courses.length);
  assert.ok(lines.includes('2023-2024,y1,213601,Introductory Statistics,4,yes,A,3.75'));
  assert.ok(lines.some(l => l.startsWith('2023-2024,y1,213603,') && l.endsWith(',F,0.00')));
  // non-credit English is listed with 0 credits and never counted
  assert.ok(lines.some(l => l.startsWith('2023-2024,y2,221109,') && l.includes(',0,no,')));
  // saved optional picks are respected
  assert.ok(lines.some(l => l.startsWith('2023-2024,y4,243615,') && l.includes(',yes,')));
  assert.ok(lines.some(l => l.startsWith('2023-2024,y4,243613,') && l.includes(',no,')));
  // new-syllabus sessions only list the published years
  const csvNew = C.gradesCsv(D, '2024-2025', {});
  assert.ok(!/,y3,/.test(csvNew) && /,y1,/.test(csvNew));
});

t('CSV parsing handles quotes and BOM, cells that look like formulas are neutralised', () => {
  const rows = C.parseCsv('a,b\r\n"x, y","he said ""hi"""\n');
  assert.deepStrictEqual(rows, [['a', 'b'], ['x, y', 'he said "hi"']]);
  assert.deepStrictEqual(C.parseCsv('\uFEFFyear,code,grade\ny1,213601,A'), [['year', 'code', 'grade'], ['y1', '213601', 'A']]);
  assert.strictEqual(C.csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.strictEqual(C.csvCell('Lab 1: Descriptive Statistics'), 'Lab 1: Descriptive Statistics');
  assert.strictEqual(C.csvCell('a,b'), '"a,b"');
});

t('CSV round trip restores the same grades', () => {
  const saved = { '2023-2024': { y1: { c: { '213601': { g: 'A+' }, '213604': { g: 'B-' } } }, ms: { c: { '313601': { g: 'A' } } } } };
  const r = C.importGradesCsv(D, null, C.gradesCsv(D, '2023-2024', saved));
  assert.ok(r.ok);
  assert.strictEqual(r.session, '2023-2024');
  assert.strictEqual(r.count, 3);
  assert.strictEqual(r.skipped, 0);
  assert.deepStrictEqual(r.years.y1.c, { '213601': { g: 'A+' }, '213604': { g: 'B-' } });
  assert.deepStrictEqual(r.years.ms.c, { '313601': { g: 'A' } });
});

t('hand-typed CSV: unknown codes and grades are skipped, bad files are refused', () => {
  const r = C.importGradesCsv(D, '2023-2024', 'Year,Code,Grade\ny1,213601,a+\ny1,999999,A\ny1,213603,Z\ny9,213601,A\n');
  assert.ok(r.ok);
  assert.deepStrictEqual(r.years.y1.c, { '213601': { g: 'A+' } });
  assert.strictEqual(r.skipped, 3);
  assert.strictEqual(C.importGradesCsv(D, '2023-2024', 'code,grade\n213601,A').error, 'columns');
  assert.strictEqual(C.importGradesCsv(D, '2023-2024', '').error, 'empty');
  assert.strictEqual(C.importGradesCsv(D, null, 'year,code,grade\ny1,213601,A').error, 'session');
  assert.strictEqual(C.importGradesCsv(D, '2023-2024', 'session,year,code,grade\n2023-2024,y1,213601,A\n2022-2023,y1,213601,B').error, 'many-sessions');
  assert.strictEqual(C.importGradesCsv(D, '2023-2024', 'year,code,grade\ny1,213601,\n').error, 'no-grades');
  // __proto__ as a code is just an unknown code
  const p = C.importGradesCsv(D, '2023-2024', 'year,code,grade\ny1,__proto__,A\ny1,213601,A');
  assert.ok(p.ok && p.skipped === 1 && !Object.prototype.hasOwnProperty.call(p.years.y1.c, '__proto__'));
});

console.log(`\nAll ${n} test groups passed.`);
