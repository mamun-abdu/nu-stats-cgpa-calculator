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
  assert.strictEqual(C.gradeFromMarks(40, 50).letter, 'A+');   // 80%
  assert.strictEqual(C.gradeFromMarks(37, 50).letter, 'A-');   // 74%
  assert.strictEqual(C.gradeFromMarks(19, 50).letter, 'F');    // 38%
  assert.strictEqual(C.gradeFromMarks(60, 75).letter, 'A+');   // 80%
  assert.strictEqual(C.gradeFromMarks(10, 25).letter, 'D');    // 40%
  assert.strictEqual(C.gradeFromMarks(51, 50), null);
});

t('letter from GPA', () => {
  assert.strictEqual(C.letterFromGPA(4), 'A+');
  assert.strictEqual(C.letterFromGPA(3.74), 'A-');
  assert.strictEqual(C.letterFromGPA(3.75), 'A');
  assert.strictEqual(C.letterFromGPA(2.0), 'D');
  assert.strictEqual(C.letterFromGPA(1.99), 'F');
});

t('1st year all A+ = 4.00 over 36 credits', () => {
  const y1 = D.years.find(y => y.id === 'y1');
  const r = C.computeGPA(y1.courses.map(c => ({ credits: c.credits, letter: 'A+' })));
  assert.strictEqual(r.gpa, 4); assert.strictEqual(r.credits, 36); assert.strictEqual(r.fails, 0);
});

t('mixed grades weighted by credits', () => {
  // 4cr A+ (16) + 4cr B (12) + 2cr F (0) = 28 / 10 = 2.80
  const r = C.computeGPA([{credits:4,letter:'A+'},{credits:4,letter:'B'},{credits:2,letter:'F'}]);
  assert.strictEqual(r.gpa, 2.8); assert.strictEqual(r.fails, 1); assert.strictEqual(r.letter, 'B-');
  // 3*3.75 + 1*3.25 = 14.5 / 4 = 3.625 -> 3.63
  assert.strictEqual(C.computeGPA([{credits:3,letter:'A'},{credits:1,letter:'B+'}]).gpa, 3.63);
});

t('ungraded and unselected courses are excluded', () => {
  const r = C.computeGPA([{credits:4,letter:'A'},{credits:4,letter:''},{credits:4,letter:'F',counted:false}]);
  assert.strictEqual(r.gpa, 3.75); assert.strictEqual(r.credits, 4); assert.strictEqual(r.totalCredits, 8);
});

t('course totals match NU year credits (with optional picks)', () => {
  const expected = { y1: 36, y2: 38, y3: 32, y4: 40, ms: 36 };
  D.years.forEach(y => {
    const fixed = y.courses.filter(c => !c.pick).reduce((s, c) => s + c.credits, 0);
    const groups = {};
    y.courses.filter(c => c.pick).forEach(c => { (groups[c.section] ||= []).push(c); });
    const opt = Object.values(groups).reduce((s, g) => s + g.slice(0, g[0].pick).reduce((a, c) => a + c.credits, 0), 0);
    assert.strictEqual(fixed + opt, expected[y.id], y.id);
    assert.strictEqual(y.totalCredits, expected[y.id]);
  });
});

t('CGPA weighted by yearly credits', () => {
  // (3.5*36 + 3.25*38 + 3.0*32 + 3.75*40) / 146 = 495.5/146 = 3.394 -> 3.39
  const r = C.computeCGPA([{gpa:3.5,credits:36},{gpa:3.25,credits:38},{gpa:3.0,credits:32},{gpa:3.75,credits:40}]);
  assert.strictEqual(r.cgpa, 3.39); assert.strictEqual(r.credits, 146); assert.strictEqual(r.letter, 'B+');
  const r2 = C.computeCGPA([{gpa:3.5,credits:36},{gpa:null,credits:38},{gpa:5,credits:32}]);
  assert.strictEqual(r2.cgpa, 3.5); assert.strictEqual(r2.credits, 36);
  assert.strictEqual(C.computeCGPA([]).cgpa, null);
  assert.strictEqual(C.letterFromGPA(null), null);
  assert.strictEqual(C.gradeFromMarks(null, 50), null);
});

console.log(`\nAll ${n} test groups passed.`);
