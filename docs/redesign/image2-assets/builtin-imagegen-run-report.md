# Built-in Image2 final delivery report

## Scope and provenance

This delivery used Codex built-in ImageGen/Image2 only (`gpt-image-2`): no `OPENAI_API_KEY`, CLI fallback, direct API, or alternate model was used. Original/baked-checkerboard and chroma source PNGs preserve Image2 provenance in `caBX` metadata (`softwareAgent=gpt-image`, version `2.0`, `trainedAlgorithmicMedia`). The post-processed 4K finals are not represented as retaining that `caBX` metadata.

All 20 required square cutouts are now formal, exact 4096x4096 RGBA PNG finals (PNG IHDR colour type 6). Image2 supplied the content; deterministic local processing supplied chroma removal/background segmentation where needed, transparent-safe premultiplied-alpha Pillow LANCZOS upscale, non-stretch padding for non-square `pro`, transparent-RGB zeroing only in the individual pipelines where it was actually applied, and multi-background QA. Transparent-RGB zeroing was not a delivery-wide normalization pass: some genuine-alpha finals retain non-zero hidden RGB beneath alpha 0, and the SHA-256 values below hash those exact retained bytes. “4K” therefore means delivery resolution, not a claim of native 4096 Image2 raster generation.

`challenge` and `quickgen` were recovered from preserved built-in Image2 baked-checkerboard sources by deterministic border-connected segmentation. Their topology review passed after coordinate evidence showed enclosed alpha islands were external checker-background negative space. `copilot` and `pro` were separately regenerated through built-in Image2 on green chroma sources; v5 removed only bounded key-green partial-alpha edge RGB. Reef Oracle was regenerated once on green chroma after the yellow-source candidate failed visual QA; its rejected old final remains archived.

## Current delivery status

| Asset set | Count | Status | Runtime result |
| --- | ---: | --- | --- |
| True-alpha finals | 20 | **SUCCESS** | 7 direct Bixin assets and the 6 typed character portraits are registered; placeholder portrait, 5 emblems, and relic are organized formal finals without a current typed consumer. |
| Opaque home backgrounds and covers | 6 | **SUCCESS** | `homeBackdrop`, `skyBand`, and all four `homeProjectCovers` keys resolve to approved PNGs. |
| Formal character banners | 6 | **SUCCESS** | Exactly six `characterBanners` keys resolve to the approved files. |
| Generic placeholder banner | 1 | **SUCCESS, unregistered** | Formal generated final, intentionally outside the six-key banner map. |
| Character continuity anchor | 1 | **SUCCESS, unregistered** | Generation reference only; not a runtime registry key. |

The runtime registry consumes the hero robot, writer avatar, four mascots, promo rocket, and exactly six typed square portraits. Candidate/intermediate files remain isolated under `assets/bixin/generated/candidates/`; chroma/Image2 generation sources are under `assets/bixin/uizip-generated/`. Neither location should be construed as a runtime release directory.

## Audited true-alpha inventory

All rows below are `4096x4096`, `RGBA` / PNG colour type 6. SHA-256 values were recalculated from disk.

