const maps = require('./maps.cjs');
const {locale} = require('./locales.cjs');
function addImage(result, state, config) {
  const mapImage = state.phase === 'playing' ? config.mapImages?.[state.map] : null;
  const appearanceImage = state.phase === 'playing' && state.interaction === 'appearance'
    ? config.appearanceImages?.[state.map] : null;
  const image = appearanceImage || mapImage || config.largeImage;
  if (image) result.assets = {large_image: image, large_text: locale(config).maps?.[state.map] || maps[state.map]?.name || 'The Killing Antidote'};
  return result;
}
function short(text, maxBytes = 120) {
  let result = '';
  for (const char of String(text)) { if (Buffer.byteLength(result + char) > maxBytes) break; result += char; }
  return result;
}
function activity(state, config) {
  const t = locale(config);
  const result = {type: 0, timestamps: {start: state.session_start}};
  if (state.phase === 'menu') { result.details = t.menu; result.state = 'The Killing Antidote'; }
  else if (state.phase === 'loading') { result.details = t.loading; result.state = 'The Killing Antidote'; }
  else {
    const known = maps[state.map];
    const caption = t.maps?.[state.map] || known?.name || (state.caption && state.caption !== 'None' ? state.caption : state.map);
    const mode = known ? (known.mode === 'História' ? t.story : t.challenge) : state.mode || t.playing;
    result.details = short(`${mode} · ${String(caption).replace(/\s+/g, ' ').trim()}`);
    if (known?.lobby) {
      result.state = state.interaction === 'appearance' ? t.appearance : t.lobby;
      return addImage(result, state, config);
    }
    const difficulty = t.difficulties[state.difficulty]
      || (Number.isFinite(state.difficulty) ? `${t.difficulty} ${state.difficulty}` : t.playing);
    let health = '';
    if (Number.isFinite(state.health) && Number.isFinite(state.health_max) && state.health_max > 0) {
      const percent = Math.max(0, Math.min(100, Math.round(100 * state.health / state.health_max)));
      health = ` · ${t.health}: ${percent}%`;
    }
    result.state = short(difficulty + health);
    if (state.interaction === 'save') result.state = short(t.save + ' · ' + difficulty);
    if (state.interaction === 'appearance') result.state = t.appearance;
    if (state.interaction === 'shop') result.state = t.shop;
  }
  return addImage(result, state, config);
}
module.exports = {activity, short};
