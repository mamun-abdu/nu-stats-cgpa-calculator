/*
 * Course data for National University (Bangladesh) B.Sc. (Honours) Statistics
 * and the one-year Master's course, taken from NU's official syllabus files
 * published at https://www.nu.ac.bd/syllabus-honours.php and
 * https://www.nu.ac.bd/syllabus-masters.php (each year's file is in `source`).
 *
 * Eras:
 *   old - syllabus effective from session 2013-14 (used by sessions 2013-14 .. 2023-24)
 *   new - syllabus effective from session 2024-25 (sessions 2024-25 onward).
 *         3rd year, 4th year and Master's are not published yet, so they are null.
 */
(function (root) {
  var NU_DATA = {
    "eras": {
      "old": {
        "id": "old",
        "effective": "2013-14",
        "years": {
          "y1": {
            "syllabus": "2013-14",
            "source": "https://www.nu.ac.bd/uploads/Honours%20Syllabus%202013-2014/1st%20Year%20Honours%20Syllabus%202013-2014.zip",
            "courses": [
              {
                "code": "213601",
                "name": "Introductory Statistics",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "213603",
                "name": "Introductory Probability & Numerical Mathematics",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "213604",
                "name": "Lab 1: Descriptive Statistics",
                "marks": 50,
                "credits": 2
              },
              {
                "code": "213606",
                "name": "Lab 2: Numerical Mathematics",
                "marks": 50,
                "credits": 2
              },
              {
                "code": "213709",
                "name": "Fundamentals of Mathematics",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "213711",
                "name": "Calculus-I",
                "marks": 50,
                "credits": 2
              },
              {
                "code": "212209",
                "name": "Principles of Economics",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "212211",
                "name": "Bangladesh Agricultural Economics",
                "marks": 50,
                "credits": 2
              },
              {
                "code": "211501",
                "name": "History of the Emergence of Independent Bangladesh",
                "marks": 100,
                "credits": 4
              }
            ],
            "totalCredits": 28
          },
          "y2": {
            "syllabus": "2013-14",
            "source": "https://www.nu.ac.bd/uploads/Honours%20Syllabus%202013-2014/2nd%20Year%20Honours%20Syllabus%202013-2014.zip",
            "courses": [
              {
                "code": "223601",
                "name": "Probability Distribution",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "223603",
                "name": "Sampling Technique",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "223605",
                "name": "Linear Algebra",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "223606",
                "name": "Lab-3: Probability Distribution and Sampling Technique",
                "marks": 50,
                "credits": 2
              },
              {
                "code": "223608",
                "name": "Lab-4: Linear Algebra",
                "marks": 50,
                "credits": 2
              },
              {
                "code": "223707",
                "name": "Calculus-II",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "223708",
                "name": "Math Lab (Practical)",
                "marks": 50,
                "credits": 2
              },
              {
                "code": "222211",
                "name": "Money, Banking and Public Finance",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "222213",
                "name": "Bangladesh Economy",
                "marks": 50,
                "credits": 2
              },
              {
                "code": "221109",
                "name": "English (Compulsory)",
                "marks": 100,
                "credits": 0,
                "nonCredit": true
              }
            ],
            "totalCredits": 28
          },
          "y3": {
            "syllabus": "2013-14",
            "source": "https://www.nu.ac.bd/uploads/Honours%20Syllabus%202013-2014/3rd%20Year%20Honours%20Syllabus%202013-2014.zip",
            "courses": [
              {
                "code": "233601",
                "name": "Sampling Distribution",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "233603",
                "name": "Statistical Inference",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "233605",
                "name": "Regression Analysis",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "233607",
                "name": "Design of Experiments",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "233609",
                "name": "Applied Statistics",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "233611",
                "name": "Introduction to Computer and SPSS",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "233612",
                "name": "Lab 5: Statistical Inference",
                "marks": 50,
                "credits": 2
              },
              {
                "code": "233614",
                "name": "Lab 6: Regression Analysis",
                "marks": 50,
                "credits": 2
              },
              {
                "code": "233616",
                "name": "Lab 7: Design of Experiments",
                "marks": 50,
                "credits": 2
              },
              {
                "code": "233618",
                "name": "Lab 8: Applied Statistics",
                "marks": 50,
                "credits": 2
              }
            ],
            "totalCredits": 32
          },
          "y4": {
            "syllabus": "2013-14",
            "source": "https://www.nu.ac.bd/uploads/Honours%20Syllabus%202013-2014/4th%20Year%20Honours%20Syllabus%202013-2014.zip",
            "courses": [
              {
                "code": "243601",
                "name": "Multivariate Analysis",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "243603",
                "name": "Advance Sampling Technique",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "243605",
                "name": "Demography",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "243607",
                "name": "Computer Programming (FORTRAN & R)",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "243609",
                "name": "Stochastic Process",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "243611",
                "name": "Econometrics",
                "marks": 100,
                "credits": 4,
                "section": "optional",
                "pick": 2
              },
              {
                "code": "243613",
                "name": "Operational Research and Research Methodology",
                "marks": 100,
                "credits": 4,
                "section": "optional",
                "pick": 2
              },
              {
                "code": "243615",
                "name": "Epidemiology & Biostatistics",
                "marks": 100,
                "credits": 4,
                "section": "optional",
                "pick": 2
              },
              {
                "code": "243616",
                "name": "Lab 9: Multivariate Analysis",
                "marks": 50,
                "credits": 2,
                "section": "lab"
              },
              {
                "code": "243618",
                "name": "Lab 10: Advance Sampling Technique",
                "marks": 50,
                "credits": 2,
                "section": "lab"
              },
              {
                "code": "243620",
                "name": "Lab 11: Econometrics",
                "marks": 50,
                "credits": 2,
                "section": "optionalLab",
                "pick": 2
              },
              {
                "code": "243622",
                "name": "Lab 12: Operational Research & Demography",
                "marks": 50,
                "credits": 2,
                "section": "optionalLab",
                "pick": 2
              },
              {
                "code": "243624",
                "name": "Lab 13: Epidemiology & Biostatistics",
                "marks": 50,
                "credits": 2,
                "section": "optionalLab",
                "pick": 2
              },
              {
                "code": "243626",
                "name": "Viva-voce",
                "marks": 100,
                "credits": 4,
                "section": "viva"
              }
            ],
            "totalCredits": 40
          },
          "ms": {
            "syllabus": "2013-14",
            "source": "https://www.nu.ac.bd/uploads/2018/01/2-Masters-Final-2013-14pub_date_14122015.zip",
            "courses": [
              {
                "code": "313601",
                "name": "Applied Multivariate Analysis",
                "marks": null,
                "credits": 4
              },
              {
                "code": "313603",
                "name": "Advance Theory of Inference",
                "marks": null,
                "credits": 4
              },
              {
                "code": "313605",
                "name": "Design and Analysis of Experiments",
                "marks": null,
                "credits": 4
              },
              {
                "code": "313607",
                "name": "Sampling Methods & Research Methodology",
                "marks": null,
                "credits": 4
              },
              {
                "code": "313609",
                "name": "Econometrics",
                "marks": null,
                "credits": 4,
                "section": "optional",
                "pick": 3
              },
              {
                "code": "313611",
                "name": "Statistical Quality Control and Operations Research",
                "marks": null,
                "credits": 4,
                "section": "optional",
                "pick": 3
              },
              {
                "code": "313613",
                "name": "Demography & Population Studies",
                "marks": null,
                "credits": 4,
                "section": "optional",
                "pick": 3
              },
              {
                "code": "313615",
                "name": "Stochastic Process",
                "marks": null,
                "credits": 4,
                "section": "optional",
                "pick": 3
              },
              {
                "code": "313617",
                "name": "Bio-statistics",
                "marks": null,
                "credits": 4,
                "section": "optional",
                "pick": 3
              },
              {
                "code": "313618",
                "name": "Practical (Lab 1: Multivariate Analysis and Statistical Inference; Lab 2: Experimental Design and Sampling Techniques; Project Work)",
                "marks": null,
                "credits": 6,
                "section": "practical"
              },
              {
                "code": "313620",
                "name": "Viva-Voce",
                "marks": null,
                "credits": 2,
                "section": "practical"
              }
            ],
            "totalCredits": 36
          }
        }
      },
      "new": {
        "id": "new",
        "effective": "2024-25",
        "years": {
          "y1": {
            "syllabus": "2024-25",
            "source": "https://www.nu.ac.bd/Syllabus/Syllabus_Honours/BSc_Honours/Statistics_First_Year_Pub_Date_12112025.pdf",
            "courses": [
              {
                "code": "213601",
                "name": "Introduction to Statistics",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "213603",
                "name": "Elementary Probability",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "213605",
                "name": "Linear Algebra",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "213606",
                "name": "Lab 1: Introduction to Statistics",
                "marks": 50,
                "credits": 2
              },
              {
                "code": "213608",
                "name": "Lab 2: Elementary Probability and Linear Algebra",
                "marks": 50,
                "credits": 2
              },
              {
                "code": "213709",
                "name": "Foundations of Mathematics",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "213711",
                "name": "Calculus I",
                "marks": 50,
                "credits": 2
              },
              {
                "code": "212209",
                "name": "Principles of Economics",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "212211",
                "name": "Bangladesh Agricultural Economics",
                "marks": 50,
                "credits": 2
              },
              {
                "code": "219901",
                "name": "History of Bangladesh: Language, Culture and Identity",
                "marks": 100,
                "credits": 4
              },
              {
                "code": "219903",
                "name": "Information and Communication Technology",
                "marks": 75,
                "credits": 3
              },
              {
                "code": "219904",
                "name": "Lab: Information and Communication Technology",
                "marks": 25,
                "credits": 1
              }
            ],
            "totalCredits": 36
          },
          "y2": {
            "syllabus": "2024-25",
            "source": "https://www.nu.ac.bd/Syllabus/Syllabus_Honours/honours-second-year-2024%E2%80%932025/Second-Year-Syllabus_Statistics_Session-2024%E2%80%932025.pdf",
            "courses": [
              {
                "code": "8223651",
                "name": "Probability Distribution",
                "marks": 100,
                "credits": 4,
                "section": "core"
              },
              {
                "code": "8223653",
                "name": "Sampling Technique",
                "marks": 100,
                "credits": 4,
                "section": "core"
              },
              {
                "code": "8223655",
                "name": "Mathematical Methods",
                "marks": 100,
                "credits": 4,
                "section": "core"
              },
              {
                "code": "8223656",
                "name": "Lab-3: Numerical Analysis, Probability Distribution, and Sampling Technique",
                "marks": 50,
                "credits": 2,
                "section": "core"
              },
              {
                "code": "8223658",
                "name": "Lab-4: Microsoft Excel and SPSS",
                "marks": 50,
                "credits": 2,
                "section": "core"
              },
              {
                "code": "8223662",
                "name": "Viva-Voce",
                "marks": 50,
                "credits": 2,
                "section": "core"
              },
              {
                "code": "8223757",
                "name": "Calculus-II and Ordinary Differential Equations",
                "marks": 100,
                "credits": 4,
                "section": "allied"
              },
              {
                "code": "8223758",
                "name": "Math Lab (Mathematica)",
                "marks": 50,
                "credits": 2,
                "section": "allied"
              },
              {
                "code": "8222261",
                "name": "Money, Banking and Public Finance",
                "marks": 100,
                "credits": 4,
                "section": "allied"
              },
              {
                "code": "8222263",
                "name": "Bangladesh Economy",
                "marks": 50,
                "credits": 2,
                "section": "allied"
              },
              {
                "code": "8226601",
                "name": "Applied Information and Communication Technology (Applied ICT)",
                "marks": 75,
                "credits": 3,
                "section": "compulsory"
              },
              {
                "code": "8226602",
                "name": "Practical: Applied ICT",
                "marks": 25,
                "credits": 1,
                "section": "compulsory"
              },
              {
                "code": "8221171",
                "name": "Functional English",
                "marks": 100,
                "credits": 4,
                "section": "compulsory"
              }
            ],
            "totalCredits": 38
          },
          "y3": null,
          "y4": null,
          "ms": null
        }
      }
    },
    "sessions": [
      {
        "id": "2013-2014",
        "era": "old"
      },
      {
        "id": "2014-2015",
        "era": "old"
      },
      {
        "id": "2015-2016",
        "era": "old"
      },
      {
        "id": "2016-2017",
        "era": "old"
      },
      {
        "id": "2017-2018",
        "era": "old"
      },
      {
        "id": "2018-2019",
        "era": "old"
      },
      {
        "id": "2019-2020",
        "era": "old"
      },
      {
        "id": "2020-2021",
        "era": "old"
      },
      {
        "id": "2021-2022",
        "era": "old"
      },
      {
        "id": "2022-2023",
        "era": "old"
      },
      {
        "id": "2023-2024",
        "era": "old"
      },
      {
        "id": "2024-2025",
        "era": "new"
      },
      {
        "id": "2025-2026",
        "era": "new"
      },
      {
        "id": "2026-2027",
        "era": "new"
      }
    ],
    "grades": [
      {
        "letter": "A+",
        "point": 4,
        "min": 80,
        "max": 100
      },
      {
        "letter": "A",
        "point": 3.75,
        "min": 75,
        "max": 79
      },
      {
        "letter": "A-",
        "point": 3.5,
        "min": 70,
        "max": 74
      },
      {
        "letter": "B+",
        "point": 3.25,
        "min": 65,
        "max": 69
      },
      {
        "letter": "B",
        "point": 3,
        "min": 60,
        "max": 64
      },
      {
        "letter": "B-",
        "point": 2.75,
        "min": 55,
        "max": 59
      },
      {
        "letter": "C+",
        "point": 2.5,
        "min": 50,
        "max": 54
      },
      {
        "letter": "C",
        "point": 2.25,
        "min": 45,
        "max": 49
      },
      {
        "letter": "D",
        "point": 2,
        "min": 40,
        "max": 44
      },
      {
        "letter": "F",
        "point": 0,
        "min": 0,
        "max": 39
      }
    ]
  };
  if (typeof module === 'object' && module.exports) module.exports = NU_DATA;
  else root.NU_DATA = NU_DATA;
})(typeof self !== 'undefined' ? self : this);