| Asset | Runtime status | SHA-256 |
| --- | --- | --- |
| `hero-robot.png` | Registered: `bixinAssets.heroRobot` | `8306a483b752105575d214867dedb35cc415062bcf712f023b4924f41299da25` |
| `mascot-challenge.png` | Registered: `bixinAssets.mascotChallenge` | `b9d3ef020a13edbd1d70009d50dade22c76237c6586510a8183648242c1ff86c` |
| `mascot-copilot.png` | Registered: `bixinAssets.mascotCopilot` | `dd6910543f027ebc5fb8f7609601a165ffd6bbd23c76052961ff7e98e236bc7d` |
| `mascot-quickgen.png` | Registered: `bixinAssets.mascotQuickgen` | `d17683c80ad4aef126a0d0dbdc50b4c06df881a3c437290c2c61059ae1baca66` |
| `mascot-pro.png` | Registered: `bixinAssets.mascotPro` | `b424df83883891a9957ccffe0e3a8ac39fadc49fdf4c12f2736e2029ad5163e4` |
| `avatar-writer.png` | Registered: `bixinAssets.avatarWriter` | `db11dae2f4b28aa6429c06cb752ada06a1039971a976233b532d0b17f5b3f0c1` |
| `promo-rocket.png` | Registered: `bixinAssets.promoRocket` | `2483d2be2dab86e21f8c1b54592ae2bb687775d6de6857139cd44ec172c1798f` |
| `uizip-generated/portrait-liora.png` | Registered: `characterPortraits.liora` | `727ab931d90684e8b68d2613446e0ccd1743bb0654dcbc17dacc5dfd19ac877c` |
| `uizip-generated/portrait-arden.png` | Registered: `characterPortraits.arden` | `72ab91d93fae5078b11e239b4f75d9fc37258d616ba40b42c1131d92ec9b1e11` |
| `uizip-generated/portrait-kael.png` | Registered: `characterPortraits.kael` | `049954da2a43daff048ed6123e704c883c8af0f87ae5c3ec04703525b6a0c26d` |
| `uizip-generated/portrait-selene.png` | Registered: `characterPortraits.selene` | `d730282a873ff8cfa44f99698a7eccd2c4e1c0b74a967c4fb75ea10db44ebca2` |
| `uizip-generated/portrait-vex.png` | Registered: `characterPortraits.vex` | `318beef47d5f343fe4cd222463f3fde776954a6445f347676fdc3994a33926bd` |
| `uizip-generated/portrait-the-order.png` | Registered: `characterPortraits.theOrder` | `c512a16fbeb97a959668376f98d6ee98a09a17850920cc529564c5026198248f` |
| `uizip-generated/portrait-placeholder.png` | Formal final, unregistered | `6a377f438136e5464f3a8ac9e27d235965ae841cdc95b2ae9c2bd2303e2be355` |
| `uizip-generated/emblem-harbor-regency.png` | Formal final, unregistered | `ed02af0c40ce4848c123d0457f46e26b573a2d69ca0fa745eff1c0c68ba85b83` |
| `uizip-generated/emblem-lighthouse-archive.png` | Formal final, unregistered | `a6a8b0658b969bf2a4b46a998a1d025f6c42bacbaa26893c3c25a63ee8932ad6` |
| `uizip-generated/emblem-reef-oracle.png` | Formal final, unregistered | `67f449c86b7c1c1de3a6e9f41aba679cbc24bfd3c480823bc2684452089d2409` |
| `uizip-generated/emblem-the-order.png` | Formal final, unregistered | `8a1c8c17074ae35a7123a9b9d2aa1309a09d0d65cbea66e60bf1a2eff8fe05b3` |
| `uizip-generated/emblem-tide-runners-guild.png` | Formal final, unregistered | `e027963b8284acfd73c16e492768319d62c5644a48250a0da10f9470f84f8cd3` |
| `uizip-generated/relic-ancient-star-stele.png` | Formal final, unregistered | `a10f5f7e5b2285bb7ff5a2f62a48f6333fef3df41650c884b7e86abb27b6bc3c` |

## Approved opaque, banner, and anchor inventory

These are RGB PNGs (PNG IHDR colour type 2). Dimensions and SHA-256 values were recalculated from disk.

