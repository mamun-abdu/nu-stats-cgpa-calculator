# Fonts

| File | Font | Used for | License |
|---|---|---|---|
| `nikosh2.ttf` | **Nikosh 2** (v2.000, 2010), developed by the Bangladesh Election Commission. Core developers: Tanbin Islam Siyam, Omi Azad, Sabuj Kundu | Bangla script only (`unicode-range: U+0980-09FF`) | SIL Open Font License 1.0, as stated in the font's own metadata |
| `DMSans-latin.woff2` | **DM Sans** (The DM Sans Project Authors) | Latin text | SIL Open Font License 1.1, see `DMSans-OFL.txt` |

`nikosh2.ttf` is redistributed **unmodified** (byte-identical) from the Nikosh font package published by the Bangladesh Election Commission:
https://ecs.gov.bd/en/page/download → https://asset.ecs.gov.bd/media/uploaded_files/package/filemanager/2018/12/NikoshTTF.zip

The other files in that package (`Nikosh.ttf`, `NikoshBAN.ttf`, …) are licensed CC BY-NC-ND 3.0, and browsers refuse to load them because their `name` table is malformed (Chrome's font sanitizer reports "OTS parsing error: name"). Fixing that would mean changing the font, which their license doesn't allow, so this project uses the OFL-licensed Nikosh 2 from the same official package.

The MIT license of this repository does **not** apply to the font files.
