const {test} = require('node:test');
const assert = require('node:assert/strict');
const {activity, short} = require('../rpc/presence.cjs');
const {Decoder, frame} = require('../rpc/discord.cjs');
const maps = require('../rpc/maps.cjs');
test('English covers all maps, difficulties, interactions and menu while preserving art and time',()=>{
  const config={language:'en',largeImage:'menu',mapImages:{Level_1:'map'},appearanceImages:{Level_1:'room'}};
  for(const map of Object.keys(maps)){
    const r=activity({phase:'playing',map,difficulty:3,health:1,health_max:2,session_start:123},config);
    assert.match(r.details,/^(Story|Challenge) · /);assert.equal(r.timestamps.start,123);
  }
  const base={phase:'playing',map:'Level_1',difficulty:1,health:1,health_max:2};
  for(const [i,name]of ['Easy','Normal','Hard','Extreme'].entries())assert.equal(activity({...base,difficulty:i+1},config).state,name+' · Health: 50%');
  assert.equal(activity({...base,interaction:'save'},config).state,'Save triggered · Easy');
  assert.equal(activity({...base,interaction:'shop'},config).state,'At the vending machine');
  assert.equal(activity({...base,interaction:'appearance'},config).state,'Customizing Jodi');
  assert.equal(activity({...base,interaction:'appearance'},config).assets.large_image,'room');
  assert.equal(activity(base,config).assets.large_text,'Administrative Area & Offices');
  assert.equal(activity({phase:'menu'},config).details,'In the main menu');
  assert.equal(activity({phase:'loading'},config).details,'Loading map');
  assert.equal(activity(base,{language:'invalid'}).state,'Fácil · Vida: 50%');
  assert.equal(activity(base,{language:'en-US'}).state,'Easy · Health: 50%');
});
test('all four difficulty labels match user-confirmed session order',()=>{
  for(const [index,label] of ['Fácil','Normal','Difícil','Extremo'].entries()) {
    const state={phase:'playing',map:'Level_1',difficulty:index+1,health:1,health_max:1};
    assert.equal(activity(state,{}).state,label+' · Vida: 100%');
    assert.equal(activity({...state,interaction:'save'},{}).state,'Salvamento acionado · '+label);
  }
});
test('appearance room artwork applies in office and story, restores on close, ignores stale menu interaction',()=>{
  const config={largeImage:'menu',mapImages:{JodisOffice:'office',Level_1:'story'},appearanceImages:{JodisOffice:'room_office',Level_1:'room_story'}};
  for(const map of ['JodisOffice','Level_1']){
    const state={phase:'playing',map,interaction:'appearance',session_start:100};
    assert.equal(activity(state,config).assets.large_image,config.appearanceImages[map]);
    assert.equal(activity({...state,interaction:null},config).assets.large_image,config.mapImages[map]);
    assert.equal(activity({...state,phase:'menu'},config).assets.large_image,'menu');
  }
  assert.equal(activity({phase:'playing',map:'Level_2',interaction:'appearance'},config).assets.large_image,'menu');
});
test('appearance and shop states keep map artwork and session, clear on menu',()=>{
  for(const [interaction,label] of [['appearance','Personalizando a Jodi'],['shop','Na máquina de compras']]){
    const result=activity({phase:'playing',map:'Level_1',interaction,session_start:100},{mapImages:{Level_1:'tka_story_1'}});
    assert.equal(result.state,label);
    assert.equal(result.assets.large_image,'tka_story_1');
    assert.equal(result.timestamps.start,100);
    assert.equal(activity({phase:'menu',interaction},{}).state,'The Killing Antidote');
  }
});
test('save event is shown only during gameplay, preserving map and session', () => {
  const result=activity({phase:'playing',map:'Level_1',difficulty:3,session_start:100,interaction:'save'},{});
  assert.equal(result.state,'Salvamento acionado · Difícil');
  assert.equal(result.details,'História · Área Administrativa & Escritórios');
  assert.deepEqual(result.timestamps,{start:100});
  assert.equal(activity({phase:'menu',map:'Level_1',interaction:'save'},{}).state,'The Killing Antidote');
});
test('per-map art includes lobby, with safe fallback for missing art and menu', () => {
  const config = {largeImage: 'tka_menu', mapImages: {JodisOffice: 'tka_jodis_office', Level_1: 'tka_story_1'}};
  assert.equal(activity({phase: 'playing', map: 'JodisOffice'}, config).assets.large_image, 'tka_jodis_office');
  assert.equal(activity({phase: 'playing', map: 'Level_1'}, config).assets.large_image, 'tka_story_1');
  assert.equal(activity({phase: 'playing', map: 'Challenge_Maze'}, config).assets.large_image, 'tka_menu');
  assert.equal(activity({phase: 'menu', map: 'Level_1'}, config).assets.large_image, 'tka_menu');
  assert.equal(activity({phase: 'playing', map: 'Level_1'}, {mapImages: {}}).assets, undefined);
});
test('all 11 user-confirmed maps override ambiguous class detection', () => {
  assert.equal(Object.keys(maps).length, 11);
  assert.equal(Object.values(maps).filter(m => m.mode === 'Desafio').length, 8);
  for (const [map, entry] of Object.entries(maps)) {
    const result = activity({phase: 'playing', map, mode: 'Outro modo', caption: 'Old caption',
      difficulty: 4, health: 1, health_max: 2, session_start: 1}, {});
    assert.equal(result.details, `${entry.mode} · ${entry.name}`);
    assert.equal(result.state, entry.lobby ? 'Lobby · Personalização' : 'Extremo · Vida: 50%');
  }
});
test('story and challenge presence from observed values', () => {
  const state = {phase: 'playing', mode: 'História', caption: 'Escritórios', difficulty: 3,
    health: 4.1, health_max: 4.1, session_start: 123};
  const first = activity(state, {});
  assert.equal(first.details, 'História · Escritórios');
  assert.equal(first.state, 'Difícil · Vida: 100%');
  assert.deepEqual(first.timestamps, {start: 123});
  assert.equal(activity({...state, difficulty: 4, health: 2.1, health_max: 3.1}, {}).state, 'Extremo · Vida: 68%');
  assert.equal(activity({...state, health: 0}, {}).state, 'Difícil · Vida: 0%');
});
test('menus and loading never show stale map, health or difficulty', () => {
  for (const phase of ['menu', 'loading']) {
    const result = activity({phase, map: 'Old_Map', difficulty: 4, health: 10, health_max: 10, session_start: 1}, {});
    assert.equal(result.state, 'The Killing Antidote');
    assert.ok(!result.details.includes('Old_Map'));
  }
});
test('unknown difficulty, invalid health and optional image', () => {
  const result = activity({phase: 'playing', map: 'Test', difficulty: 99, health: 10, health_max: 0}, {largeImage: 'tka'});
  assert.equal(result.state, 'Dificuldade 99');
  assert.equal(result.assets.large_image, 'tka');
  const utf = short('á'.repeat(200)); assert.equal(Buffer.byteLength(utf), 120); assert.ok(!utf.includes('�'));
});
test('IPC handles fragmented and combined frames including UTF8', () => {
  const received = [], decoder = new Decoder((op, body) => received.push([op, body.toString()]));
  const bytes = Buffer.concat([frame(1, {text: 'História'}), frame(3, Buffer.from('ping'))]);
  for (let i = 0; i < bytes.length; i += 3) decoder.push(bytes.subarray(i, i + 3));
  assert.deepEqual(received, [[1, '{"text":"História"}'], [3, 'ping']]);
});