| Asset | Dimensions | Runtime status | SHA-256 |
| --- | --- | --- | --- |
| `home-sky-backdrop.png` | 1672x941 | Registered: `bixinAssets.homeBackdrop` | `c4234007fef876571a8373e422fc015463a16969f69afceebdc2f7eaca6d68c9` |
| `scene-sky-band.png` | 2560x1024 | Registered: `bixinAssets.skyBand` | `89345b1a86988e4276d98467276e87988205c5bc1c4930668131ea1b40d04bf7` |
| `cover-cloud-throne.png` | 1024x1536 | Registered: `homeProjectCovers.cloudThrone` | `70a4a191bcb407fe8c5de9725d8ff7094da7a6e164cda5f7cb58f7ce44c3d084` |
| `cover-starsea-traveler.png` | 1024x1536 | Registered: `homeProjectCovers.starseaTraveler` | `6698811448a2385585443039517f235ee1c21d1b1109108fe7ebf031b639960a` |
| `cover-changan-night-tales.png` | 1024x1536 | Registered: `homeProjectCovers.changanNightTales` | `97bc2c8ee58b6e1cde30116bf312f1ab7ee18c9d967e30c1dfb2144633069548` |
| `cover-default-fantasy.png` | 1024x1536 | Registered: `homeProjectCovers.defaultFantasy` | `2fe4fa74d5c0b5b97c1ef5fe95daad2331419ffa6b3f54907612f2621666aa59` |
| `uizip-generated/portrait-liora-banner.png` | 1983x793 | Registered: `characterBanners.liora` | `5c2d65f1ceeab5a64b38514ce9c430b8f39574fa81bb607852a71cc1bba7e4f8` |
| `uizip-generated/portrait-kael-banner.png` | 1983x793 | Registered: `characterBanners.kael` | `5abcf7b3ca8b4c877852ba3409d703fd835498b19eb14978e17bb0a01e94e3be` |
| `uizip-generated/portrait-arden-banner.png` | 1983x793 | Registered: `characterBanners.arden` | `d94e2c8bcc0fda7fae6f38a1c2c7e75bead09f5cd7bc45a506d65db89b0ace2c` |
| `uizip-generated/portrait-selene-banner.png` | 1536x1024 | Registered: `characterBanners.selene` | `5b3dfb431fd42d7745b2b30ca7f29de09b4212278867efaed14959a7f7863c0a` |
| `uizip-generated/portrait-vex-banner.png` | 1536x1024 | Registered: `characterBanners.vex` | `01d887a3c9ba6cb0dd4a1cac93d5f5c204f747dbb4debbad5b570dc3580faa82` |
| `uizip-generated/portrait-the-order-banner.png` | 1536x1024 | Registered: `characterBanners.theOrder` | `b71633bf867b1042028a89030a96c902a8f71d77753e0087399b0cbab039938a` |
| `uizip-generated/portrait-placeholder-banner.png` | 1983x793 | Formal final, unregistered | `b7e17400e944fb60d5e012e47166f0373582aecfca6b46ff18893719d90c62f0` |
| `generated/character-style-anchor.png` | 1536x1024 | Generation reference, unregistered | `f245d602d05724ab99830d11ceffe549b4521adc239c6f8a40eacb5dd3ea7800` |

## Counts, review evidence, and verification

Current `assets/bixin/` count: 186 files total — 17 direct, 7 `generated/` direct, 123 `generated/candidates/`, and 39 `uizip-generated/`. The candidate count is included in the recursive `generated/` total (130).

- Colorful mascots final review: **SPEC PASS / QUALITY PASS**.
- Robot mascots final review: **SPEC PASS / QUALITY PASS** after one green-fringe fix and re-review.
- Final registry review: **SPEC PASS / QUALITY PASS** after its performance fix and re-review.
- Tests: **69 files / 440 tests PASS in 55.53s**.
- Lint: **exit 0**, 7 baseline warnings, 0 errors.
- Build: **PASS**, 1,604 modules; final hero/avatar/four mascots/promo/six portraits emitted to `dist`.
- Preview service restored at `http://127.0.0.1:4173/`. New automated browser navigation was blocked by the in-app browser local-URL security policy after an initial connection-refused attempt; this run makes no fresh browser screenshot or clean-console claim.

Metadata/hash method: a read-only Node.js audit enumerated the named files, read PNG IHDR width, height, and colour type from bytes 16–25, and calculated SHA-256 with `crypto.createHash('sha256')`; a second read-only scan counted files by directory and checked preserved source metadata for `caBX`, `gpt-image`, `2.0`, and `trainedAlgorithmicMedia`.

Concern: final 4K files intentionally do not claim to retain original Image2 `caBX` after deterministic post-processing; browser QA was policy-blocked as described above.
