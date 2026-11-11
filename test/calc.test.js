// Run: node test/calc.test.js
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

t('marks out of 50/75/25 scale correctly', () => {
  assert.strictEqual(C.gradeFromMarks(40, 50).letter, 'A+');
  assert.strictEqual(C.gradeFromMarks(37, 50).letter, 'A-');
  assert.strictEqual(C.gradeFromMarks(19, 50).letter, 'F');
  assert.strictEqual(C.gradeFromMarks(60, 75).letter, 'A+');
  assert.strictEqual(C.gradeFromMarks(10, 25).letter, 'D');
  assert.strictEqual(C.gradeFromMarks(51, 50), null);
  assert.strictEqual(C.gradeFromMarks(null, 50), null);
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

console.log(`\nAll ${n} test groups passed.`);
