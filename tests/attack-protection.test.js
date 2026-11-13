import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRoom, setPhase, attackableTargets, protectedByCorrectVote,
  resolveAttack, playerView, autoAdvance
} from '../lib/game.js';

function makeRoom(protection=true){
  const room=createRoom('襲撃防御テスト');
  room.correctVoteProtection=protection;
  room.roster=[
    {id:'f',name:'狼',role:'frenemy',alive:true},
    {id:'a',name:'A',role:'citizen',alive:true},
    {id:'b',name:'B',role:'citizen',alive:true},
    {id:'c',name:'C',role:'citizen',alive:true},
    {id:'d',name:'D',role:'citizen',alive:true}
  ];
  room.themes=[{id:'t',title:'本当の1位',officialRanking:['a','b','c','d','f']}];
  room.finalVotes={f:'b',a:'a',b:'b',c:'a',d:'b'};
  setPhase(room,'result');
  return room;
}
test('new rooms enable correct-first-place attack protection',()=>{
  assert.equal(createRoom().correctVoteProtection,true);
});
test('only non-frenemy wrong voters are attackable with protection on',()=>{
  const room=makeRoom(true);
  assert.equal(room.roundResult.success,true);
  assert.equal(protectedByCorrectVote(room,'a'),true);
  assert.equal(protectedByCorrectVote(room,'c'),true);
  assert.equal(protectedByCorrectVote(room,'b'),false);
  assert.deepEqual(attackableTargets(room).map(c=>c.id),['b','d']);
});
test('attempting to attack a correct voter is rejected by server game logic',()=>{
  const room=makeRoom(true);
  room.attackVotes.f='a';
  assert.throws(()=>resolveAttack(room),/1位を正解した人/);
  assert.equal(room.roster.find(c=>c.id==='a').alive,true);
  room.attackVotes.f='b';
  const result=resolveAttack(room);
  assert.equal(result.victim.id,'b');
  assert.equal(result.blocked,false);
  assert.equal(room.roster.find(c=>c.id==='b').alive,false);
});
test('existing conventional rule stays available when protection is off',()=>{
  const room=makeRoom(false);
  assert.deepEqual(attackableTargets(room).map(c=>c.id),['a','b','c','d']);
  room.attackVotes.f='a';
  assert.equal(resolveAttack(room).victim.id,'a');
});
test('players only get their own protection status; attackers receive eligible targets',()=>{
  const room=makeRoom(true);
  const correct=playerView(room,{castId:'a',roleSeen:true});
  const wrong=playerView(room,{castId:'b',roleSeen:true});
  const frenemy=playerView(room,{castId:'f',roleSeen:true});
  assert.equal(correct.protectedByCorrectVote,true);
  assert.equal(wrong.protectedByCorrectVote,false);
  assert.equal(correct.attackableTargets,undefined);
  assert.equal(frenemy.attackableTargets,undefined); // attack-only disclosure
  room.phase='attack';
  const attackView=playerView(room,{castId:'f',roleSeen:true});
  assert.deepEqual(attackView.attackableTargets.map(c=>c.id),['b','d']);
});
test('automatic phase progression skips attack if nobody can be attacked',()=>{
  const room=makeRoom(true);
  room.finalVotes={f:'b',a:'a',b:'a',c:'a',d:'a'};
  room.roundResult.success=true; // stress-test a no-eligible-target state
  assert.equal(attackableTargets(room).length,0);
  room.autoAdvance=true;
  room.phaseChangedAt=Date.now()-20000;
  autoAdvance(room);
  assert.equal(room.phase,'suspectVote');
});
