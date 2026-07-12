export const logo = new URL(
  '../../assets/novelora/novelora_ui_asset_pack/01_logo/novelora_logo_horizontal.svg',
  import.meta.url,
).href;
export const appIcon = new URL(
  '../../assets/novelora/novelora_ui_asset_pack/01_logo/app_icon_star.svg',
  import.meta.url,
).href;

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
  liora: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/06_character_portraits/portrait_liora.svg',
    import.meta.url,
  ).href,
  arden: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/06_character_portraits/portrait_arden.svg',
    import.meta.url,
  ).href,
  kael: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/06_character_portraits/portrait_kael.svg',
    import.meta.url,
  ).href,
  selene: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/06_character_portraits/portrait_selene.svg',
    import.meta.url,
  ).href,
  vex: new URL(
    '../../assets/novelora/novelora_ui_asset_pack/06_character_portraits/portrait_vex.svg',
    import.meta.url,
  ).href,
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

export const brightCockpitBackground = new URL(
  '../../assets/novelora/novelora_ui_asset_pack/09_textures_backgrounds/bright_cockpit_background.png',
  import.meta.url,
).href;
// Kept for source-pack auditing only; CSS provides the runtime paper texture.
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
