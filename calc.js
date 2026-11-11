/* Pure calculation logic for the NU Statistics CGPA calculator.
 * Works in the browser (window.NUCalc) and in Node (module.exports). */
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

  /** Convert Bangla digits (and Bangla/Arabic decimal marks) to ASCII. */
  function toAscii(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/[০-৯]/g, function (d) { return String(BN.indexOf(d)); })
      .replace(/[٫,]/g, '.')
      .trim();
  }

  /** Convert ASCII digits to Bangla digits. */
  function toBangla(str) {
    return String(str).replace(/[0-9]/g, function (d) { return BN[+d]; });
  }

  /** Parse a user-typed number (Bangla or English digits). Returns NaN if invalid/empty. */
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

  /** Map a percentage (0-100) to an NU grade. */
  function gradeFromPercent(pct) {
    if (typeof pct !== 'number' || !(pct >= 0) || pct > 100) return null;
    for (var i = 0; i < GRADES.length; i++) if (pct >= GRADES[i].min) return GRADES[i];
    return GRADES[GRADES.length - 1];
  }

  /** Map obtained marks out of fullMarks (default 100) to a grade. */
  function gradeFromMarks(obtained, fullMarks) {
    var full = fullMarks > 0 ? fullMarks : 100;
    if (typeof obtained !== 'number' || !(obtained >= 0) || obtained > full) return null;
    return gradeFromPercent((obtained / full) * 100);
  }

  /** Letter grade for a GPA/CGPA value on the NU 4.00 scale. */
  function letterFromGPA(gpa) {
    if (typeof gpa !== 'number' || !(gpa >= 0)) return null;
    var g = round2(gpa);
    for (var i = 0; i < GRADES.length; i++) {
      if (GRADES[i].point > 0 && g >= GRADES[i].point) return GRADES[i].letter;
    }
    return 'F';
  }

  /**
   * Compute a year's GPA.
   * entries: [{ credits, letter, counted }]; only counted entries with a letter are used.
   */
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

  /** CGPA from [{ gpa, credits }] weighted by credits. */
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

  // ---------- Sessions & syllabus eras ----------
  var YEAR_IDS = ['y1', 'y2', 'y3', 'y4', 'ms'];

  /** 'old' (2013-14 syllabus) or 'new' (2024-25 syllabus) for a session id like '2023-2024'. */
  function eraForSession(data, sessionId) {
    for (var i = 0; i < data.sessions.length; i++) if (data.sessions[i].id === sessionId) return data.sessions[i].era;
    return null;
  }

  /** Year syllabus object for a session, or null when that year's syllabus is not published. */
  function yearFor(data, sessionId, yearId) {
    var era = eraForSession(data, sessionId);
    if (!era) return null;
    return data.eras[era].years[yearId] || null;
  }

  /** Count graded letters into { 'A+': n, ... } in scale order. */
  function gradeDistribution(letters) {
    var out = {};
    GRADES.forEach(function (g) { out[g.letter] = 0; });
    letters.forEach(function (l) { if (l in out) out[l]++; });
    return out;
  }

  var api = {
    YEAR_IDS: YEAR_IDS,
    eraForSession: eraForSession,
    yearFor: yearFor,
    gradeDistribution: gradeDistribution,
    GRADES: GRADES,
    toAscii: toAscii,
    toBangla: toBangla,
    parseNum: parseNum,
    round2: round2,
    gradeByLetter: gradeByLetter,
    gradeFromPercent: gradeFromPercent,
    gradeFromMarks: gradeFromMarks,
    letterFromGPA: letterFromGPA,
    computeGPA: computeGPA,
    computeCGPA: computeCGPA
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NUCalc = api;
})(typeof self !== 'undefined' ? self : this);
