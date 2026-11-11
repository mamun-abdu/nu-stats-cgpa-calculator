# Stats CGPA · NU Statistics CGPA Calculator

A friendly GPA and CGPA calculator for **National University (Bangladesh) B.Sc. Honours Statistics** students, in English and Bangla.

**Live:** https://mamun-abdu.github.io/nu-stats-cgpa-calculator/

![Preview](og.png)

## How it works

1. **Pick your session** (2013–14 to 2026–27). The app remembers it.
2. The right NU syllabus loads for each year:

   | Sessions | Syllabus | 1st year | 2nd year | 3rd year | 4th year | Masters |
   |---|---|---|---|---|---|---|
   | 2013–14 … 2023–24 | effective from 2013–14 | 28 cr | 28 cr (+ non-credit English) | 32 cr | 40 cr | 36 cr |
   | 2024–25 … 2026–27 | effective from 2024–25 | 36 cr | 38 cr | *not published yet* | *not published yet* | *not published yet* |

3. For each course, type your **marks** (auto-graded against the paper's full marks) or pick a **grade**.
4. See your year GPA and your Honours **CGPA** update live, with a GPA-by-year chart and a grade-mix donut.

When a year's syllabus isn't published yet, or you only know your published result, you can **add your own courses** (name, credits, grade) or **type your published GPA** for that year. Both options work on every year.

## Features

- Session picker with both syllabus eras
- 4th-year optional papers and labs (“any two”) and Masters optional papers (“any three”): only the ones you tick count
- Non-credit papers are shown but left out of the GPA
- Marks or grade entry; accepts Bangla digits (৭৮, ৩.৫০)
- Full English / বাংলা interface (remembered)
- Light and dark themes, small animations that respect *reduced motion*
- Saves automatically in your browser (localStorage). Nothing is sent anywhere.
- Plain HTML, CSS and JavaScript: no framework, no build step

## NU grading scale

| Marks | Grade | Point |
|---|---|---|
| 80–100 | A+ | 4.00 |
| 75–79 | A | 3.75 |
| 70–74 | A- | 3.50 |
| 65–69 | B+ | 3.25 |
| 60–64 | B | 3.00 |
| 55–59 | B- | 2.75 |
| 50–54 | C+ | 2.50 |
| 45–49 | C | 2.25 |
| 40–44 | D | 2.00 |
| < 40 | F | 0.00 |

Year GPA = Σ(credits × point) ÷ Σ credits. CGPA = Σ(year GPA × year credits) ÷ Σ year credits (Honours years). Rounded to two decimals.

## Data source

All course codes, titles, marks and credits come from **National University's official syllabus files**:

- Honours syllabus, effective 2013–14 (1st–4th year): https://www.nu.ac.bd/syllabus-honours.php → *Honours Syllabus 2013-2014*
- 1st year, effective 2024–25: https://www.nu.ac.bd/Syllabus/Syllabus_Honours/BSc_Honours/Statistics_First_Year_Pub_Date_12112025.pdf
- 2nd year, effective 2024–25: https://www.nu.ac.bd/syllabus-honours.php → *Second Year Syllabus — Department of Statistics, 2024–2025*
- One-year Master's, effective 2013–14: https://www.nu.ac.bd/syllabus-masters.php

The exact file for every year is linked inside the app and in `data.js`. If NU publishes the 2024–25 3rd/4th year or a new Master's syllabus, add it to `data.js`.

## Run locally

```bash
git clone https://github.com/mamun-abdu/nu-stats-cgpa-calculator.git
cd nu-stats-cgpa-calculator
python3 -m http.server 8000
node test/calc.test.js
```

## Files

| File | What it does |
|---|---|
| `index.html` | Page shell and meta tags |
| `style.css` | Styles (mobile first), light/dark themes, font faces |
| `data.js` | Sessions, syllabus eras, every year's courses, grading scale |
| `calc.js` | Pure calculation logic (shared with tests) |
| `i18n.js` | English and Bangla UI text |
| `app.js` | Interface, charts, saving |
| `fonts/` | Self-hosted Nikosh (Bangla) and DM Sans (Latin); see `fonts/README.md` |
| `test/calc.test.js` | Node tests |

## Fonts

- **Nikosh 2** by the Bangladesh Election Commission, used for Bangla text. Redistributed unmodified under SIL OFL 1.0.
- **DM Sans**, used for Latin text, under SIL OFL 1.1.

## Disclaimer

This is an unofficial calculator. Your official result is whatever National University publishes.
এটি অনানুষ্ঠানিক হিসাব। জাতীয় বিশ্ববিদ্যালয় যে ফলাফল প্রকাশ করে, সেটিই চূড়ান্ত।

## License

Code: [MIT](LICENSE) © Mamun Abdu. Font files keep their own licenses (see `fonts/README.md`).
