export const logo = new URL(
  '../../assets/novelora/novelora_ui_asset_pack/01_logo/novelora_logo_horizontal.svg',
  import.meta.url,
).href;
export const appIcon = new URL(
  '../../assets/novelora/novelora_ui_asset_pack/01_logo/app_icon_star.svg',
  import.meta.url,
).href;

export const navigationIcons = {
  home: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/home.svg',
    import.meta.url,
  ).href,
  structure: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/structure.svg',
    import.meta.url,
  ).href,
  characters: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/characters.svg',
    import.meta.url,
  ).href,
  worldbuilding: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/worldbuilding.svg',
    import.meta.url,
  ).href,
  inspiration: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/inspiration.svg',
    import.meta.url,
  ).href,
  review: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/review.svg',
    import.meta.url,
  ).href,
  projects: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/03_icons/navigation/projects.svg',
    import.meta.url,
  ).href,
} as const;

export const actionIcons = {
  search: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/03_icons/actions/search.svg',
    import.meta.url,
  ).href,
  bell: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/03_icons/actions/bell.svg',
    import.meta.url,
  ).href,
} as const;

export const bixinAssets = {
  appIcon: new URL('../../assets/bixin/bixin-app-icon.png', import.meta.url).href,
  scene: new URL('../../assets/bixin/scene-robot-background.png', import.meta.url).href,
  book: new URL('../../assets/bixin/book-foreground.svg', import.meta.url).href,
  projectCover: new URL('../../assets/bixin/project-cover.png', import.meta.url).href,
  heroRobot: new URL('../../assets/bixin/hero-robot-uizip-v3.png', import.meta.url).href,
  homeBackdrop: new URL('../../assets/bixin/home-sky-backdrop.png', import.meta.url).href,
  skyBand: new URL('../../assets/bixin/scene-sky-band.png', import.meta.url).href,
  mascotChallenge: new URL(
    '../../assets/bixin/mascot-challenge.png',
    import.meta.url,
  ).href,
  mascotCopilot: new URL(
    '../../assets/bixin/mascot-copilot.png',
    import.meta.url,
  ).href,
  mascotQuickgen: new URL(
    '../../assets/bixin/mascot-quickgen.png',
    import.meta.url,
  ).href,
  mascotPro: new URL(
    '../../assets/bixin/mascot-pro.png',
    import.meta.url,
  ).href,
  promoRocket: new URL(
    '../../assets/bixin/promo-rocket.png',
    import.meta.url,
  ).href,
  quill: new URL('../../assets/bixin/quill-uizip.png', import.meta.url).href,
  avatarWriter: new URL('../../assets/bixin/avatar-writer.png', import.meta.url).href,
} as const;

export const homeProjectCovers = {
  cloudThrone: new URL('../../assets/bixin/cover-cloud-throne.png', import.meta.url).href,
  starseaTraveler: new URL('../../assets/bixin/cover-starsea-traveler.png', import.meta.url).href,
  changanNightTales: new URL('../../assets/bixin/cover-changan-night-tales.png', import.meta.url).href,
  defaultFantasy: new URL('../../assets/bixin/cover-default-fantasy.png', import.meta.url).href,
} as const;

export const novaFront = new URL(
  '../../assets/novelora/novelora_ui_asset_pack/02_mascot/mascot_nova_front.svg',
  import.meta.url,
).href;
export const novaAvatar = new URL(
  '../../assets/novelora/novelora_ui_asset_pack/02_mascot/mascot_nova_avatar.svg',
  import.meta.url,
).href;

export const projectCovers = {
  eclipseOfEchoes: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/05_project_covers/cover_eclipse_of_echoes.svg',
    import.meta.url,
  ).href,
  whispersVale: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/05_project_covers/cover_whispers_vale.svg',
    import.meta.url,
  ).href,
  chroniclesLumin: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/05_project_covers/cover_chronicles_lumin.svg',
    import.meta.url,
  ).href,
} as const;

export const characterPortraits = {
  liora: new URL('../../assets/bixin/uizip-generated/portrait-liora.png', import.meta.url).href,
  arden: new URL('../../assets/bixin/uizip-generated/portrait-arden.png', import.meta.url).href,
  kael: new URL('../../assets/bixin/uizip-generated/portrait-kael.png', import.meta.url).href,
  selene: new URL('../../assets/bixin/uizip-generated/portrait-selene.png', import.meta.url).href,
  vex: new URL('../../assets/bixin/uizip-generated/portrait-vex.png', import.meta.url).href,
  theOrder: new URL('../../assets/bixin/uizip-generated/portrait-the-order.png', import.meta.url).href,
} as const;

export type CharacterPortraitKey = keyof typeof characterPortraits;

export const characterBanners = {
  liora: new URL('../../assets/bixin/uizip-generated/portrait-liora-banner.png', import.meta.url).href,
  arden: new URL('../../assets/bixin/uizip-generated/portrait-arden-banner.png', import.meta.url).href,
  kael: new URL('../../assets/bixin/uizip-generated/portrait-kael-banner.png', import.meta.url).href,
  selene: new URL('../../assets/bixin/uizip-generated/portrait-selene-banner.png', import.meta.url).href,
  vex: new URL('../../assets/bixin/uizip-generated/portrait-vex-banner.png', import.meta.url).href,
  theOrder: new URL('../../assets/bixin/uizip-generated/portrait-the-order-banner.png', import.meta.url).href,
} as const;

export const inspirationThumbnails = {
  moonQuote: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/07_inspiration_thumbnails/inspiration_moon_quote.svg',
    import.meta.url,
  ).href,
  observatory: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/07_inspiration_thumbnails/inspiration_observatory.svg',
    import.meta.url,
  ).href,
  ruins: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/07_inspiration_thumbnails/inspiration_ruins.svg',
    import.meta.url,
  ).href,
  portal: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/07_inspiration_thumbnails/inspiration_portal.svg',
    import.meta.url,
  ).href,
} as const;

// Kept for source-pack auditing only; CSS provides the runtime backgrounds and textures.
export const brightCockpitBackgroundSourcePath = '../../assets/novelora/novelora_ui_asset_pack/09_textures_backgrounds/bright_cockpit_background.png';
export const paperGrainSourcePath = '../../assets/novelora/novelora_ui_asset_pack/09_textures_backgrounds/paper_grain_overlay.png';

export const clueNodes = {
  origin: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/08_graph_nodes/node_clue_origin.svg',
    import.meta.url,
  ).href,
  trigger: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/08_graph_nodes/node_trigger.svg',
    import.meta.url,
  ).href,
  receiver: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/08_graph_nodes/node_receiver.svg',
    import.meta.url,
  ).href,
  payoff: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/08_graph_nodes/node_payoff.svg',
    import.meta.url,
  ).href,
  memory: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/08_graph_nodes/node_memory.svg',
    import.meta.url,
  ).href,
} as const;
