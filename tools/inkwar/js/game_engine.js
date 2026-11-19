/* ---- src/engine/core.js ---- */
// ---- インク戦闘員ウォーズ：土台（盤・マス・向き・乱数） ----
//   IW：このゲームの名前空間。画面（DOM）を使わないので、node でテストできる。
//   盤：N×N のマス（19・25・31）。x は左右、y は奥（0）から手前（N-1）。
//   距離：縦と横の差の大きい方（斜めの隣も1マス）。
//   向き：0 奥（y−）・1 右（x＋）・2 手前（y＋）・3 左（x−）。
(function (IW) {
  'use strict';
  IW.VERSION = 'Ink99';
  IW.rng = function (seed) {
    let h = 1779033703 ^ String(seed).length;
    for (const ch of String(seed)) { h = Math.imul(h ^ ch.charCodeAt(0), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    const r = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
    r.pick = (L) => L[Math.floor(r() * L.length)];
    r.shuffle = (L) => { L = L.slice(); for (let i = L.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [L[i], L[j]] = [L[j], L[i]]; } return L; };
    r.chance = (p) => r() < p;
    return r;
  };
  IW.DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  IW.N8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
  IW.dist = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  IW.inB = (G, x, y) => x >= 0 && y >= 0 && x < G.N && y < G.N;
  IW.sgn = (v) => v > 0 ? 1 : v < 0 ? -1 : 0;
  // a から b を見た向き（いちばん近い4方向）
  IW.dirTo = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y; return Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 1 : 3) : (dy >= 0 ? 2 : 0); };
  // a と b が、縦か横の一直線にいるか
  IW.inLine = (a, b) => a.x === b.x || a.y === b.y;
  // b から見て、a がどこにいるか：'front'（表）・'side'（横）・'back'（背中側）・'behind'（真後ろの一直線）
  IW.sideOf = function (target, from) {
    const f = IW.DIRS[target.dir], dx = from.x - target.x, dy = from.y - target.y;
    const dot = dx * f[0] + dy * f[1];
    if (dot > 0) return 'front';
    if (dot === 0) return 'side';
    if ((f[0] === 0 && dx === 0) || (f[1] === 0 && dy === 0)) return 'behind';
    return 'back';
  };
  IW.at = (G, x, y) => G.grid[y * G.N + x] || null;
  IW.place = function (G, u, x, y) {
    if (u.x != null && G.grid[u.y * G.N + u.x] === u) G.grid[u.y * G.N + u.x] = null;
    u.x = x; u.y = y; G.grid[y * G.N + x] = u;
  };
  // 見通し（第3層の柱）：a から b までのまっすぐな線の上（両はしはのぞく）に、柱（kind:'wall'）がないか
  IW.clear = function (G, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, n = Math.max(Math.abs(dx), Math.abs(dy)) * 4;
    if (n <= 4) return true; // となりどうし
    let last = '';
    for (let i = 1; i < n; i++) {
      const x = Math.round(a.x + dx * i / n), y = Math.round(a.y + dy * i / n), k = x + ',' + y;
      if (k === last || (x === a.x && y === a.y) || (x === b.x && y === b.y)) continue; last = k;
      const w = G.grid[y * G.N + x]; if (w && (w.kind === 'wall' || w.kind === 'mirror')) return false; // 柱・鏡は、見通しをさえぎる
    }
    return true;
  };
  IW.isWall = (G, x, y) => { const w = IW.inB(G, x, y) && G.grid[y * G.N + x]; return !!(w && w.kind === 'wall'); };
  // 鏡（第7層）：ヒーローのレーザーは鏡で直角に曲がる。'/'：右→奥・左→手前・奥→右・手前→左。'\\'：右→手前・左→奥・奥→左・手前→右
  IW.reflect = (m, dx, dy) => m.mirror === '/' ? [-dy, -dx] : [dy, dx];
  //   ヒーローから (dx, dy) の向きに撃ったレーザーの通り道：[{x, y, fx, fy}]（fx・fy：そのマスに入る直前のマス＝当たり方の向き）。曲がった所 corners（はじめはヒーロー、鏡ごと、最後）
  IW.laserPath = function (G, h, dx, dy, max) {
    const cells = [], corners = [{ x: h.x, y: h.y }]; let x = h.x, y = h.y, n = 0, end = { x, y };
    while (n < max) {
      const px = x, py = y; x += dx; y += dy; n++;
      if (!IW.inB(G, x, y)) break;
      const w = G.grid[y * G.N + x];
      if (w && w.kind === 'mirror') { corners.push({ x, y }); [dx, dy] = IW.reflect(w, dx, dy); end = { x, y }; continue; }
      if (w && w.kind === 'wall') { end = { x: px, y: py }; break; }
      const wp = !w && IW.warpTo(G, x, y); // ワープ床（第8層）：だれも乗っていなければ、もう一方のワープ床から同じ向きに出る
      if (wp) { corners.push({ x, y, warp: true }); corners.push({ x: wp.x, y: wp.y }); x = wp.x; y = wp.y; const w2 = G.grid[y * G.N + x]; if (w2 && w2.kind === 'wall') break; cells.push({ x, y, fx: x - dx, fy: y - dy }); end = { x, y }; continue; }
      cells.push({ x, y, fx: px, fy: py }); end = { x, y };
    }
    corners.push(end);
    return { cells, corners };
  };
  // ワープ床（第8層）：G.warp[マス] ＝ つながっているもう一方のマス（なければ -1）
  IW.warpTo = (G, x, y) => { if (!G.warp || !IW.inB(G, x, y)) return null; const k = G.warp[y * G.N + x]; return k >= 0 ? { x: k % G.N, y: Math.floor(k / G.N) } : null; };
  //   ワープ床の上で止まった人を、もう一方へ（もう一方に、だれもいなければ）
  IW.warpUnit = function (G, u, ev) {
    const t = IW.warpTo(G, u.x, u.y); if (!t || IW.at(G, t.x, t.y)) return false;
    const fx = u.x, fy = u.y; IW.place(G, u, t.x, t.y); ev.push({ k: 'warp', id: u.id, fx, fy, x: t.x, y: t.y }); return true;
  };
  IW.remove = function (G, u) { if (u.x != null && G.grid[u.y * G.N + u.x] === u) G.grid[u.y * G.N + u.x] = null; u.gone = true; };
  // 歩けるマス：斜めの一歩は2として数える（元のゲームと同じ）。ほかの人のマスは通れない。
  IW.reach = function (G, u, mv) {
    const best = new Map(), key = (x, y) => y * G.N + x, Q = [[u.x, u.y, 0]];
    best.set(key(u.x, u.y), { c: 0, from: null });
    while (Q.length) {
      Q.sort((a, b) => a[2] - b[2]);
      const [x, y, c] = Q.shift();
      for (const [dx, dy] of IW.N8) {
        const nx = x + dx, ny = y + dy, nc = c + (dx && dy ? 2 : 1) + (G.puddle && u.kind === 'hero' && G.puddle[ny * G.N + nx] ? 0.01 : 0); // インクだまり（第5層）：同じ長さなら、だまりをよける道
        if (!IW.inB(G, nx, ny) || nc > mv + 0.5 || IW.at(G, nx, ny)) continue;
        const k = key(nx, ny), o = best.get(k);
        if (o && o.c <= nc) continue;
        best.set(k, { c: nc, from: key(x, y) }); Q.push([nx, ny, nc]);
      }
    }
    return best; // key → {c, from}
  };
  IW.pathTo = function (G, R, x, y) {
    const P = []; let k = y * G.N + x;
    while (k != null) { P.unshift({ x: k % G.N, y: Math.floor(k / G.N) }); const o = R.get(k); k = o ? o.from : null; }
    return P;
  };
})(typeof window !== 'undefined' ? (window.IW = window.IW || {}) : (globalThis.IW = globalThis.IW || {}));

/* ---- src/engine/rules.js ---- */
// ---- インク戦闘員ウォーズ：戦闘員のルール ----
//   戦闘員の体：表に「ツインキャノン（肩・高い）」「ベリータンク（お腹・まん中）」「ロングホース（手・低い）」。背中に「ジャンプ噴射のホールタンク」。
//   満タン：はじめはインクが満ちている。満タンのタンクに当たると、たいてい即はじける（85%）。15%は「インク漏れ」で止まる。
//     撃つと満タンは解ける。同じ組が全員一巡すると、撃たなくても解ける。そのあと2巡撃たないと、また満タンに戻る。
//   インク漏れ（元のゲームの溶解待ち＝爆発寸前）：当たった部分が使えなくなる。2ターンまでもつ：1ターン目の終わりに「ペタン座り」になって動けなくなり、2ターン目の終わりにはじける。
//     追撃1発、または隣の飛沫で即はじける。
//     残った出口で、まだ撃てる。自分の組の健在が0で、インク漏れが1人だけ、相手に健在がいるなら、次のターンで必ずはじける。
//   はじける：周りの8マスに飛沫。満タン・インク漏れは即はじける（連鎖）。健在で満タンでない子は、インク漏れになる。
//     はじけた子は、インクまみれで「ぷしゅー」と退場する（だれも傷つかない）。
//   背中：背中側からは、表の3つには当たらない。真後ろの一直線からだけ、ホールタンクに当たる（半分の確率）。当たれば即はじける。
//     ジャンプ中は、どこから撃たれてもホールタンクに当たり、1マス押されて即はじける。飛沫は、宙に浮いて離れているので、届くかは運次第（半々）。
(function (IW) {
  'use strict';
  IW.PARTS = { cannon: 'ツインキャノン', tank: 'ベリータンク', hose: 'ロングホース', valve: 'ホールタンク' };
  IW.HEIGHT = { cannon: 'high', tank: 'mid', hose: 'low' };
  let UID = 0;
  IW.makeMinion = function (team, name, x, y, dir) {
    return { id: ++UID, kind: 'minion', team, name, x, y, dir: dir || 0,
      full: true, idle: 0, shot: false, state: 'ok', // ok・leak・gone
      parts: { cannon: true, tank: true, hose: true, valve: true },
      cRange: 0, hRange: 3, hAge: 0, jumping: false, acted: false, moved: false, voice: 0 };
  };
  IW.resetIds = () => { UID = 0; };
  IW.newId = () => ++UID; // 人ではない物（ステージのインクタンク）にも番号をつける
  IW.alive = (u) => u && !u.gone;
  IW.cannonRange = (u) => Math.min(4, (u.full ? 3 : 2) + u.cRange);
  IW.hoseRange = (u) => u.state === 'leak' && u.parts.hose ? (u.press || 4) : Math.min(5, u.hRange);

  // 当たったときの結果。ev に出来事を足していく。src は撃った人（なければ null）
  // how：'cannon'・'hose'・'tank'・'valve'・'any'（部位を選ばない）・'kill'（状態に関係なく即はじける）
  IW.hitMinion = function (G, u, how, src, ev, opt) {
    opt = opt || {};
    if (!IW.alive(u) || u.state === 'gone') return null;
    const r = G.r;
    if (how === 'kill') return IW.burst(G, u, src, ev, opt.why || 'kill');
    // ジャンプ中：どこからでもホールタンク。1マス押されて即はじける
    if (u.jumping) {
      // ジャンプ中は宙に浮いて離れているので、飛沫が届くかは運次第（半々）。届けば即はじける。弾で直接撃たれたら、必ず即はじける
      if (how === 'splash' && r() >= (G.opt.jumpSplash != null ? G.opt.jumpSplash : 0.5)) { ev.push({ k: 'airSafe', id: u.id }); return 'miss'; }
      IW.push1(G, u, src, ev); return IW.burst(G, u, src, ev, 'valve');
    }
    if (src && how !== 'splash') {
      const sd = IW.sideOf(u, src);
      if (sd === 'behind' || how === 'valve') {
        if (sd !== 'behind') { ev.push({ k: 'miss', id: u.id, why: 'notbehind' }); return 'miss'; }
        if (r() < 0.5) return IW.burst(G, u, src, ev, 'valve');
        ev.push({ k: 'miss', id: u.id, why: 'valve' }); return 'miss';
      }
      if (sd === 'back' && !u.reflect) { ev.push({ k: 'miss', id: u.id, why: 'back' }); return 'miss'; }
      if (u.reflect && sd === 'front') { ev.push({ k: 'reflect', id: u.id }); return 'miss'; } // はね返しの盾（第7層の幹部）：正面からの弾・レーザーは、はね返す（横・うしろからなら当たる）
    }
    if (u.chief && !u.awake && IW.chiefGuarded(G, u)) { ev.push({ k: 'guard', id: u.id }); return 'miss'; } // 首領：部下が残っているあいだは、部下が守っていて効かない
    if (G.opt.anyBurst) return IW.burst(G, u, src, ev, 'full', how === 'splash' ? null : (how === 'any' ? 'tank' : how)); // ボーナス（固定砲台部隊）：どこに当たっても、パンパンのタンクがはじける
    if (u.hp) return IW.burst(G, u, src, ev, 'boss', how === 'splash' ? null : (how === 'any' ? 'tank' : how)); // ボス（ステージ）：当たるたびに体力が1へる。0になったらはじける
    // 当たる部分：同じ名前の部分が残っていればそこ、なければタンク（はじけるときも、どこに当たったかを event の part で伝える。演出で、そこが最初に破裂する）
    let part = how === 'any' || how === 'splash' ? 'tank' : how;
    if (!u.parts[part]) part = u.parts.tank ? 'tank' : (u.parts.cannon ? 'cannon' : 'hose');
    if (u.state === 'leak') return IW.burst(G, u, src, ev, 'again', how === 'splash' ? null : part);
    if (u.full && (part === 'tank' || how === 'splash')) { // 満タンは、ベリータンクだけのこと（キャノンやホースに当たっても、満タンだからとはじけない）
      if (r() < (opt.fullBurst != null ? opt.fullBurst : 0.85)) return IW.burst(G, u, src, ev, 'full', how === 'splash' ? null : 'tank');
    }
    // キャノンどうし：相手のキャノンをつぶすと、撃った側の射程が伸びる（はじめ+2、そのあと+1、上限6）
    if (src && src.kind === 'minion' && how === 'cannon' && part === 'cannon') src.cRange = (src.cRange || 0) + 1;
    u.parts[part] = false; u.state = 'leak'; u.full = false; u.jumping = false; u.leakAge = 0; u.sit = false;
    if (u.parts.hose) u.press = 3 + Math.floor(r() * 3); // インク漏れの圧で、ホースの射程が3〜5のどれか
    ev.push({ k: 'leak', id: u.id, part, by: src ? src.id : 0 });
    return 'leak';
  };
  IW.push1 = function (G, u, src, ev) {
    if (!src) return;
    const dx = IW.sgn(u.x - src.x), dy = IW.sgn(u.y - src.y), nx = u.x + dx, ny = u.y + dy;
    if (IW.inB(G, nx, ny) && !IW.at(G, nx, ny)) { IW.place(G, u, nx, ny); ev.push({ k: 'push', id: u.id, x: nx, y: ny }); }
  };
  // はじける → 飛沫で連鎖
  IW.burst = function (G, u, src, ev, why, part) {
    if (!IW.alive(u)) return null;
    if (u.chief && !u.awake && IW.chiefGuarded(G, u)) { ev.push({ k: 'guard', id: u.id }); return 'miss'; } // 首領（ふだん）：部下が守っている
    if (u.hp) { u.hp--; if (u.hp > 0) { ev.push({ k: 'bossHit', id: u.id, hp: u.hp, hp0: u.hp0, why, part: part || null }); return 'hp'; } why = why === 'chain' ? 'chain' : 'bossEnd'; } /* ボス：体力が残っていれば、ふくらむだけ */
    u.state = 'gone'; IW.remove(G, u);
    ev.push({ k: 'burst', id: u.id, why, by: src ? src.id : 0, x: u.x, y: u.y, team: u.team, part: part || null });
    if (G.puddle && !G.puddle[u.y * G.N + u.x]) { G.puddle[u.y * G.N + u.x] = 1; ev.push({ k: 'puddle', x: u.x, y: u.y }); } // 第5層：はじけた所に、インクだまり
    G.stat[u.team] = G.stat[u.team] || { burst: 0 }; G.stat[u.team].burst++;
    if (G.mode === 'solo') u.rank = G.units.filter(v => IW.alive(v) && v.kind === 'minion').length + 1; // 個人戦の順位（はじけた時点で残っていた人数＋1）
    if (src && src.kind === 'minion') src.kills = (src.kills || 0) + 1;
    if (G.hero && !G.hero.gone && IW.dist(G.hero, u) === 1) IW.heroInk(G, 1, ev, 'splash');
    // 飛沫
    const Q = [];
    for (const [dx, dy] of IW.N8) { const v = IW.at(G, u.x + dx, u.y + dy); if (v && (v.kind === 'minion' || v.kind === 'barrel') && IW.alive(v)) Q.push(v); }
    for (const v of Q) {
      if (!IW.alive(v)) continue;
      if (v.kind === 'barrel') { IW.barrelBlast(G, v, null, ev, u.id); continue; } // ステージのインクタンク：飛沫で大爆発
      if (v.hp) { IW.hitMinion(G, v, 'splash', null, ev); continue; } // ボス：飛沫でも体力が1へる
      if (v.full || v.state === 'leak') { ev.push({ k: 'chain', id: v.id, from: u.id }); IW.burst(G, v, null, ev, 'chain'); }
      else IW.hitMinion(G, v, 'splash', null, ev);
    }
    return 'burst';
  };

  // 首領（第9層）：ほかの部下が1人でも残っていれば、守られている
  IW.chiefGuarded = (G, u) => G.units.some(v => v !== u && v.kind === 'minion' && IW.alive(v));
  // 治す（第6層の救護係・幹部）：インク漏れの子を、元どおりに（こわれた武器・タンクも元にもどる。満タンではない）
  IW.heal = function (G, u, v, ev) {
    if (!IW.alive(v) || v.state !== 'leak') return false;
    v.state = 'ok'; v.parts = { cannon: true, tank: true, hose: true, valve: !v.pinned }; v.sit = false; v.leakAge = 0; v.press = undefined; v.full = false; v.idle = 0;
    ev.push({ k: 'heal', id: u.id, to: v.id });
    return true;
  };
  // 撃てる出口と、届く相手（攻撃する前の確認）
  //   cannon：射程は満タン3・解除2（相手のキャノンをつぶすと1ずつ伸びて、最大4）。左右で2人まで。
  //   hose：射程3。1ターンたつと4。撃つたびに+1（最大5）。インク漏れでホースが残ると、圧で3〜5。
  //   valve（ジャンプ噴射）：隣の1マスを選ぶと、自分を中心に凸の形（選んだマスと、自分の左右）に入った相手が即はじける。
  IW.canHitFrom = function (u, t) { // 相手 t の、どこに当たるか（表・横なら表の部分、真後ろならホールタンク）
    if (t.kind === 'hero') return 'body';
    if (t.jumping) return 'valve';
    const sd = IW.sideOf(t, u);
    return sd === 'back' ? null : sd === 'behind' ? 'valve' : 'front';
  };
  IW.exitTargets = function (G, u, exit) {
    const foes = G.units.filter(v => IW.alive(v) && v.team !== u.team && (v.kind === 'minion' || v.kind === 'hero') && IW.clear(G, u, v));
    if (exit === 'cannon') { if (!u.parts.cannon) return []; const R = IW.cannonRange(u); return foes.filter(v => IW.dist(u, v) <= R && IW.canHitFrom(u, v)); }
    if (exit === 'hose') { if (!u.parts.hose) return []; const R = IW.hoseRange(u); return foes.filter(v => IW.dist(u, v) <= R && IW.canHitFrom(u, v)); }
    if (exit === 'valve') { if (!u.parts.valve || u.state === 'leak' && !u.parts.valve) return []; return IW.DIRS.map((d, i) => ({ dir: i, cells: IW.jumpCells(G, u, i) })).filter(o => o.cells.some(c => { const v = IW.at(G, c.x, c.y); return v && v.team !== u.team && !v.jumping; })); }
    return [];
  };
  IW.jumpCells = function (G, u, dir) {
    const f = IW.DIRS[dir], l = IW.DIRS[(dir + 3) % 4], rr = IW.DIRS[(dir + 1) % 4];
    return [[u.x + f[0], u.y + f[1]], [u.x + l[0], u.y + l[1]], [u.x + rr[0], u.y + rr[1]]].filter(([x, y]) => IW.inB(G, x, y)).map(([x, y]) => ({ x, y }));
  };
  // 撃つ。targets：cannon は [相手] か [左, 右]、hose は [相手]、valve は {dir}
  IW.fire = function (G, u, exit, targets, ev) {
    ev.push({ k: 'fire', id: u.id, exit, to: exit === 'valve' ? [] : targets.map(t => t.id), dir: exit === 'valve' ? targets.dir : null });
    u.full = false; u.idle = 0; u.shot = true; u.acted = true;
    if (exit === 'valve') {
      u.dir = targets.dir; u.jumping = true;
      for (const c of IW.jumpCells(G, u, targets.dir)) {
        const v = IW.at(G, c.x, c.y); if (!v || v.team === u.team || v.kind === 'wall') continue;
        if (v.kind === 'barrel') { IW.barrelBlast(G, v, u, ev); continue; } // ジャンプ噴射がタンクに当たった
        if (v.kind === 'hero') IW.heroHit(G, v, u, 5, ev); else if (!v.jumping) IW.hitMinion(G, v, 'kill', u, ev, { why: 'jump' });
      }
      return;
    }
    u.dir = IW.dirTo(u, targets[0]);
    for (const t of targets) {
      if (!IW.alive(t)) continue;
      if (t.kind === 'hero') IW.heroHit(G, t, u, 1, ev, exit);
      else if (t.kind === 'barrel') { if (G.r() < (G.opt.acc || 0.75)) IW.barrelBlast(G, t, u, ev); else ev.push({ k: 'wide', id: t.id, from: u.id }); } // ステージ：インクタンクをねらう
      else {
        // 紅白戦・個人戦：戦闘員どうしの弾は8割当たる。それた弾は、相手の向こうへ飛んでいく
        if (G.mode && G.mode !== 'hero' && G.r() > (G.opt.accMM || 0.8)) { ev.push({ k: 'wide', id: t.id, from: u.id }); IW.stray(G, u, t, ev, exit, 0.35, 0.4); continue; }
        IW.hitMinion(G, t, exit, u, ev);
      }
    }
    if (exit === 'hose') u.hRange++;
  };
  // 組の一巡が終わったとき：満タンの出入り、インク漏れが半々ではじける、ホースの射程
  IW.teamRoundEnd = function (G, team, ev) {
    const M = G.units.filter(v => v.kind === 'minion' && v.team === team && IW.alive(v));
    for (const u of M) {
      u.jumping = false;
      if (u.full) { u.full = false; u.idle = 0; }
      else if (!u.shot) { u.idle++; if (u.idle >= 2 && u.state === 'ok') { u.full = true; u.idle = 0; ev.push({ k: 'refill', id: u.id }); } }
      u.shot = false; u.acted = false; u.moved = false;
      u.hAge++; if (u.hAge === 1 && u.hRange === 3) u.hRange = 4;
      if (u.pinned) u.full = true; // 壁に張り付いた子（ボーナス）は、ずっとパンパン
      if (G.puddle && G.puddle[u.y * G.N + u.x] && u.state === 'ok') { if (!u.full) ev.push({ k: 'refill', id: u.id }); u.full = true; } // インクだまりの上の子は、満タンになる
    }
    // インク漏れは2ターンまでもつ：1ターン目の終わりにペタン座り（動けない）、2ターン目の終わりにはじける（強化ヒーローの「ターン経過破裂なし」では起きない）
    if (!G.noTimeBurst) {
      const L = M.filter(v => v.state === 'leak');
      const healthy = M.filter(v => v.state === 'ok').length, foeHealthy = G.units.some(v => IW.alive(v) && v.team !== team && (v.kind === 'hero' || v.state === 'ok'));
      for (const u of L) {
        if (!IW.alive(u)) continue;
        u.leakAge = (u.leakAge || 0) + 1;
        const must = G.mode !== 'solo' && healthy === 0 && L.length === 1 && foeHealthy; // 個人戦（1人1組）では、この決まりは使わない
        if (must || u.leakAge >= 2) IW.burst(G, u, null, ev, 'time');
        else if (!u.sit) { u.sit = true; ev.push({ k: 'sit', id: u.id }); }
      }
    }
  };
})(typeof window !== 'undefined' ? (window.IW = window.IW || {}) : (globalThis.IW = globalThis.IW || {}));

/* ---- src/engine/hero.js ---- */
// ---- インク戦闘員ウォーズ：ヒーロー ----
//   スーツの「よごれ」（浴びたインクの回数）：54まではスーツが通さない。
//     55：不調 → 撤退を始める（端に着いて2ターン待つと去る＝戦闘員の「撃退」勝ち）。撤退中、戦闘員は3マス以内なら「ねばねばインク」を飛ばせる（当たると移動−1）。
//     60：スーツ機能停止（移動3・レーザー6・攻撃1回・表からの両断なし）
//     70：変身解除（移動2・レーザー4・ブレードはインク漏れの子だけ）
//     80：たおれる（戦闘員の大勝利）
//   ふつう：移動5、攻撃は移動の前と後に1回ずつ（先に動くと、後の1回だけ）。強化：移動7、攻撃3回。
//   ブレード：射程1。向きは関係ない。背中からならホールタンクを一刀（即はじける）。表・横なら両断（即はじける）、その先の1マスにも衝撃波。
//     ときどき（2割）キャノンだけ・タンクだけ・ホースだけを斬り、そのときはインク漏れで、衝撃波は出ない。
//   レーザー：縦か横の一直線なら10マス貫通（狙った高さの部分だけ）。それ以外は10マス以内の1人。背中側には当たらない。ホールタンクは真後ろの一直線だけ。
//   わざ（使うと3ターン休み）：薙ぎ払い（隣の8マスを即はじけさせる）・ハレー彗星（直線10マスに流星を飛ばして即、両隣に飛沫。ヒーローはその場に残る）
//     強化だけ：レーザーブレイク（5マス以内を全員即）・ホーミング（4人の同じ部分に上から。ホールタンクは、ジャンプ中だけ当たる）
//   盾：インクを受けるとき隣に戦闘員がいれば、1割でその子を前に出して受けさせる。
//   かわす：2割でかわす。かわされた弾はヒーローの向こう3マスまで飛び、そこにいる戦闘員に当たる（同士討ち）。
//   それる：弾の半分ほどはそれる。それた弾も向こうへ飛び、3割で仲間に当たる。
//   投げ：ヒーローの番のはじめ、2マス以内に戦闘員がいて、ぶつけられる相手がいれば、5割で投げる（ぶつかった2人に当たる）。
(function (IW) {
  'use strict';
  IW.makeHero = function (x, y, opt) {
    opt = opt || {};
    return { id: 999, kind: 'hero', team: 'hero', name: opt.name || 'ブルーセイバー', x, y, dir: 0, ink: 0, power: !!opt.power,
      cool: { sweep: 0, comet: 0, lbreak: 0, homing: 0 }, slow: 0, retreat: false, edgeWait: 0, gone: false };
  };
  IW.heroLevel = (h) => h.ink >= 80 ? 4 : h.ink >= 70 ? 3 : h.ink >= 60 ? 2 : h.ink >= 55 ? 1 : 0;
  IW.HERO_LV = ['ふつう', '不調', 'スーツ機能停止', '変身解除', 'たおれた'];
  IW.heroStats = function (h) {
    const lv = IW.heroLevel(h);
    let mv = h.power ? 7 : 5, atk = (h.power ? 3 : 2) + (h.extraAtk || 0), laser = 10; // extraAtk：特別ステージで攻撃がふえる
    if (lv >= 2) { mv = 3; laser = 6; atk = 1; }
    if (lv >= 3) { mv = 2; laser = 4; }
    return { lv, mv: Math.max(1, mv - (h.slow || 0)), atk, laser, frontCut: lv < 2, bladeLeakOnly: lv >= 3 };
  };
  IW.heroInk = function (G, n, ev, why) {
    const h = G.hero; if (!h || h.gone) return;
    const lv0 = IW.heroLevel(h); h.ink += n;
    ev.push({ k: 'ink', id: h.id, n, total: h.ink, why });
    const lv = IW.heroLevel(h);
    if (lv > lv0) {
      ev.push({ k: 'herolv', lv, name: IW.HERO_LV[lv] });
      if (lv >= 1) h.retreat = true;
      if (lv >= 4) { h.gone = true; G.result = G.result || 'defeated'; ev.push({ k: 'end', res: 'defeated' }); }
    }
  };
  // 戦闘員の攻撃がヒーローに来たとき
  IW.heroHit = function (G, h, src, n, ev, exit) {
    const r = G.r;
    // ねらいがそれる：キャノン・ホースは2割5分ほど外れる（Ink03 で射程を短くしたぶん、ねらいを定めて撃つので当たりやすく）（ジャンプ噴射は外れない）。外れた弾は、ヒーローの向こうへ飛んでいき、仲間に当たることがある（同士討ち）
    if (n === 1 && r() > (G.opt.acc || 0.75)) { ev.push({ k: 'wide', id: h.id, from: src.id }); IW.stray(G, src, h, ev, exit, 0.3, 0.3); return 'wide'; }
    if (n === 1) {
      // 盾：隣の戦闘員を前に出す
      const adj = G.units.filter(v => IW.alive(v) && v.kind === 'minion' && IW.dist(v, h) === 1 && v !== src);
      if (adj.length && r() < 0.1) {
        const s = r.pick(adj); ev.push({ k: 'shield', id: h.id, by: s.id });
        IW.hitMinion(G, s, 'any', null, ev); return 'shield';
      }
      if (r() < 0.2) {
        ev.push({ k: 'dodge', id: h.id, from: src.id });
        IW.stray(G, src, h, ev, exit, 0.08, 1); // かわされた弾は、まっすぐ向こうへ
        return 'dodge';
      }
    }
    IW.heroInk(G, n, ev, 'hit');
    return 'hit';
  };
  // それた弾：撃った子からヒーローへの向きの先、3マスまでを飛ぶ。ぶれ（spread）の分だけ向きがずれる。
  //   最初にいた戦闘員に p の確率で当たる（当たり方はふつうの弾と同じ。表・横・背中で変わる）。
  IW.stray = function (G, src, h, ev, exit, spread, p) {
    const r = G.r; let dx = h.x - src.x, dy = h.y - src.y; const L = Math.hypot(dx, dy) || 1, a = (r() * 2 - 1) * spread;
    dx /= L; dy /= L; const c = Math.cos(a), s = Math.sin(a), ux = dx * c - dy * s, uy = dx * s + dy * c;
    let seen = h.x + ',' + h.y;
    for (let t = 0.5; t <= 3.2; t += 0.25) {
      const x = Math.round(h.x + ux * t), y = Math.round(h.y + uy * t), k = x + ',' + y; if (k === seen) continue; seen = k;
      if (!IW.inB(G, x, y)) return null;
      const v = IW.at(G, x, y); if (!v || v === src) continue;
      if (v.kind === 'barrel' && IW.alive(v)) { if (r() >= p) return null; ev.push({ k: 'stray', id: v.id, from: src.id, exit: exit || 'hose' }); IW.barrelBlast(G, v, src, ev); return v; } // それた弾が、インクタンクに
      if (v.kind !== 'minion' || !IW.alive(v)) return null;
      if (r() >= p) { ev.push({ k: 'graze', id: v.id, from: src.id }); return null; } // かすめただけ
      ev.push({ k: 'stray', id: v.id, from: src.id, exit: exit || 'hose' });
      IW.hitMinion(G, v, exit === 'cannon' || exit === 'hose' ? exit : 'any', src, ev);
      return v;
    }
    return null;
  };
  // 攻撃の候補（UI と AI が使う）
  IW.heroMoves = function (G, h) {
    const S = IW.heroStats(h), foes = G.units.filter(v => IW.alive(v) && v.kind === 'minion');
    const L = [];
    // ブレード
    for (const v of foes) if (IW.dist(h, v) === 1 && (!S.bladeLeakOnly || v.state === 'leak')) L.push({ w: 'blade', t: v });
    const see = (v) => IW.clear(G, h, v); // 柱のむこうには、レーザーがとどかない
    // レーザー：高さを選ぶ
    for (const v of foes) {
      const d = IW.dist(h, v); if (d > S.laser || !see(v)) continue;
      const sd = IW.sideOf(v, h);
      if (sd === 'back') continue;
      if (sd === 'behind') { L.push({ w: 'laser', t: v, hgt: 'valve' }); continue; }
      for (const hgt of ['high', 'mid', 'low']) L.push({ w: 'laser', t: v, hgt });
    }
    // 特別ステージ（鉄柱の通路）：となりの戦闘員をつかんで、近くの鉄柱へ放り投げる（鉄柱は4マス以内・いちばん近いもの）
    if (G.poles) { const adj = foes.filter(v => IW.dist(h, v) === 1 && !v.boss); if (adj.length) for (const P of G.poles) if (IW.dist(h, P) <= 4 && P.stack.length < 13) L.push({ w: 'pole', t: adj[0], all: adj, pole: P }); } // となりの子を全員まとめて、選んだ鉄柱へ
    // 第8層のワープ床：一直線に見えている、だれも乗っていないワープ床に向けて撃つと、もう一方から出る
    for (const pd of G.pads || []) { if (IW.at(G, pd.x, pd.y)) continue; const d = IW.dist(h, pd); if (d <= S.laser && d > 0 && IW.inLine(h, pd) && see(pd)) for (const hgt of ['high', 'mid', 'low']) L.push({ w: 'laser', t: pd, hgt }); }
    // 第7層の鏡：一直線で見えている鏡に向けて撃つと、鏡で曲がる（高さを選ぶ）
    for (const mr of G.units.filter(v => v.kind === 'mirror')) { const d = IW.dist(h, mr); if (d <= S.laser && IW.inLine(h, mr) && see(mr)) for (const hgt of ['high', 'mid', 'low']) L.push({ w: 'laser', t: mr, hgt }); }
    // ステージのインクタンク：ブレードで斬る（隣）か、レーザーで撃つ（高さは関係ない）
    for (const b of G.units.filter(v => v.kind === 'barrel' && IW.alive(v))) { const d = IW.dist(h, b); if (d === 1 && !S.bladeLeakOnly) L.push({ w: 'blade', t: b }); if (d <= S.laser && see(b)) L.push({ w: 'laser', t: b, hgt: 'mid' }); }
    const c = h.cool;
    if (!c.sweep && foes.some(v => IW.dist(h, v) === 1)) L.push({ w: 'sweep' });
    if (!c.comet) for (let d = 0; d < 4; d++) { const cells = IW.cometCells(G, h, d); if (cells.hit.length) L.push({ w: 'comet', dir: d, n: cells.hit.length }); }
    if (h.power && !c.lbreak && foes.some(v => IW.dist(h, v) <= 5)) L.push({ w: 'lbreak' });
    if (h.power && !c.homing && foes.length) L.push({ w: 'homing' });
    return L;
  };
  IW.cometCells = function (G, h, d) {
    const [dx, dy] = IW.DIRS[d], hit = []; let end = { x: h.x, y: h.y };
    for (let i = 1; i <= 10; i++) {
      const x = h.x + dx * i, y = h.y + dy * i; if (!IW.inB(G, x, y)) break;
      const v = IW.at(G, x, y); if (v && (v.kind === 'wall' || v.kind === 'mirror')) break; // 流星も柱・鏡で止まる
      if (v && (v.kind === 'minion' || v.kind === 'barrel')) hit.push(v);
      if (!v) end = { x, y };
    }
    return { hit, end };
  };
  const PART_OF = { high: 'cannon', mid: 'tank', low: 'hose' };
  IW.heroAttack = function (G, h, m, ev) {
    const S = IW.heroStats(h), r = G.r;
    ev.push({ k: 'hatk', id: h.id, w: m.w, to: m.t ? m.t.id : 0, hgt: m.hgt, dir: m.dir, bend: m.w === 'laser' && m.t && IW.inLine(h, m.t) && (G.units.some(u => u.kind === 'mirror') || G.warp) ? IW.laserPath(G, h, IW.sgn(m.t.x - h.x), IW.sgn(m.t.y - h.y), S.laser).corners : null });
    if (m.t) h.dir = IW.dirTo(h, m.t);
    if (m.t && m.t.kind === 'barrel' && !IW.inLine(h, m.t) || m.w === 'blade' && m.t.kind === 'barrel') { IW.barrelBlast(G, m.t, h, ev); return; } // インクタンク
    if (m.w === 'blade') {
      const v = m.t, sd = IW.sideOf(v, h);
      if (v.reflect && sd === 'front') { ev.push({ k: 'reflect', id: v.id, w: 'blade' }); return; } // はね返しの盾（第7層の幹部）：正面からのブレードは、はね返す
      if (S.bladeLeakOnly) { IW.burst(G, v, h, ev, 'blade'); return; }
      if (sd === 'behind' || sd === 'back') { IW.burst(G, v, h, ev, 'bladeBack'); return; }
      if (!S.frontCut || r() < 0.2) { const p = r.pick(['cannon', 'tank', 'hose'].filter(k => v.parts[k])) || 'tank'; IW.hitMinion(G, v, p, h, ev, { fullBurst: 0 }); return; }
      const dx = IW.sgn(v.x - h.x), dy = IW.sgn(v.y - h.y), bx = v.x + dx, by = v.y + dy;
      IW.burst(G, v, h, ev, 'cut');
      const w = IW.inB(G, bx, by) && IW.at(G, bx, by);
      if (w && w.kind === 'minion' && IW.alive(w)) { ev.push({ k: 'wave', id: w.id }); IW.burst(G, w, h, ev, 'wave'); }
      return;
    }
    if (m.w === 'laser') {
      const v = m.t, part = m.hgt === 'valve' ? 'valve' : PART_OF[m.hgt];
      if (IW.inLine(h, v)) { // 一直線：貫通（10マスまで）。柱で止まり、鏡で曲がる（当たり方は、そのマスに入ってきた向きで決まる）
        const LP = IW.laserPath(G, h, IW.sgn(v.x - h.x), IW.sgn(v.y - h.y), S.laser);
        for (const c of LP.cells) {
          const w = IW.at(G, c.x, c.y); if (w && w.kind === 'barrel' && IW.alive(w)) { IW.barrelBlast(G, w, h, ev); continue; } // レーザーが通ると、タンクは大爆発
          if (!w || w.kind !== 'minion' || !IW.alive(w)) continue;
          const from = { x: c.fx, y: c.fy, id: h.id, kind: 'hero' }, sd = IW.sideOf(w, from);
          if (part === 'valve' ? sd === 'behind' : (sd === 'front' || sd === 'side') && w.parts[part] || w.reflect && sd !== 'front') IW.hitMinion(G, w, w.reflect && part !== 'valve' && !w.parts[part] ? 'tank' : part, from, ev);
        }
      } else IW.hitMinion(G, v, part, h, ev);
      return;
    }
    if (m.w === 'pole') { // 鉄柱へ放り投げる（となりの子を全員まとめて）：ホースとタンクに鉄柱が通って、柱の根もとまで落ちて動けない（インク漏れのまま、はじけずに耐える）
      const P = m.pole, list = (m.all || [m.t]).filter(v => IW.alive(v));
      list.forEach((v, k) => {
        if (P.stack.length >= 13) return;
        const idx = P.stack.length, face = G.r() < 0.5 ? 'up' : 'down', ang = G.r() * Math.PI * 2;
        v.state = 'leak'; v.stuck = { pole: P.id, idx, face, ang }; v.parts.hose = false; v.parts.tank = false; v.full = false; v.jumping = false; IW.remove(G, v); P.stack.push(v.id);
        G.stat.poled = (G.stat.poled || 0) + 1;
        ev.push({ k: 'pole', id: v.id, pole: P.id, px: P.x, py: P.y, idx, face, ang, n: k, of: list.length });
      });
      if (P.stack.length >= (G.opt.poleLimit || 12)) IW.poleBurst(G, P, h, ev, 1);
      return;
    }
    if (m.w === 'sweep') { h.cool.sweep = 3; for (const v of G.units.filter(v => IW.alive(v) && (v.kind === 'minion' || v.kind === 'barrel') && IW.dist(h, v) === 1)) { if (!IW.alive(v)) continue; if (v.kind === 'barrel') IW.barrelBlast(G, v, h, ev); else IW.burst(G, v, h, ev, 'sweep'); } return; }
    if (m.w === 'comet') {
      h.cool.comet = 3; const C = IW.cometCells(G, h, m.dir), [dx, dy] = IW.DIRS[m.dir];
      const side = [IW.DIRS[(m.dir + 1) % 4], IW.DIRS[(m.dir + 3) % 4]];
      for (const v of C.hit) {
        if (!IW.alive(v)) continue;
        if (v.kind === 'barrel') { IW.barrelBlast(G, v, h, ev); continue; }
        IW.burst(G, v, h, ev, 'comet');
        for (const [sx, sy] of side) { const w = IW.at(G, v.x + sx, v.y + sy); if (w && w.kind === 'minion' && IW.alive(w)) IW.hitMinion(G, w, 'splash', h, ev); }
      }
      h.dir = m.dir; return;
    }
    if (m.w === 'lbreak') { h.cool.lbreak = 3; for (const v of G.units.filter(v => IW.alive(v) && v.kind === 'minion' && IW.dist(h, v) <= 5)) IW.burst(G, v, h, ev, 'lbreak'); return; }
    if (m.w === 'homing') {
      h.cool.homing = 3; const part = m.part || r.pick(['cannon', 'tank', 'hose']);
      const L = G.units.filter(v => IW.alive(v) && v.kind === 'minion').sort((a, b) => IW.dist(h, a) - IW.dist(h, b)).slice(0, 4);
      for (const v of L) { if (v.jumping) IW.burst(G, v, h, ev, 'homing'); else IW.hitMinion(G, v, part, null, ev); }
    }
  };
  // 鉄柱の限界：だれか1人が「ごめん！」とはじけ、そこから上下へ、柱の子たちが順番にはじける。
  //   そのインクが、同じ列（たて・よこ）の鉄柱へ飛び、6人以上つながっている柱は、こらえきれずにはじける（連鎖）。ぷよぷよのように、積んでから消す
  IW.poleBurst = function (G, P, h, ev, chain) {
    if (!P.stack.length) return;
    const k = Math.floor(G.r() * P.stack.length), order = P.stack.map((id, i) => ({ id, d: Math.abs(i - k) + G.r() * 0.1 })).sort((a, b) => a.d - b.d).map(o => o.id);
    ev.push({ k: 'poleBurst', pole: P.id, px: P.x, py: P.y, start: P.stack[k], order, idx: P.stack.slice(), chain });
    for (const id of order) { const u = G.units.find(x => x.id === id); u.stuck.burst = true; u.state = 'gone'; ev.push({ k: 'burst', id, why: 'poleBurst', by: h.id, x: P.x, y: P.y, team: 'ink', part: null }); G.stat.ink = G.stat.ink || { burst: 0 }; G.stat.ink.burst++; }
    P.stack = [];
    G.stat.poleChain = Math.max(G.stat.poleChain || 0, chain);
    for (const [dx, dy] of IW.N8) { const w = IW.at(G, P.x + dx, P.y + dy); if (w && w.kind === 'minion' && IW.alive(w)) IW.hitMinion(G, w, 'splash', null, ev); else if (w && w.kind === 'hero') IW.heroInk(G, 3, ev, 'splash'); } // 柱のまわりにも飛沫
    for (const Q of G.poles) if (Q !== P && Q.stack.length >= (G.opt.poleChainMin || 6) && (Q.x === P.x || Q.y === P.y)) { ev.push({ k: 'poleLink', from: P.id, to: Q.id, fx: P.x, fy: P.y, tx: Q.x, ty: Q.y, chain: chain + 1 }); IW.poleBurst(G, Q, h, ev, chain + 1); }
  };
  // 投げ：2マス以内の子をつかんで、いちばん近いほかの子の隣にぶつける
  IW.heroThrow = function (G, h, ev) {
    const M = G.units.filter(v => IW.alive(v) && v.kind === 'minion');
    const near = M.filter(v => IW.dist(h, v) <= 2); if (!near.length) return false;
    const a = G.r.pick(near);
    const others = M.filter(v => v !== a).sort((p, q) => IW.dist(a, p) - IW.dist(a, q));
    for (const b of others.slice(0, 3)) {
      for (const [dx, dy] of IW.N8) {
        const x = b.x + dx, y = b.y + dy;
        if (!IW.inB(G, x, y) || IW.at(G, x, y)) continue;
        ev.push({ k: 'throw', id: h.id, who: a.id, x, y, at: b.id });
        IW.place(G, a, x, y);
        IW.hitMinion(G, a, 'any', null, ev); IW.hitMinion(G, b, 'any', null, ev);
        return true;
      }
    }
    return false;
  };
})(typeof window !== 'undefined' ? (window.IW = window.IW || {}) : (globalThis.IW = globalThis.IW || {}));

/* ---- src/engine/match.js ---- */
// ---- インク戦闘員ウォーズ：対戦の流れ（ヒーロー対決） ----
//   IW.newMatch(opt)：盤と人を並べる。opt = {seed, N（19・25・31）, mode:'hero', form（塊・整列・間隔・ランダム）, count（40）, power（強化ヒーロー）, reinforce（四隅に増援）}
//   ヒーローの番 → 戦闘員の番（全員が1回ずつ）→ 一巡の終わり（満タン・インク漏れ）→ 増援 → …
//   勝ち負け：G.result = 'cleared'（ヒーローが全員はじけさせた）・'repelled'（ヒーローが撤退した）・'defeated'（ヒーローがたおれた）
//   出来事は ev の配列に、起きた順に積む（3Dの画面は、これを順番に見せる）。
(function (IW) {
  'use strict';
  const NAMES = ['アカネ', 'ミドリ', 'ルリ', 'コハク', 'ヒスイ', 'サンゴ', 'モモ', 'ユズ', 'スミレ', 'ツバキ', 'カエデ', 'ナギ', 'シズク', 'ホタル', 'ミオ', 'リン', 'サクラ', 'ツムギ', 'ヒナ', 'アオイ', 'カリン', 'ノゾミ', 'マユ', 'ヨツバ', 'イブキ', 'ハル', 'ナツ', 'アキ', 'フユ', 'ミク', 'ソラ', 'ウミ', 'ネネ', 'キキ', 'ララ', 'ルル', 'ココ', 'ミミ', 'ナナ', 'チカ', 'エマ', 'レイ', 'ユメ', 'サエ', 'トモ'];
  IW.NAMES = NAMES;
  IW.FORMS = { clump: '塊', rows: '整列', spaced: '間隔', random: 'ばらばら' };
  IW.newMatch = function (opt) {
    opt = Object.assign({ seed: 'ink', N: 19, mode: 'hero', form: 'clump', count: 40, power: false, reinforce: false }, opt || {});
    IW.resetIds();
    const G = { opt, N: opt.N, grid: new Array(opt.N * opt.N).fill(null), units: [], r: IW.rng(opt.seed), turn: 1, side: 'hero', stat: {}, result: null, noTimeBurst: false, log: [], spawnN: 0 };
    const h = IW.makeHero(Math.floor(G.N / 2), G.N - 2, { power: opt.power }); h.dir = 0; G.hero = h; G.units.push(h); IW.place(G, h, h.x, h.y);
    const cells = IW.formCells(G, opt.form, opt.count);
    const names = G.r.shuffle(NAMES);
    cells.forEach((c, i) => { const u = IW.makeMinion('ink', names[i % names.length] + (i >= names.length ? (Math.floor(i / names.length) + 1) : ''), c.x, c.y, 2); u.voice = i % 9; G.units.push(u); IW.place(G, u, c.x, c.y); });
    return G;
  };
  // 40人の並べ方（ヒーローの反対側＝奥）
  IW.formCells = function (G, form, n) {
    const N = G.N, r = G.r, out = [], used = new Set(), ok = (x, y) => IW.inB(G, x, y) && y < N - 5 && !used.has(y * N + x);
    const add = (x, y) => { if (out.length < n && ok(x, y)) { used.add(y * N + x); out.push({ x, y }); return true; } return false; };
    const cx = Math.floor(N / 2);
    if (form === 'rows') { // 列：前から並ぶ（隣どうし1マス空け）
      for (let row = 0; out.length < n && row < 8; row++) for (let i = 0; i < N && out.length < n; i++) { const x = cx + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 2 + (row % 2); add(x, 1 + row * 2); }
    } else if (form === 'spaced') { // 斜めも含めて2マス以上空ける
      for (let y = 0; y < N - 6 && out.length < n; y += 3) for (let x = (y / 3) % 2 ? 1 : 0; x < N && out.length < n; x += 3) add(x, y);
      while (out.length < n) add(r.int(0, N - 1), r.int(0, N - 7));
    } else if (form === 'random') {
      let g = 0; while (out.length < n && g++ < 5000) add(r.int(0, N - 1), r.int(0, N - 7));
    } else { // 塊：2×2 の塊を並べる（塊の中は隣どうし）
      const K = Math.ceil(n / 4), per = Math.max(1, Math.floor((N - 1) / 4));
      for (let k = 0; k < K; k++) {
        const bx = 1 + (k % per) * 4 + (Math.floor(k / per) % 2) * 2, by = 1 + Math.floor(k / per) * 3;
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) add(bx + dx, by + dy);
      }
      let g = 0; while (out.length < n && g++ < 5000) add(r.int(0, N - 1), r.int(0, N - 7));
    }
    return out;
  };
  IW.minions = (G) => G.units.filter(v => IW.alive(v) && v.kind === 'minion');
  IW.checkEnd = function (G, ev) {
    if (G.result) return G.result;
    // 首領の覚醒：部下がみんなはじけて、ひとりぼっちになったとき「みんなの想い……受け取ったのじゃ！」
    const M = IW.minions(G);
    if (M.length === 1 && M[0].chief && !M[0].awake) { const c = M[0]; c.awake = true; c.hp = c.hp0 = G.stage && G.stage.awakeHp || 10; c.fast = !!(G.stage && G.stage.awakeFast); c.full = true; c.state = 'ok'; c.parts = { cannon: true, tank: true, hose: true, valve: true }; ev.push({ k: 'awaken', id: c.id, hp: c.hp }); }
    if (!IW.minions(G).length) { G.result = 'cleared'; ev.push({ k: 'end', res: 'cleared' }); }
    return G.result;
  };

  // ===== ヒーローの番 =====
  IW.heroTurnStart = function (G, ev) {
    const h = G.hero;
    for (const k in h.cool) if (h.cool[k] > 0) h.cool[k]--;
    ev.push({ k: 'turn', side: 'hero', n: G.turn });
    const nearBarrel = G.units.some(b => b.kind === 'barrel' && IW.alive(b) && IW.dist(b, h) <= 3); // ステージ：インクタンクのそばでは投げない（ヒーローが自分で動く前に爆発しないように）
    if (!h.retreat && !nearBarrel && !G.poles && G.r() < 0.5) IW.heroThrow(G, h, ev); // 鉄柱の通路では、自分で投げるので、勝手には投げない
    IW.checkEnd(G, ev);
  };
  IW.heroTurnEnd = function (G, ev) {
    const h = G.hero; h.slow = 0;
    if (h.retreat && !h.gone) {
      const onEdge = h.x === 0 || h.y === 0 || h.x === G.N - 1 || h.y === G.N - 1;
      if (onEdge) { h.edgeWait++; if (h.edgeWait > 2) { h.gone = true; IW.remove(G, h); G.result = 'repelled'; ev.push({ k: 'leave', id: h.id }); ev.push({ k: 'end', res: 'repelled' }); } }
    }
  };
  IW.heroMove = function (G, h, x, y, ev) {
    const R = IW.reach(G, h, IW.heroStats(h).mv), k = y * G.N + x; if (!R.has(k)) return false;
    const P = IW.pathTo(G, R, x, y); IW.place(G, h, x, y);
    if (P.length > 1) { h.dir = IW.dirTo(P[P.length - 2], P[P.length - 1]); ev.push({ k: 'move', id: h.id, path: P }); }
    if (G.puddle) { const n = P.slice(1).filter(c => G.puddle[c.y * G.N + c.x]).length; if (n) IW.heroInk(G, n, ev, 'puddle'); } // インクだまりを通ると、1マスごとによごれ+1
    if (G.warp) IW.warpUnit(G, h, ev); // ワープ床で止まったら、もう一方へ
    return true;
  };

  // ===== 戦闘員の番 =====
  IW.minionTurn = function (G, ev) {
    ev.push({ k: 'turn', side: 'ink', n: G.turn });
    const h = G.hero;
    // 第6層の幹部：治しの号令（番のはじめに、まわりのインク漏れの仲間を、まとめて治す）
    for (const u of IW.minions(G)) if (u.healer) for (const v of IW.minions(G)) if (v !== u && v.state === 'leak' && IW.dist(u, v) <= u.healer) IW.heal(G, u, v, ev);
    const order = IW.minions(G).sort((a, b) => IW.dist(a, h) - IW.dist(b, h));
    for (const u of order) {
      if (!IW.alive(u) || G.result) continue;
      IW.aiMinion(G, u, ev);
      if (u.fast && IW.alive(u) && !G.result && !h.gone) { u.acted = false; IW.aiMinion(G, u, ev); } // すばやい幹部（第8層）：1つの番に2回動く
      if (h.gone) break;
    }
    // 覚醒した首領の大技「首領インクストーム」：2ターンに1回、ヒーローに上からインクの雨（柱・鏡のかげなら防げる）
    for (const u of IW.minions(G)) if (u.chief && u.awake && !G.result && !h.gone && (u.stormT = (u.stormT || 0) + 1) % 2 === 1) { const safe = !IW.clear(G, u, h); ev.push({ k: 'storm', id: u.id, safe }); if (!safe) IW.heroInk(G, 3, ev, 'storm'); }
    if (!G.result) IW.teamRoundEnd(G, 'ink', ev);
    // 増援：四隅に1人ずつ
    if (G.opt.reinforce && !G.result && (G.opt.waves == null || (G.spawnWaves = (G.spawnWaves || 0) + 1) <= G.opt.waves)) { /* waves：ステージでは、増援は決まった回数だけ */
      for (const [x, y] of [[0, 0], [G.N - 1, 0], [0, G.N - 1], [G.N - 1, G.N - 1]]) {
        if (IW.at(G, x, y)) continue;
        const u = IW.makeMinion('ink', IW.NAMES[(G.spawnN++) % IW.NAMES.length] + '・増', x, y, IW.dirTo({ x, y }, h)); u.voice = G.spawnN % 9; if (G.opt.spawnWorker) u.worker = true; // 第4層：増援も作業員（コンベアに運ばれる）
        G.units.push(u); IW.place(G, u, x, y); ev.push({ k: 'spawn', id: u.id, x, y });
      }
    }
    if (G.belt && !G.result) IW.beltStep(G, ev); // ステージ第4層：ベルトコンベアで運ばれる
    IW.checkEnd(G, ev);
    if (!G.result) G.turn++; // Ink95：戦闘員の番に決着したら、ターンは進めない（結果のターン数と、上の帯をそろえる）
  };

  // ===== 1ターンをまるごと AI で進める（テスト・観戦用） =====
  IW.runTurn = function (G) {
    const ev = [];
    IW.heroTurnStart(G, ev);
    if (!G.result) IW.aiHero(G, G.hero, ev);
    if (!G.result) IW.heroTurnEnd(G, ev);
    if (!G.result) IW.minionTurn(G, ev);
    G.log.push(...ev);
    return ev;
  };
  IW.runAll = function (G, maxT) {
    while (!G.result && G.turn <= (maxT || 60)) IW.runTurn(G);
    if (!G.result) G.result = 'timeup';
    return G.result;
  };
})(typeof window !== 'undefined' ? (window.IW = window.IW || {}) : (globalThis.IW = globalThis.IW || {}));

/* ---- src/engine/ai.js ---- */
// ---- インク戦闘員ウォーズ：AI（戦闘員とヒーロー） ----
//   戦闘員：射程・背中・インク漏れ・満タンのルールに従って撃つ。
//     立つ場所の点数：ヒーローに届く（+）・ジャンプ噴射が届く（++）・満タンやインク漏れの仲間の隣（連鎖が怖いので −）・ヒーローの隣（ブレードが怖いので −）。
//     ヒーローの隣で倒れているインク漏れの仲間がいれば、その子を撃つ（自爆して、ヒーローにインク5回分）。
//     ヒーローが撤退中なら、3マス以内から「ねばねばインク」（移動−1）。
//   ヒーロー：はじけさせられる人数がいちばん多い攻撃を選ぶ。動く先は「次に多く倒せて、撃たれにくい」マス。
(function (IW) {
  'use strict';
  const MV = 4;
  // 相手（ヒーロー）に、どの出口で撃てるか（その場所から）
  function shotsFrom(G, u, x, y, h) {
    const d = Math.max(Math.abs(x - h.x), Math.abs(y - h.y)), S = [];
    if (!IW.clear(G, { x, y }, h)) return S; // 柱でさえぎられていると撃てない
    if (u.parts.cannon && d <= IW.cannonRange(u)) S.push({ exit: 'cannon', v: 1 });
    if (u.parts.hose && d <= IW.hoseRange(u)) S.push({ exit: 'hose', v: 1 });
    if (u.parts.valve && u.state === 'ok' && d === 1 && (x === h.x || y === h.y)) S.push({ exit: 'valve', v: 5 });
    return S;
  }
  function riskAt(G, u, x, y) {
    let k = 0;
    for (const [dx, dy] of IW.N8) {
      const v = IW.at(G, x + dx, y + dy);
      if (!v || v === u || v.kind !== 'minion') continue;
      k += v.state === 'leak' ? 3 : v.full ? 1.5 : 0.4;
    }
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const b = IW.inB(G, x + dx, y + dy) && IW.at(G, x + dx, y + dy); if (b && b.kind === 'barrel') k += 2; } // インクタンクのそばはこわい
    return k;
  }
  IW.aiMinion = function (G, u, ev) {
    const h = G.hero; if (!h || h.gone) return;
    // ヒーローの隣で倒れているインク漏れの仲間を撃つ（自爆）
    const down = IW.minions(G).filter(v => v !== u && v.state === 'leak' && IW.dist(v, h) === 1);
    for (const v of down) {
      const d = IW.dist(u, v);
      const ex = !IW.clear(G, u, v) ? null : u.parts.cannon && d <= IW.cannonRange(u) ? 'cannon' : u.parts.hose && d <= IW.hoseRange(u) ? 'hose' : null;
      if (ex && G.r() < 0.7) {
        ev.push({ k: 'fire', id: u.id, exit: ex, to: [v.id], self: true }); u.full = false; u.idle = 0; u.shot = true;
        ev.push({ k: 'selfburst', id: v.id });
        IW.burst(G, v, u, ev, 'self'); IW.heroInk(G, 4, ev, 'self'); // はじけたときの1回と合わせて5回分
        return;
      }
    }
    // 首領（ふだん）：こわがって、ヒーローからいちばん遠い所へ逃げる。撃ってこない
    if (u.chief && !u.awake) {
      const R0 = IW.reach(G, u, MV); let far = null;
      for (const [k, o] of R0) { const x = k % G.N, y = Math.floor(k / G.N), d = Math.max(Math.abs(x - h.x), Math.abs(y - h.y)) + (IW.clear(G, { x, y }, h) ? 0 : 2) - o.c * 0.05 + G.r() * 0.2; if (!far || d > far.d) far = { x, y, d }; }
      if (far && (far.x !== u.x || far.y !== u.y)) { const P = IW.pathTo(G, R0, far.x, far.y); IW.place(G, u, far.x, far.y); u.dir = IW.dirTo(u, h); ev.push({ k: 'move', id: u.id, path: P, flee: true }); }
      return;
    }
    // 第6層の救護係：となりにインク漏れの仲間がいれば治す（その番は治すだけ）。いなければ、インク漏れの仲間のとなりへ歩いていって治す
    if (u.medic && !u.sit && u.state === 'ok') {
      const hurt = IW.minions(G).filter(v => v !== u && v.state === 'leak' && !v.pinned);
      const adj = hurt.find(v => IW.dist(v, u) === 1);
      if (adj) { IW.heal(G, u, adj, ev); return; }
      if (hurt.length && !u.worker) {
        const R0 = IW.reach(G, u, MV); let bestC = null;
        for (const [k, o] of R0) { const x = k % G.N, y = Math.floor(k / G.N); const v = hurt.find(w => Math.max(Math.abs(w.x - x), Math.abs(w.y - y)) === 1); if (!v) continue; const sc = -o.c - (Math.max(Math.abs(x - h.x), Math.abs(y - h.y)) === 1 ? 4 : 0) - G.r() * 0.3; if (!bestC || sc > bestC.sc) bestC = { x, y, v, sc }; }
        if (bestC) {
          if (bestC.x !== u.x || bestC.y !== u.y) { const P = IW.pathTo(G, R0, bestC.x, bestC.y); IW.place(G, u, bestC.x, bestC.y); u.moved = true; u.dir = IW.dirTo(u, bestC.v); ev.push({ k: 'move', id: u.id, path: P }); }
          IW.heal(G, u, bestC.v, ev); return;
        }
      }
    }
    // ステージ（opt.shootBarrel）：ヒーローのそばのインクタンクを撃って、まとめてよごす（自分が巻きこまれない所から）
    if (G.opt.shootBarrel && !u.sit) {
      const B = G.units.filter(b => b.kind === 'barrel' && IW.alive(b) && IW.dist(b, h) <= 2 && IW.dist(b, u) > 2 && IW.clear(G, u, b) && IW.clear(G, b, h));
      for (const b of B) {
        const d = IW.dist(u, b), ex = u.parts.cannon && d <= IW.cannonRange(u) ? 'cannon' : u.parts.hose && d <= IW.hoseRange(u) ? 'hose' : null;
        if (ex && G.r() < 0.75) { IW.fire(G, u, ex, [b], ev); return; }
      }
    }
    // 動く先を選ぶ
    const R = IW.reach(G, u, u.sit || u.pinned || u.worker ? 0 : u.state === 'leak' ? 1 : MV); // ペタン座りの子・壁に張り付いた子は動けない
    const lost = (G.opt.count || 40) - IW.minions(G).length;
    let best = null;
    for (const [k, o] of R) {
      const x = k % G.N, y = Math.floor(k / G.N);
      const S = shotsFrom(G, u, x, y, h), d = Math.max(Math.abs(x - h.x), Math.abs(y - h.y));
      let sc = 0;
      if (S.length) sc += 10 + Math.max(...S.map(s => s.v)) * (S.some(s => s.exit === 'valve') ? (lost >= 3 ? 4 : 1.2) : 1);
      else sc -= d * 0.8;
      sc -= riskAt(G, u, x, y) * 2.2;
      if (d === 1 && !S.some(s => s.exit === 'valve')) sc -= 5;
      if (G.opt.rush) sc += d === 1 ? 14 : -d * 1.5; // 特別ステージ：ヒーローに、つかみかかるように押し寄せる
      if (h.retreat && d <= 3) sc += 3;
      if (IW.inLine({ x, y }, h) && d > 1) sc -= 0.6; // レーザーの一直線は少しこわい
      sc -= o.c * 0.05 + G.r() * 0.3;
      if (!best || sc > best.sc) best = { x, y, sc, S };
    }
    if (best && (best.x !== u.x || best.y !== u.y)) {
      const P = IW.pathTo(G, R, best.x, best.y); IW.place(G, u, best.x, best.y); u.moved = true;
      u.dir = IW.dirTo(u, h); ev.push({ k: 'move', id: u.id, path: P });
      if (G.warp && IW.warpUnit(G, u, ev)) u.dir = IW.dirTo(u, h); // ワープ床で止まったら、もう一方へ
    }
    // 撃つ
    const S = shotsFrom(G, u, u.x, u.y, h);
    if (h.retreat && IW.dist(u, h) <= 3 && G.r() < 0.35) {
      ev.push({ k: 'sticky', id: u.id, to: h.id }); h.slow = Math.min(4, (h.slow || 0) + 1); u.shot = true; u.full = false; return;
    }
    if (!S.length) return;
    const valve = S.find(s => s.exit === 'valve');
    if (valve && !G.opt.rush && (lost >= 3 || G.r() < 0.25)) { IW.fire(G, u, 'valve', { dir: IW.dirTo(u, h) }, ev); return; }
    const ex = S.find(s => s.exit === 'cannon') && (!S.find(s => s.exit === 'hose') || G.r() < 0.5) ? 'cannon' : (S.find(s => s.exit === 'hose') ? 'hose' : S[0].exit);
    if (ex === 'valve') { if (G.opt.rush) return; IW.fire(G, u, 'valve', { dir: IW.dirTo(u, h) }, ev); return; }
    IW.fire(G, u, ex, [h], ev);
  };

  // ===== ヒーローの AI =====
  // 攻撃の見込み（はじけさせる人数のめやす）
  function value(G, h, m) {
    const S = IW.heroStats(h);
    const kill = (v, part) => (v.chief && !v.awake && IW.chiefGuarded(G, v) ? -1 : 0) + (v.medic || v.healer ? 0.5 : 0) + (v.hp ? (v.hp === 1 ? 1.2 : 0.6) : v.state === 'leak' || (v.full && (!part || part === 'tank')) ? 1 : 0.35); /* 救護係・幹部は先にねらう価値が高い */ // ボスは、体力が残っていても当てる価値がある
    if (m.t && m.t.kind === 'barrel' && (m.w === 'blade' || !IW.inLine(h, m.t))) return IW.barrelValue(G, m.t, h.x, h.y); // 満タンが効くのは、ベリータンクに当たったときだけ
    if (m.w === 'pole') { // 鉄柱へ放り投げる（となりの子を全員）。12人めで、その柱と、同じ列で6人以上の柱が連鎖してはじける
      //   作戦（ぷよぷよのように）：まだ戦闘員が多いうちは、同じ列の柱をそれぞれ6人以上にしておき（積む）、それから1本を12人に（消す）
      const P = m.pole, n = Math.min((m.all || [m.t]).length, 13 - P.stack.length), after = P.stack.length + n, lim = G.opt.poleLimit || 12, cm = G.opt.poleChainMin || 6;
      const partners = G.poles.filter(Q => Q !== P && (Q.x === P.x || Q.y === P.y)), ready = partners.filter(Q => Q.stack.length >= cm), left = IW.minions(G).length - n;
      let v = 1.7 * n;
      if (after >= lim) { let tot = after; for (const Q of ready) tot += Q.stack.length; v += tot * 0.9; if (!ready.length && left > 8) v -= 4; } // まだ積めるうちは、ひとつだけ消すのはもったいない
      else { if (P.stack.length < cm && after >= cm) v += 1.2; v += Math.min(after, lim - 1) * 0.04; if (after >= lim - 2 && !ready.length && left > 8) v -= 0.8; }
      return v - IW.dist(h, P) * 0.01;
    }
    if (m.w === 'blade' && m.t.reflect && IW.sideOf(m.t, h) === 'front') return 0;
    if (m.w === 'blade') { let s = S.bladeLeakOnly ? 1 : IW.sideOf(m.t, h) === 'behind' || IW.sideOf(m.t, h) === 'back' || S.frontCut ? 1 : kill(m.t); return s + 0.3; }
    if (m.w === 'laser') {
      const part = m.hgt === 'valve' ? 'valve' : { high: 'cannon', mid: 'tank', low: 'hose' }[m.hgt];
      if (m.t.reflect && IW.sideOf(m.t, h) === 'front') return 0; // はね返しの盾には、正面からは効かない
      if (!IW.inLine(h, m.t)) return part === 'valve' ? 0.5 : kill(m.t, m.t.parts[part] ? part : 'tank') * (m.t.parts[part] ? 1 : 0.8);
      let s = 0;
      for (const c of IW.laserPath(G, h, IW.sgn(m.t.x - h.x), IW.sgn(m.t.y - h.y), S.laser).cells) { const w = IW.at(G, c.x, c.y); if (w && w.kind === 'barrel') { s += IW.barrelValue(G, w, h.x, h.y); continue; } if (!w || w.kind !== 'minion') continue; const sd = IW.sideOf(w, { x: c.fx, y: c.fy }); if (w.reflect) { if (sd !== 'front') s += kill(w, 'tank') + 0.6; continue; } if (part === 'valve' ? sd === 'behind' : (sd === 'front' || sd === 'side') && w.parts[part]) s += part === 'valve' ? 0.5 : kill(w, part) + (part === 'tank' && w.full ? 0.3 : 0); }
      return s;
    }
    if (m.w === 'sweep') return G.units.filter(v => IW.alive(v) && v.kind === 'minion' && IW.dist(h, v) === 1).length * 1.1 - 0.8 + G.units.filter(v => IW.alive(v) && v.kind === 'barrel' && IW.dist(h, v) === 1).reduce((a, b) => a + IW.barrelValue(G, b, h.x, h.y), 0);
    if (m.w === 'comet') return m.n * 1.2 - 0.8 + IW.cometCells(G, h, m.dir).hit.filter(v => v.kind === 'barrel').reduce((a, b) => a + IW.barrelValue(G, b, h.x, h.y), 0);
    if (m.w === 'lbreak') return G.units.filter(v => IW.alive(v) && v.kind === 'minion' && IW.dist(h, v) <= 5).length - 1;
    if (m.w === 'homing') return 1.6;
    return 0;
  }
  // G.opt.weak（テスト用の「ふつうの人役」）：ときどき2番め・3番めの攻撃を選び、ときどき適当な所へ動く。人が遊んだときの手ごたえを測る
  function bestAttack(G, h, plan) {
    const L = [];
    for (const m of IW.heroMoves(G, h)) L.push({ m, v: value(G, h, m) + G.r() * 0.05 });
    if (!L.length) return null;
    L.sort((a, b) => b.v - a.v);
    if (G.opt.weak && !plan && G.r() < G.opt.weak) { const ok = L.filter(x => x.v > 0.2).slice(0, 4); if (ok.length) return ok[Math.floor(G.r() * ok.length)]; }
    return L[0];
  }
  function threat(G, x, y) {
    let n = 0;
    for (const v of IW.minions(G)) { const d = Math.max(Math.abs(v.x - x), Math.abs(v.y - y)); if (d <= Math.max(IW.cannonRange(v), IW.hoseRange(v)) && (d === 1 || IW.clear(G, v, { x, y }))) n += d === 1 ? 2 : 1; } // 柱のかげは安全
    for (const b of G.units) if (b.kind === 'barrel' && IW.alive(b) && Math.max(Math.abs(b.x - x), Math.abs(b.y - y)) <= 2 && IW.clear(G, b, { x, y })) n += G.opt.shootBarrel ? 6 : 1.5; // インクタンクのそばは、撃たれると大きくよごれる
    return n;
  }
  IW.aiHero = function (G, h, ev) {
    const S = IW.heroStats(h);
    let atk = S.atk;
    const doAtk = () => { const b = bestAttack(G, h); if (b && b.v > 0.2) { IW.heroAttack(G, h, b.m, ev); atk--; IW.checkEnd(G, ev); return true; } return false; };
    // 移動の前の攻撃（強化は、3回のうち移動の前に2回まで）
    const pre = h.power ? 2 : 1;
    for (let i = 0; i < pre && atk > 1 && !G.result; i++) if (!doAtk()) break;
    if (G.result) return;
    // 動く
    const R = IW.reach(G, h, S.mv);
    let best = null;
    for (const [k] of R) {
      let x = k % G.N, y = Math.floor(k / G.N);
      const wpt = G.warp && IW.warpTo(G, x, y); if (wpt && !IW.at(G, wpt.x, wpt.y)) { x = wpt.x; y = wpt.y; } // ワープ床なら、飛んだ先で考える
      let sc;
      if (h.retreat) sc = -Math.min(x, y, G.N - 1 - x, G.N - 1 - y) * 3 - threat(G, x, y) * 0.3;
      else {
        const ox = h.x, oy = h.y; IW.place(G, h, x, y);
        const b = bestAttack(G, h, true); IW.place(G, h, ox, oy);
        sc = (b ? b.v : 0) * 3 - threat(G, x, y) * 0.35;
        const M = IW.minions(G); if (M.length && (!b || b.v < 0.5)) sc -= Math.min(...M.map(v => Math.max(Math.abs(v.x - x), Math.abs(v.y - y)))) * 0.5;
      }
      if (G.puddle) { const P = IW.pathTo(G, R, x, y); sc -= P.slice(1).filter(c => G.puddle[c.y * G.N + c.x]).length * (h.retreat ? 0.3 : 1.2); } // インクだまりを通る道は、よごれるのでいや
      sc += G.r() * (G.opt.weak ? 6 * G.opt.weak : 0.1); // ふつうの人役は、動く先の選び方が大ざっぱ
      if (!best || sc > best.sc) best = { x: k % G.N, y: Math.floor(k / G.N), sc };
    }
    if (best) IW.heroMove(G, h, best.x, best.y, ev);
    while (atk > 0 && !G.result) if (!doAtk()) break;
  };
})(typeof window !== 'undefined' ? (window.IW = window.IW || {}) : (globalThis.IW = globalThis.IW || {}));

/* ---- src/engine/team.js ---- */
// ---- インク戦闘員ウォーズ：紅白戦・個人戦（スライム戦闘員どうしの、鍛え合い） ----
//   ヒーローをたおすために、仲間どうしで鍛え合う。赤組20人 対 白組20人。相手を全員はじけさせた組の勝ち（全滅だけで決まる）。
//   紅白戦：赤組を、遊ぶ人が1人ずつ指揮する（観戦も選べる）。
//   個人戦：40人全員が敵どうしのバトルロイヤル。最後の1人が優勝。遊ぶ人は1人（頭の上に黄色い矢印）を動かす。1人1組（team は 'p1'〜）。
//   戦い方の芯：武器（キャノン・ホース）で戦うが、その武器が弱点。
//     キャノンの弾は相手のキャノンの高さ、ホースの弾は相手のホースの高さ（腰）に当たる。武器に当たると、その武器はこわれてインク漏れ（満タンかどうかは関係ない）。
//     その武器がもうなければ、弾はお腹のベリータンクに当たる。ベリータンクはただの弱点（武器ではない）。満タンのベリータンクに当たると、たいてい即はじける。
//     背中にはホールタンク（下の穴からインクを出して、ジャンプ噴射する）。背中側からは表に当たらず、真後ろの一直線からだけホールタンクをねらえる。
//     戦闘員どうしの弾は、8割当たる。それた弾は、相手の向こう3マスまで飛び、そこにいる子（敵でも味方でも）に当たることがある。
//   番の順：赤と白が1人ずつ交互に動く（1ラウンド目の先手はくじ、そのあとはラウンドごとに入れかわる）。全員が動いたら、ラウンドの終わり（満タン・インク漏れ）。
(function (IW) {
  'use strict';
  IW.TEAM = { red: '赤組', white: '白組' };
  IW.foeTeam = (t) => t === 'red' ? 'white' : 'red';
  IW.teamUnits = (G, team) => G.units.filter(v => IW.alive(v) && v.kind === 'minion' && v.team === team);
  // 片側の並べ方：自分の陣地（白組は奥、赤組は手前）の中に
  function halfCells(G, form, n, team) {
    const N = G.N, r = G.r, out = [], used = new Set(), maxY = Math.floor((N - 11) / 2); // 0〜maxY 行（奥側）。赤組は上下を反転。あいだは9行あけて、1ターン目からは撃ち合えないように
    const ok = (x, y) => x >= 0 && x < N && y >= 0 && y <= maxY && !used.has(y * N + x);
    const add = (x, y) => { if (out.length < n && ok(x, y)) { used.add(y * N + x); out.push({ x, y }); return true; } return false; };
    const cx = Math.floor(N / 2);
    if (form === 'rows') { for (let row = 0; out.length < n && row <= maxY; row++) for (let i = 0; i < N && out.length < n; i++) add(cx + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 2 + (row % 2), maxY - row * 2); }
    else if (form === 'spaced') { for (let y = maxY; y >= 0 && out.length < n; y -= 3) for (let x = ((maxY - y) / 3) % 2 ? 1 : 0; x < N && out.length < n; x += 3) add(x, y); }
    else if (form === 'clump') { const per = Math.max(1, Math.floor((N - 1) / 4)); for (let k = 0; out.length < n && k < 40; k++) { const bx = 1 + (k % per) * 4 + (Math.floor(k / per) % 2) * 2, by = maxY - 1 - Math.floor(k / per) * 3; for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) add(bx + dx, by + dy); } }
    let g = 0; while (out.length < n && g++ < 5000) add(r.int(0, N - 1), r.int(0, maxY));
    return team === 'red' ? out.map(c => ({ x: c.x, y: N - 1 - c.y })) : out;
  }
  IW.newTeamMatch = function (opt) {
    opt = Object.assign({ seed: 'team', N: 19, mode: 'team', form: 'clump', count: 20, accMM: 0.8 }, opt || {});
    IW.resetIds();
    const G = { opt, mode: opt.mode, N: opt.N, grid: new Array(opt.N * opt.N).fill(null), units: [], r: IW.rng(opt.seed), turn: 1, side: 'red', stat: {}, result: null, noTimeBurst: false, log: [], spawnN: 0, hero: null, mine: 0 };
    const names = G.r.shuffle(IW.NAMES);
    let ni = 0;
    if (opt.mode === 'solo') { // 個人戦：盤いっぱいに、間をあけた場所から40か所を選んで、まん中を向いて立つ
      const N = G.N, sp = N >= 25 ? 3 : 2, spots = []; let row = 0; for (let y = 1; y < N - 1; y += sp, row++) for (let x = 1 + (row % 2) * (sp === 3 ? 1 : 1); x < N - 1; x += 3) spots.push({ x, y }); // 19マスは縦2・横3おき、広い盤は3おき
      const C = G.r.shuffle(spots).slice(0, Math.min(opt.count2 || 40, spots.length)), c0 = (N - 1) / 2;
      C.forEach((c, i) => { const u = IW.makeMinion('p' + (i + 1), names[i % names.length] + (i >= names.length ? (Math.floor(i / names.length) + 1) : ''), c.x, c.y, IW.dirTo(c, { x: c0, y: c0 })); u.voice = i % 9; u.color = i; G.units.push(u); IW.place(G, u, c.x, c.y); });
      const M = G.units.slice().sort((a, b) => Math.hypot(a.x - c0, a.y - c0 * 1.4) - Math.hypot(b.x - c0, b.y - c0 * 1.4)); G.mine = M[0].id; M[0].mine = true;
      return G;
    }
    for (const team of ['white', 'red']) {
      halfCells(G, opt.form, opt.count, team).forEach((c) => {
        const i = ni++, u = IW.makeMinion(team, names[i % names.length] + (i >= names.length ? (Math.floor(i / names.length) + 1) : ''), c.x, c.y, team === 'red' ? 0 : 2);
        u.voice = i % 9; G.units.push(u); IW.place(G, u, c.x, c.y);
      });
    }
    return G;
  };
  IW.checkTeamEnd = function (G, ev) {
    if (G.result) return G.result;
    if (G.mode === 'solo') { // 個人戦：残り1人で優勝（0人なら引き分け）
      const A = G.units.filter(v => IW.alive(v) && v.kind === 'minion');
      if (A.length <= 1) { G.result = A.length ? 'win' : 'draw'; G.winner = A.length ? A[0].id : 0; if (A[0]) A[0].rank = 1; ev.push({ k: 'end', res: G.result }); }
      return G.result;
    }
    const r = IW.teamUnits(G, 'red').length, w = IW.teamUnits(G, 'white').length;
    if (!r || !w) { G.result = !r && !w ? 'draw' : r ? 'red' : 'white'; ev.push({ k: 'end', res: G.result }); }
    return G.result;
  };
  // ===== 1ラウンドの流れ：赤と白が、1人ずつ交互に動く（先に動く組は、ラウンドごとに入れかわる） =====
  //   人数の差が出たら、残っている側が続けて動く。全員が動いたら、ラウンドの終わり（満タン・インク漏れ）。
  IW.roundStart = function (G, ev) {
    // 1ラウンド目の先手は、くじ（どちらの組にも同じ確率で）。そのあとは、毎ラウンド交代
    if (!G.first0) G.first0 = G.opt.first || (G.r() < 0.5 ? 'red' : 'white');
    G.first = G.turn % 2 ? G.first0 : IW.foeTeam(G.first0); G.next = G.first;
    for (const u of G.units) if (u.kind === 'minion') u.acted = false;
    if (G.mode === 'solo') { G.queue = G.r.shuffle(G.units.filter(v => IW.alive(v) && v.kind === 'minion').map(v => v.id)); ev.push({ k: 'turn', side: 'solo', n: G.turn, left: G.queue.length }); return; } // 個人戦：動く順は、ラウンドごとにくじ引き
    ev.push({ k: 'turn', side: G.first, n: G.turn });
  };
  IW.canAct = (G, team) => IW.teamUnits(G, team).some(u => !u.acted);
  // 次に動く組（どちらも動き終わっていれば null）
  IW.whoNext = function (G) {
    if (G.result) return null;
    if (G.mode === 'solo') { for (const id of G.queue || []) { const u = G.units.find(v => v.id === id); if (u && IW.alive(u) && !u.acted) return u.team; } return null; }
    const a = G.next, b = IW.foeTeam(a);
    if (IW.canAct(G, a)) return a; if (IW.canAct(G, b)) return b; return null;
  };
  IW.afterAct = function (G, team, ev) { G.next = IW.foeTeam(team); IW.checkTeamEnd(G, ev); };
  IW.roundEnd = function (G, ev) {
    if (!G.result) { if (G.mode === 'solo') { for (const t of [...new Set(G.units.filter(v => IW.alive(v) && v.kind === 'minion').map(v => v.team))]) if (!G.result) { IW.teamRoundEnd(G, t, ev); IW.checkTeamEnd(G, ev); } } else { IW.teamRoundEnd(G, 'red', ev); IW.teamRoundEnd(G, 'white', ev); } }
    IW.checkTeamEnd(G, ev); G.turn++;
  };
  // AI：その組の動いていない子の中から、いちばん良い手のある子を選んで、動かす
  IW.teamAIStep = function (G, team, ev, skip) {
    const C = IW.teamUnits(G, team).filter(u => !u.acted && !(skip && skip.has(u.id)));
    if (!C.length) return null;
    let best = null; for (const u of C) { const pl = IW.planTeamMinion(G, u); if (pl && (!best || pl.sc > best.pl.sc)) best = { u, pl }; }
    const u = best ? best.u : C[0];
    if (best) IW.execTeamPlan(G, u, best.pl, ev);
    u.acted = true; return u;
  };
  // テスト・観戦用：1ラウンドを AI だけで
  IW.runTeamTurn = function (G) {
    const ev = []; IW.roundStart(G, ev); let t;
    while ((t = IW.whoNext(G))) { IW.teamAIStep(G, t, ev); IW.afterAct(G, t, ev); }
    IW.roundEnd(G, ev); G.log.push(...ev); return ev;
  };

  // ===== 撃ったら、どこに当たるか（画面の説明と AI が使う） =====
  //   返り値：{ part:'cannon'|'hose'|'tank'|'valve'|null, note } … null は当たらない（背中側）
  IW.hitPreview = function (u, t, exit, from) {
    const p = from || u, sd = IW.sideOf(t, p);
    if (t.jumping) return { part: 'valve', note: 'ジャンプ中：ホールタンクに当たり、即はじける' };
    if (sd === 'back') return { part: null, note: '背中側：表には当たらない' };
    if (sd === 'behind') return { part: 'valve', note: '真後ろ：背中のホールタンク（半分の確率で、即はじける）' };
    let part = exit === 'cannon' ? 'cannon' : 'hose';
    if (!t.parts[part]) part = t.parts.tank ? 'tank' : t.parts.cannon ? 'cannon' : 'hose';
    const nm = { cannon: '相手のキャノン', hose: '相手のホース', tank: '相手のベリータンク' }[part];
    const what = t.state === 'leak' ? 'インク漏れなので、即はじける' : part === 'tank' ? (t.full ? 'ベリータンクが満タン：たいてい即はじける' : 'ベリータンクにひび（インク漏れ）') : 'こわれて、インク漏れ';
    return { part, note: nm + (part !== (exit === 'cannon' ? 'cannon' : 'hose') ? '（武器はもうないので）' : '') + '：' + what };
  };

  // ===== 戦闘員どうしの AI =====
  const MV = 4; let W_ENTER = 2.5; IW._setEnter = (v) => { W_ENTER = v; };
  // 撃ったときの値うち（はじけさせる見込み・相手の連鎖・味方の巻き込み）
  function shotValue(G, u, t, part) {
    if (!part) return 0;
    let v;
    if (part === 'valve') v = t.jumping ? 3 : 1.5;
    else if (t.state === 'leak') v = 3;
    else if (t.full && part === 'tank') v = 2.8;
    else v = part === 'tank' ? 1.3 : 1.1; // 武器をこわすのも大事（満タンは、ベリータンクに当たったときだけ効く）
    const burstLikely = part === 'valve' || t.state === 'leak' || (t.full && part === 'tank');
    if (burstLikely) for (const [dx, dy] of IW.N8) { const w = IW.at(G, t.x + dx, t.y + dy); if (!w || w.kind !== 'minion' || !IW.alive(w)) continue; if (w.team !== u.team) v += (w.full || w.state === 'leak') ? 1.2 : 0.4; else v -= (w.full || w.state === 'leak') ? 1.6 : 0.6; }
    return v;
  }
  function bestShot(G, u, x, y) {
    const p = { x, y }, F = G.units.filter(v => IW.alive(v) && v.kind === 'minion' && v.team !== u.team);
    let best = null;
    for (const t of F) {
      const d = Math.max(Math.abs(t.x - x), Math.abs(t.y - y));
      for (const exit of ['cannon', 'hose']) {
        if (!u.parts[exit]) continue;
        if (d > (exit === 'cannon' ? IW.cannonRange(u) : IW.hoseRange(u))) continue;
        const hp = IW.hitPreview(u, t, exit, p); if (!hp.part) continue;
        const v = shotValue(G, u, t, hp.part) * 0.8; // 8割当たる
        if (!best || v > best.v) best = { exit, t, v };
      }
    }
    // ジャンプ噴射：前と左右の3マスの相手が即はじける
    if (u.parts.valve && u.state === 'ok') for (let dir = 0; dir < 4; dir++) {
      const cells = IW.jumpCells(G, p, dir); let v = 0, n = 0;
      for (const c of cells) { const w = IW.at(G, c.x, c.y); if (!w || w === u || w.kind !== 'minion') continue; if (w.team !== u.team) { v += 2.2; n++; } }
      if (n && (!best || v - 0.6 > best.v)) best = { exit: 'valve', dir, v: v - 0.6 };
    }
    return best;
  }
  // その場所の危なさ：相手に撃たれそうな数・背中を見せる・味方の満タンやインク漏れの隣（巻き込まれる）
  function riskAt(G, u, x, y, faceDir) {
    let k = 0;
    for (const f of G.units) {
      if (!IW.alive(f) || f.kind !== 'minion' || f === u) continue;
      const d = Math.max(Math.abs(f.x - x), Math.abs(f.y - y));
      if (f.team !== u.team) {
        const reach = Math.max(f.parts.cannon ? IW.cannonRange(f) : 0, f.parts.hose ? IW.hoseRange(f) : 0) + (f.sit ? 0 : 2);
        if (d <= reach) { const sd = IW.sideOf({ x, y, dir: faceDir }, f); k += sd === 'behind' ? 1.4 : sd === 'back' ? 0.2 : (u.full ? 1.1 : 0.7); }
        if (d === 1) k += 1.2; // ジャンプ噴射がこわい
      } else if (d === 1) k += f.state === 'leak' ? 2.5 : f.full ? 1.2 : 0.2;
    }
    return k;
  }
  IW.planTeamMinion = function (G, u) {
    const F = G.units.filter(v => IW.alive(v) && v.kind === 'minion' && v.team !== u.team); if (!F.length) return null;
    const R = IW.reach(G, u, u.sit ? 0 : u.state === 'leak' ? 1 : MV);
    let best = null;
    for (const [k, o] of R) {
      const x = k % G.N, y = Math.floor(k / G.N);
      const s = bestShot(G, u, x, y);
      const nearest = F.reduce((a, f) => { const d = Math.max(Math.abs(f.x - x), Math.abs(f.y - y)); return !a || d < a.d ? { f, d } : a; }, null);
      const faceDir = s && s.t ? IW.dirTo({ x, y }, s.t) : s && s.exit === 'valve' ? s.dir : IW.dirTo({ x, y }, nearest.f);
      let sc = s ? 6 + s.v * 3 : -nearest.d * 0.7;
      if (!s) for (const f of F) { // 撃てないのに、相手が動いて撃てる間合いに入るのは、こわい
        const d = Math.max(Math.abs(f.x - x), Math.abs(f.y - y)), rr = Math.max(f.parts.cannon ? IW.cannonRange(f) : 0, f.parts.hose ? IW.hoseRange(f) : 0) + (f.sit ? 0 : (f.state === 'leak' ? 1 : MV));
        if (d <= rr && !f.acted) sc -= W_ENTER;
      }
      sc -= riskAt(G, u, x, y, faceDir) * 1.1;
      sc -= o.c * 0.05 + G.r() * 0.4;
      if (!best || sc > best.sc) best = { x, y, sc, s, faceDir, R };
    }
    return best;
  };
  IW.execTeamPlan = function (G, u, best, ev) {
    const F = G.units.filter(v => IW.alive(v) && v.kind === 'minion' && v.team !== u.team);
    if (best.x !== u.x || best.y !== u.y) { const P = IW.pathTo(G, best.R, best.x, best.y); IW.place(G, u, best.x, best.y); u.moved = true; ev.push({ k: 'move', id: u.id, path: P }); }
    u.dir = best.faceDir;
    const s = bestShot(G, u, u.x, u.y);
    if (!s) { ev.push({ k: 'face', id: u.id, dir: u.dir }); return; }
    if (s.exit === 'valve') { IW.fire(G, u, 'valve', { dir: s.dir }, ev); return; }
    const T = [s.t];
    if (s.exit === 'cannon') { // キャノンは左右で2人まで：もう1人ねらえるなら
      const R2 = IW.cannonRange(u), val = (f) => shotValue(G, u, f, IW.hitPreview(u, f, 'cannon').part);
      const other = F.filter(f => f !== s.t && IW.alive(f) && IW.dist(u, f) <= R2 && IW.hitPreview(u, f, 'cannon').part).sort((a, b) => val(b) - val(a))[0];
      if (other && val(other) > 1) T.push(other);
    }
    IW.fire(G, u, s.exit, T, ev);
  };
  IW.aiTeamMinion = function (G, u, ev) { const pl = IW.planTeamMinion(G, u); if (pl) IW.execTeamPlan(G, u, pl, ev); };
  // 遊ぶ人が指揮する子の、撃てる相手（画面用）：[{t, exit, hp}] と、ジャンプ噴射の向き
  IW.playerShots = function (G, u) {
    const L = [];
    for (const t of G.units) {
      if (!IW.alive(t) || t.kind !== 'minion' || t.team === u.team) continue;
      const d = IW.dist(u, t);
      for (const exit of ['cannon', 'hose']) {
        if (!u.parts[exit] || d > (exit === 'cannon' ? IW.cannonRange(u) : IW.hoseRange(u))) continue;
        const hp = IW.hitPreview(u, t, exit); if (hp.part) L.push({ t, exit, hp });
      }
    }
    const J = u.parts.valve && u.state === 'ok' ? [0, 1, 2, 3].map(dir => ({ dir, cells: IW.jumpCells(G, u, dir) })).filter(o => o.cells.some(c => { const w = IW.at(G, c.x, c.y); return w && w.kind === 'minion' && w.team !== u.team; })) : [];
    return { L, J };
  };

})(typeof window !== 'undefined' ? (window.IW = window.IW || {}) : (globalThis.IW = globalThis.IW || {}));

/* ---- src/engine/stage.js ---- */
// ---- インク戦闘員ウォーズ：ステージ（ヒーローが単騎で、インク団のアジトを奥へ進む） ----
//   面のデータ：IW.STAGES = [{ id, layer, no, title, map（文字の盤）, limit（このターンをこえたら失敗）, goals（★2・★3の目標）, talk（はじまりの会話）, win（クリアのひとこと）, opt }]
//   盤の文字：
//     .  空き          H  ヒーロー（奥を向く）
//     M  満タン（手前を向く）     m  満タンでない（手前を向く）
//     A  満タン（ヒーローの方を向く）  a  満タンでない（ヒーローの方を向く）
//     B  満タン（奥を向く＝ヒーローに背中）  b  満タンでない（奥を向く）
//     >  満タン（右を向く）     <  満タン（左を向く）
//     x  インク漏れ（爆発寸前・手前を向く）
//     K  班長（満タン・手前を向く。面の会話で話す。bossHp があれば、その回数だけ当てないとはじけない）
//     W  壁に大の字で張り付いた子（ボーナス）。動けない・跳べない・ずっと満タン。面の opt.anyBurst で、どこに当たってもはじける
//     #  柱（第3層）。通れない。弾・レーザー・流星は柱で止まり、タンクの爆風も柱のかげにはとどかない
//     T  インクタンク（物。撃つと大爆発して、まわり2マスを巻きこむ。クリアの人数には数えない）
//   pool（第5層）：盤と同じ形の文字で、インクだまり（~）。ヒーローが通ると1マスごとによごれ+1、はじけた所・タンクの爆発のまわりに新しくできる、だまりの上の戦闘員は毎ターン満タン
//   chief（第9層）：班長の K が首領。部下が残っているあいだは攻撃が効かない（guard）。部下がいなくなると覚醒（awaken、体力 awakeHp・2回動く・2ターンに1回インクストーム）
//   I（特別ステージ）＝鉄柱。となりの戦闘員をつかんで放り投げると、ホースとタンクに鉄柱が通って動けなくなる（はじけずに耐える。クリアの人数からはぬける）。goals の { k:'poled', n }＝鉄柱に n 人
//   1〜9（第8層）＝ワープ床（同じ数字の2マスがつながる）。止まると、もう一方へ飛ぶ（ヒーローも戦闘員も）。レーザーは、もう一方から同じ向きに出る。bossFast：幹部が1つの番に2回動く
//   / ＼（第7層）＝鏡。ヒーローのレーザーは鏡で直角に曲がる（通れない。戦闘員の弾・流星・爆風は止まる）。bossReflect：幹部の「はね返しの盾」
//   N・n（第6層）＝救護係（満タン・満タンでない）。となりのインク漏れの仲間を治す。exec：班長ではなく幹部。bossHeal：幹部の治しの号令（まわり何マス）
//   belt（第4層）：盤と同じ形の文字で、コンベアの向き（^ > v <）。盤の w＝作業員（満タンでない・持ち場から歩かない。撃つことはできる。コンベアには運ばれる）。opt.spawnWorker：増援も作業員。bossWorker：班長も作業員
//   opt.shootBarrel：戦闘員が、ヒーローの近くのインクタンクをねらって撃ってくる（第2層の後半）
//   目標（goals）：{ k:'turns', n }＝nターン以内にクリア・{ k:'ink', n }＝よごれn以下でクリア・{ k:'combo', n }＝1回の攻撃でn人はじけさせる・{ k:'nosp' }＝わざを使わずにクリア
//   ★1はクリア。★2・★3は goals の1つ目・2つ目（クリアしたうえで）。
//   よごれは毎面0から。負け（撤退・たおれた・ターン切れ）は、その面をやり直し。
(function (IW) {
  'use strict';
  const HERO = 'ブルーセイバー';
  IW.STAGE_LAYERS = [{ layer: 1, name: 'アジト第1層', sub: '入口と見張りの通路' }, { layer: 2, name: 'アジト第2層', sub: 'インクのタンク置き場' }, { layer: 3, name: 'アジト第3層', sub: '柱の倉庫' }, { layer: 3.5, name: 'ボーナス', sub: '固定砲台部隊の部屋', bonus: true }, { layer: 4, name: 'アジト第4層', sub: 'インク工場のコンベア' }, { layer: 5, name: 'アジト第5層', sub: '地下水路のインクだまり' }, { layer: 6, name: 'アジト第6層', sub: '救護係の医務室' }, { layer: 7, name: 'アジト第7層', sub: '鏡の回廊' }, { layer: 8, name: 'アジト第8層', sub: 'ワープの実験室' }, { layer: 8.5, name: '特別ステージ', sub: '首領の間への通路', special: true }, { layer: 9, name: 'アジト第9層', sub: '首領の間' }];
  IW.STAGES = [
    { id: '1-1', title: '入口の見張り', limit: 5,
      map: ['.........', '.........', '....M....', '....M....', '....M....', '.........', '.........', '....H....', '.........'],
      goals: [{ k: 'turns', n: 1 }, { k: 'combo', n: 3 }],
      tip: '縦に並んだ3人。一直線のレーザーは<b>貫通</b>する。ベリータンクの高さをねらおう。',
      talk: [['ink', 'ん？ だれか来た！ 見張り、集合〜！'], ['hero', 'ここがインク団のアジトか。まずは入口からだ'], ['ink', 'ヒーローだ！ みんなでスライムにしちゃおう！']],
      win: '入口、突破！ 奥へ進むぞ' },
    { id: '1-2', title: '満タンの連鎖', limit: 6,
      map: ['.........', '..MM.....', '..MM.....', '....MM...', '....MM...', '.........', '.........', '....H....', '.........'],
      goals: [{ k: 'turns', n: 2 }, { k: 'combo', n: 6 }],
      tip: '満タンの子がはじけると、隣の満タンの子も<b>連鎖</b>してはじける。くっついた塊をねらおう。',
      talk: [['ink', 'インク、たぷたぷに満タンにしたよ！'], ['ink', 'くっついてれば、こわくないもんね！'], ['hero', '……くっついてるなら、まとめていける']],
      win: 'くっついてると、連鎖しやすいんだな' },
    { id: '1-3', title: '背中を見せる子', limit: 6,
      map: ['.........', '...BBB...', '...BBB...', '.........', '.........', '.........', '.........', '....H....', '.........'],
      goals: [{ k: 'turns', n: 1 }, { k: 'combo', n: 6 }],
      tip: '背中側からは、レーザーが表のタンクに当たらない。でも<b>背中からのブレード</b>は一刀ではじける。',
      talk: [['ink', 'ねえ、ヒーロー来ないね〜'], ['ink', '奥のほうを見張ってれば大丈夫だよ〜'], ['hero', '（後ろががら空きだ……そっと近づこう）']],
      win: '背中から、そっと一刀' },
    { id: '1-4', title: '満タンじゃない子', limit: 6,
      map: ['.........', '.mMm.....', '.MmM..m..', '.mMm..M..', '......m..', '.........', '.........', '....H....', '.........'],
      goals: [{ k: 'turns', n: 2 }, { k: 'ink', n: 3 }],
      tip: '満タンでない子は、すぐにははじけず「インク漏れ」になる。インク漏れの子は、もう1発か、隣の飛沫ではじける。',
      talk: [['ink', 'さっき撃ったから、インク少なめ〜'], ['ink', 'でも少なめなら、連鎖しないもん！'], ['hero', 'まぜて並んでいるな。順番を考えよう']],
      win: '満タンの子を先にねらうのがコツか' },
    { id: '1-5', title: '横向きの列', limit: 6,
      map: ['.........', '.>>>>....', '.........', '....<<<<.', '.........', '.........', '.........', '.........', 'H........'],
      goals: [{ k: 'turns', n: 2 }, { k: 'combo', n: 4 }],
      tip: '横を向いた列は、<b>同じ列の正面</b>に回りこむと、一直線で貫通できる。',
      talk: [['ink', '左右の通路は、わたしたちが守るよ！'], ['ink', '右よーし！ 左よーし！'], ['hero', '列の正面に回りこめば、まとめてねらえる']],
      win: '回りこむのも、立派な作戦だ' },
    { id: '1-6', title: '爆発寸前', limit: 7,
      map: ['...........', '.MM.....MM.', '.Mx.....xM.', '...........', '....MMM....', '....MxM....', '...........', '...........', '...........', '.....H.....', '...........'],
      goals: [{ k: 'turns', n: 2 }, { k: 'ink', n: 4 }],
      tip: 'インク漏れ（爆発寸前）の子は、2ターンでひとりでにはじける。隣にいると、インクを浴びるので注意。',
      talk: [['ink', 'うう、タンクからインクがもれてる〜'], ['ink', 'ヒーローのそばで、ぱーんってしちゃおうかな！'], ['hero', 'うかつに近づくと、インクまみれだな']],
      win: 'ふう、浴びずにすんだ' },
    { id: '1-7', title: 'まっすぐな通路', limit: 7,
      map: ['...........', '.....m.....', '.....m.....', '..m..m..m..', '..m..m..m..', '.....m.....', '.....m.....', '...........', '...........', '.....H.....', '...........'],
      goals: [{ k: 'turns', n: 3 }, { k: 'combo', n: 6 }],
      tip: 'わざの<b>ハレー彗星</b>は、一直線10マスの子を、満タンでなくてもまとめてはじけさせる。使うと3ターン休み。',
      talk: [['ink', '細い通路は、一列に並んで通るんだよ〜'], ['ink', '前の子に、ぴったりついていこうね！'], ['hero', '一列なら、あのわざの出番だ']],
      win: 'ハレー彗星、決まった！' },
    { id: '1-8', title: 'かこまれた！', limit: 8,
      map: ['...........', '..A.....A..', '...........', '...........', '....aaa....', '....aHa....', '....aaa....', '...........', '...........', '..A.....A..', '...........'],
      goals: [{ k: 'turns', n: 3 }, { k: 'ink', n: 10 }],
      tip: 'まわりをかこまれたら、わざの<b>薙ぎ払い</b>。隣の8マスの子を、まとめてはじけさせる（はじけた飛沫を少し浴びる）。',
      talk: [['ink', 'つーかまえた！'], ['ink', 'もう逃げられないよ、ヒーロー！'], ['hero', '近くに集まってくれたのは、むしろ好都合だ']],
      win: '薙ぎ払いで、ひと息に！' },
    { id: '1-9', title: '増援の通路', limit: 9, opt: { reinforce: true, waves: 2 },
      map: ['...........', '...........', '..MM...MM..', '..MM...MM..', '...........', '.....m.....', '...........', '...........', '...........', '.....H.....', '...........'],
      goals: [{ k: 'turns', n: 4 }, { k: 'ink', n: 8 }],
      tip: 'この面は、はじめの2ターン、戦闘員の番の終わりに<b>四隅から増援</b>が来る。来た子も全員はじけさせればクリア。',
      talk: [['ink', '本部〜！ 入口にヒーローが来てまーす！'], ['ink', '増援、すぐ行くって！'], ['hero', '集まってくる前に、数を減らさないと']],
      win: '増援も、まとめてお帰りいただいた' },
    { id: '1-10', title: '第1層の班長', limit: 12, boss: 'アオイ班長',
      map: ['.............', '.....mKm.....', '....MMMMM....', '.............', '.B.........B.', '.BB.......BB.', '.............', '...>.....<...', '......x......', '...>.....<...', '.............', '......H......', '.............'],
      goals: [{ k: 'turns', n: 4 }, { k: 'ink', n: 15 }],
      tip: '第1層のしめくくり。班長のまわりは満タンの子が守っている。いままでのコツを全部使おう。',
      talk: [['boss', 'ここまで来るなんて、やるじゃない、ヒーロー'], ['boss', 'わたしは第1層の班長、アオイ。この先へは通さないよ！'], ['hero', '班長か。第1層は、ここで終わりにしよう'], ['ink', '班長〜、がんばって〜！']],
      win: '第1層、制圧！ この下に、まだ続いている……' },
    // ===== 第2層：インクのタンク置き場（仕かけ：インクタンク T） =====
    { id: '2-1', title: 'タンク置き場', limit: 4,
      map: ['.........', '.........', '...mmm...', '...mTm...', '...mmm...', '.........', '.........', '....H....', '.........'],
      goals: [{ k: 'turns', n: 1 }, { k: 'combo', n: 8 }],
      tip: 'まん中の<b>インクタンク</b>を撃つと大爆発！ まわり1マスの子は、満タンでなくても<b>即はじける</b>。',
      talk: [['ink', 'ここは、スライムインクのタンク置き場だよ〜'], ['ink', 'みんなでタンクを守るんだ！ ぴったりくっついて！'], ['hero', '……そのタンク、撃ったらどうなるんだろう']],
      win: 'タンク、すごい爆発だ……！' },
    { id: '2-2', title: '近づきすぎ注意', limit: 4,
      map: ['.........', '.........', '..M.M.M..', '...MMM...', '....T....', '....H....', '.........', '.........', '.........'],
      goals: [{ k: 'ink', n: 0 }, { k: 'turns', n: 1 }],
      tip: 'タンクの爆発は、ヒーローにもかかる（1マスで<b>よごれ6</b>、2マスで<b>よごれ3</b>）。先に<b>3マス以上はなれて</b>から撃とう。',
      talk: [['hero', 'わっ、目の前にタンクが……'], ['ink', 'ヒーロー、そこで撃ったら、自分もインクまみれだよ〜'], ['ink', 'ふふん、撃てないでしょ！']],
      win: 'はなれて撃てば、こわくない' },
    { id: '2-3', title: '誘爆の列', limit: 5,
      map: ['...........', '.m.......m.', '.mT.T.T.Tm.', '.m.......m.', '...M.M.M...', '...........', '...........', '...........', '...........', '.....H.....', '...........'],
      goals: [{ k: 'turns', n: 1 }, { k: 'combo', n: 9 }],
      tip: 'タンクの爆発は、<b>2マス以内のほかのタンク</b>にも燃えうつる（誘爆）。ならんだタンクは、1つ撃てば全部いける。',
      talk: [['ink', 'タンク、ずらーっと並べたよ！'], ['ink', 'こんなにあれば、インクたっぷり！'], ['hero', '……1つでも爆発したら、となりも危ないんじゃないか？']],
      win: '誘爆で、まとめて吹きとんだ' },
    { id: '2-4', title: '2マス先の子', limit: 6,
      map: ['...........', '...........', '...m.m.m...', '...........', '...m.T.m...', '...........', '...m.m.m...', '...........', '...........', '.....H.....', '...........'],
      goals: [{ k: 'turns', n: 2 }, { k: 'ink', n: 0 }],
      tip: '2マス先の子には、飛沫がかかるだけ。<b>満タンでない子はインク漏れ</b>で止まる。止まった子は、もう1発ではじける。',
      talk: [['ink', 'タンクのそばは、ちょっとはなれて立つんだよ〜'], ['ink', '2マスはなれてれば、大丈夫だもんね！'], ['hero', '大丈夫……かな？']],
      win: '飛沫でゆらして、とどめの一発' },
    { id: '2-5', title: '満タンの塊とタンク', limit: 5,
      map: ['...........', '.MM.....MM.', '.MM.....MM.', '...MM.MM...', '...M.T.M...', '...MM.MM...', '...........', '...........', '...........', '.....H.....', '...........'],
      goals: [{ k: 'turns', n: 1 }, { k: 'combo', n: 16 }],
      tip: 'タンクの爆発で満タンの子がはじけると、そこから<b>連鎖</b>がつづく。2マスより遠くの子まで、とどくことも。',
      talk: [['ink', 'インク、満タンにしたよ〜！ たぷたぷ！'], ['ink', 'タンクのまわりは、満タン組でかためるの！'], ['hero', '満タンと、タンク。いちばん危ない組み合わせだ']],
      win: '爆発と連鎖で、ひと息に！' },
    { id: '2-6', title: 'タンクをねらってくる', limit: 7, opt: { shootBarrel: true },
      map: ['...........', '..m.....m..', '...........', '....m.m....', '...........', '..T.....T..', '...........', '.....H.....', '...T...T...', '...........', '...........'],
      goals: [{ k: 'ink', n: 0 }, { k: 'turns', n: 3 }],
      tip: 'この先の戦闘員は、ヒーローの<b>2マス以内のタンク</b>を撃ってくる。タンクのそばで番を終えないように。',
      talk: [['ink', 'いいこと考えた！ ヒーローのそばのタンクを撃っちゃえばいいんだ！'], ['ink', 'どかーんで、インクまみれ〜！'], ['hero', '……タンクのそばに立たないようにしないと']],
      win: 'タンクのそばには、長居しない' },
    { id: '2-7', title: 'タンクの通路', limit: 7,
      map: ['...........', '.m...m...m.', '.m...m...m.', '.m...T...m.', '.m...m...m.', '..T..m..T..', '.....m.....', '.....m.....', '...........', '.....H.....', '...........'],
      goals: [{ k: 'turns', n: 3 }, { k: 'combo', n: 6 }],
      tip: 'わざの<b>ハレー彗星</b>は、通り道のタンクも爆発させる。一列の子とタンクを、まとめてねらおう。',
      talk: [['ink', '通路の見張りは、一列に並んでね〜'], ['ink', 'タンクも、通路のまん中に置いとこう！'], ['hero', '一列に、タンクまで……あのわざなら']],
      win: '流星とタンクで、通路が空いた' },
    { id: '2-8', title: 'タンクにかこまれて', limit: 8, opt: { shootBarrel: true },
      map: ['...........', '.A.......A.', '..T.....T..', '...........', '....aaa....', '....aHa....', '....aaa....', '...........', '..T.....T..', '.A.......A.', '...........'],
      goals: [{ k: 'turns', n: 3 }, { k: 'ink', n: 14 }],
      tip: 'かこまれたら<b>薙ぎ払い</b>。そのあと、すみのタンクと見張りを片づけよう。タンクのそばで番を終えないように。',
      talk: [['ink', 'つーかまえた！ まわりは、タンクだらけだよ！'], ['ink', '逃げようとしたら、タンクをどかーんだからね！'], ['hero', 'まずは、まわりから片づける']],
      win: 'タンクの迷路を、ぬけた！' },
    { id: '2-9', title: '増援とタンク', limit: 9, opt: { reinforce: true, waves: 2 },
      map: ['...........', '.T.......T.', '...........', '...m...m...', '...........', '...m...m...', '...........', '...........', '...........', '.T...H...T.', '...........'],
      goals: [{ k: 'turns', n: 4 }, { k: 'ink', n: 15 }],
      tip: '増援は<b>四隅</b>から来る。すみのタンクのそばに来たところを、ねらってみよう。',
      talk: [['ink', '本部〜！ タンク置き場にヒーローが〜！'], ['ink', '増援、すみっこから来るって！'], ['hero', 'すみっこには……タンクがあるな']],
      win: '増援も、タンクといっしょにお帰りいただいた' },
    { id: '2-10', title: '第2層の班長', limit: 12, boss: 'シアン班長', bossHp: 5, opt: { shootBarrel: true },
      map: ['.............', '....mMKMm....', '.....m.m.....', '...T.....T...', '.BB.......BB.', '.BB.......BB.', '.............', '..T...x...T..', '.............', '...>.....<...', '...>.....<...', '......H......', '.............'],
      goals: [{ k: 'turns', n: 3 }, { k: 'ink', n: 6 }],
      tip: '班長は<b>5回当てないと</b>はじけない（タンクの爆発や飛沫でも1回）。タンクを使えば、いっぺんに何回ぶんも当てられる。',
      talk: [['boss', 'タンク置き場へようこそ、ヒーロー'], ['boss', 'わたしは第2層の班長、シアン。ちょっとやそっとじゃ、はじけないよ！'], ['hero', 'それなら、何回でも当てるだけだ'], ['ink', '班長〜、タンクも使って〜！']],
      win: '第2層、制圧！ まだ下がある……' },
    // ===== 第3層：柱の倉庫（仕かけ：柱 #） =====
    { id: '3-1', title: '柱のかげ', limit: 5,
      map: ['.........', '..m...m..', '..#...#..', '.........', '....M....', '....#....', '.........', '....H....', '.........'],
      goals: [{ k: 'turns', n: 2 }, { k: 'ink', n: 6 }],
      tip: '<b>柱</b>の向こうには、レーザーがとどかない（戦闘員の弾もとどかない）。横に回りこんで、ねらえる場所をさがそう。',
      talk: [['ink', 'ここは倉庫だよ〜 柱がいっぱい！'], ['ink', '柱のうしろにかくれてれば、撃たれないもんね！'], ['hero', '……なら、回りこめばいい']],
      win: '柱があっても、回りこめばいい' },
    { id: '3-2', title: '柱にかくれる', limit: 6,
      map: ['...........', '.a...a...a.', '...........', '...a...a...', '...........', '...........', '..#.....#..', '...........', '.....H.....', '...........', '...........'],
      goals: [{ k: 'ink', n: 8 }, { k: 'turns', n: 3 }],
      tip: '柱のかげで番を終えると、戦闘員の弾がとどきにくい。撃ったら、<b>柱のうしろへもどる</b>のがコツ。',
      talk: [['ink', 'みんなで、ヒーローをねらうよ〜！'], ['ink', 'どこにいても、まる見えだもん！'], ['hero', 'あの柱を、盾にさせてもらおう']],
      win: '柱は、ヒーローの盾にもなる' },
    { id: '3-3', title: '回りこんで一直線', limit: 5,
      map: ['...........', '...........', '...........', '..MMMMM....', '..#####....', '...........', '...........', '.H.........', '...........', '...........', '...........'],
      goals: [{ k: 'turns', n: 1 }, { k: 'combo', n: 5 }],
      tip: '正面は柱の壁。でも<b>列のはしに回りこめば</b>、一直線のレーザーで全員をつらぬける。',
      talk: [['ink', '柱の壁のうしろに、ずらっと整列！'], ['ink', 'これなら正面からは、ぜったい当たらないよ！'], ['hero', '正面からは、ね']],
      win: '列のはしから、まとめてつらぬいた' },
    { id: '3-4', title: '爆風と柱', limit: 6,
      map: ['...........', '..m.m.m....', '...#T#.....', '..m.m.m....', '...........', '.......m.m.', '.......#...', '...........', '.....H.....', '...........', '...........'],
      goals: [{ k: 'turns', n: 3 }, { k: 'ink', n: 6 }],
      tip: 'タンクの爆風も、<b>柱のかげにはとどかない</b>。かげにいる子は、別の向きからねらおう。',
      talk: [['ink', 'タンクのとなりに、柱を立てといたよ！'], ['ink', '爆発しても、柱のうしろなら平気〜'], ['hero', '全員は、巻きこめないか……']],
      win: '爆風のとどかない所も、考えて撃つ' },
    { id: '3-5', title: '倉庫の迷路', limit: 7,
      map: ['...........', '.###.#.###.', '.#m..#..m#.', '.#.###.#.#.', '...m...m...', '.#.#.#.#.#.', '.#m.....m#.', '.###.#.###.', '...........', '.....H.....', '...........'],
      goals: [{ k: 'turns', n: 3 }, { k: 'ink', n: 15 }],
      tip: '迷路のような倉庫。ハレー彗星も柱で止まる。<b>通路の一直線</b>をさがして、ねらいを通そう。',
      talk: [['ink', '倉庫の迷路へようこそ〜！'], ['ink', 'どこにいるか、わかるかな？'], ['hero', '通路を一つずつ、たしかめていこう']],
      win: '迷路の見張り、全員はじけた' },
    { id: '3-6', title: '柱の通路と増援', limit: 8, opt: { reinforce: true, waves: 2 },
      map: ['...........', '...#...#...', '...#.m.#...', '...#.m.#...', '...........', '.#.......#.', '.#..m.m..#.', '...........', '...#...#...', '.....H.....', '...........'],
      goals: [{ k: 'turns', n: 4 }, { k: 'ink', n: 10 }],
      tip: '四隅から増援が来る。柱の通路は、来る子の通り道にもなる。<b>通路のまっすぐ先</b>で待ちかまえよう。',
      talk: [['ink', '本部〜！ 倉庫にもヒーローが来たよ〜！'], ['ink', '増援、すみっこから来るって！'], ['hero', '通路を通ってくるなら、一直線だ']],
      win: '通路で、まとめてお出むかえ' },
    { id: '3-7', title: 'タンクと柱', limit: 7, opt: { shootBarrel: true },
      map: ['...........', '..a.....a..', '...........', '....a.a....', '...........', '..T.#.#.T..', '...........', '....T.T....', '.....H.....', '...........', '...........'],
      goals: [{ k: 'ink', n: 0 }, { k: 'turns', n: 3 }],
      tip: '戦闘員はヒーローのそばのタンクを撃ってくる。でも<b>柱のかげなら爆風はとどかない</b>。',
      talk: [['ink', 'ヒーローの足もとに、タンクを置いといたよ〜'], ['ink', 'みんなで撃てば、どかーん！'], ['hero', 'あの柱のうしろまで、急ごう']],
      win: '柱のかげは、爆風のかくれ場所' },
    { id: '3-8', title: 'かこまれて、柱', limit: 8,
      map: ['...........', '..#.....#..', '...A...A...', '...........', '....aaa....', '..#.aHa.#..', '....aaa....', '...........', '...A...A...', '..#.....#..', '...........'],
      goals: [{ k: 'turns', n: 3 }, { k: 'ink', n: 12 }],
      tip: 'かこまれたら薙ぎ払い。のこりの4人は、<b>柱で弾をさえぎりながら</b>一人ずつ。',
      talk: [['ink', 'つーかまえた！ 今度は柱で、逃げ道もふさいだよ！'], ['ink', 'まわりから、いっせいに撃っちゃえ〜！'], ['hero', '近い子から、まとめて片づける']],
      win: 'かこみも柱も、のりこえた' },
    { id: '3-9', title: '背中の列', limit: 8,
      map: ['...........', '.BBB...BBB.', '.###...###.', '...........', '.....m.....', '...#...#...', '...........', '...........', '.....H.....', '...........', '...........'],
      goals: [{ k: 'turns', n: 3 }, { k: 'ink', n: 20 }],
      tip: '柱の向こうで、奥を向いている列。<b>柱のすき間から回りこんで</b>、横からブレードか、列のはしからレーザー。',
      talk: [['ink', '奥の見張りは、まかせて〜'], ['ink', 'うしろは柱があるから、安心だよね！'], ['hero', 'すき間から、そっと回りこもう']],
      win: '列のはしから、静かに片づけた' },
    { id: '3-10', title: '第3層の班長', limit: 12, boss: 'クロ班長', bossHp: 6, opt: { shootBarrel: true },
      map: ['.............', '....#.K.#....', '....#mMm#....', '....##.##....', '..m.......m..', '..#..T.T..#..', '.............', '.M#.......#M.', '.............', '...a..#..a...', '.............', '......H......', '.............'],
      goals: [{ k: 'turns', n: 4 }, { k: 'ink', n: 18 }],
      tip: '班長は柱の砦の中。<b>6回当てないと</b>はじけない。砦の入口のまっすぐ先からなら、レーザーがとどく。',
      talk: [['boss', 'よく来たね、ヒーロー。ここは柱の砦だよ'], ['boss', 'わたしは第3層の班長、クロ。この砦は、だれにも破れない！'], ['hero', '入口があるなら、そこからねらうだけだ'], ['ink', '班長〜、かくれてて〜！']],
      win: '第3層、制圧！ アジトは、まだ深い……' },
    // ===== ボーナス：固定砲台部隊の部屋（壁一面に、大の字で張り付いた25人。だれか1人に一撃で、大連鎖） =====
    { id: 'B-1', layer: 3.5, bonus: true, title: '固定砲台部隊', limit: 3, opt: { anyBurst: true },
      map: ['...........', '...WWWWW...', '...WWWWW...', '...WWWWW...', '...WWWWW...', '...WWWWW...', '...........', '...........', '...........', '.....H.....', '...........'],
      goals: [{ k: 'combo', n: 25 }, { k: 'ink', n: 0 }],
      tip: '壁にはりついた25人は、みんなタンクがパンパン。<b>だれでもいいので一撃</b>当てれば……？',
      talk: [['ink', 'わたしたち、固定砲台部隊！'], ['ink', 'わたしたちの一斉噴射で、今度こそたおすよ！'], ['hero', '（……壁にはりついて、動けないのか？ 冷静に考えたら、ただの的だな）'], ['ink', 'でも、ずっと待ちすぎて、タンクがパンパン……あ！？'], ['ink', 'これって、やばいかも！？ みんな、今のうちに撃って〜！']],
      volley: [['ink', 'あれ？ とどかないー！'], ['ink', '壁にはりついてるから、前に出られないんだった〜！'], ['hero', '……それなら、こっちの番だ']],
      win: '……全員、見事にはじけたな' },
    // ===== 第4層：インク工場のコンベア（仕かけ：ベルトコンベア。戦闘員は作業中で歩かない） =====
    { id: '4-1', title: 'コンベアの作業員', limit: 5,
      map:  ['...........', '...........', '.w.w.T.w.w.', '...........', '...........', '..a.....a..', '...........', '...........', '...........', '.....H.....', '...........'],
      belt: ['...........', '...........', '>>>>>.<<<<<', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'combo', n: 4 }, { k: 'ink', n: 0 }],
      tip: '光る矢印の床は<b>ベルトコンベア</b>。ターンの終わりに、上にいる子を1マス運ぶ。作業員がタンクのそばに集まるまで、<b>待つのも作戦</b>。',
      talk: [['ink', 'ここはインク工場！ わたしたち、作業中だよ〜'], ['ink', 'コンベアに乗ってれば、勝手に運んでくれるの！'], ['hero', '……あのタンクのほうへ、運ばれていくな']],
      win: '待てば、コンベアが集めてくれる' },
    { id: '4-2', title: '運ばれてくるタンク', limit: 6,
      map:  ['........ww.', '....T...ww.', '........ww.', '...........', '.a.........', '.........a.', '...........', '...........', '...........', '.....H.....', '...........'],
      belt: ['...........', '>>>>>>>....', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'combo', n: 8 }, { k: 'turns', n: 4 }],
      tip: 'タンクがコンベアで、作業員の群れへ運ばれていく。<b>となりに着いたところ</b>を撃てば、まとめていける。',
      talk: [['ink', 'インクタンク、出荷しまーす！'], ['ink', 'こっちに運ばれてきたら、受け取ってね〜'], ['hero', '……着いたところを、撃てばいいな']],
      win: 'とどいた荷物は、大爆発' },
    { id: '4-3', title: 'ヒーローも運ばれる', limit: 6,
      map:  ['...........', '...w...w...', '.....T.....', '..w.....w..', '...........', '.a.........', '...........', '...........', '.....H.....', '...........', '...........'],
      belt: ['...........', '...........', '...........', '.....^.....', '.....^.....', '.....^.....', '.....^.....', '.....^.....', '.....^.....', '.....^.....', '...........'],
      goals: [{ k: 'ink', n: 0 }, { k: 'turns', n: 3 }],
      tip: 'コンベアは<b>ヒーローも運ぶ</b>。乗ったまま番を終えると、作業員とタンクのほうへ運ばれてしまう。<b>おりてから</b>撃とう。',
      talk: [['hero', '足もとが……動いてる！？'], ['ink', 'いらっしゃいませ〜！ ヒーローも、こっちへ運ばれてくるよ！'], ['ink', 'タンクのとなりまで、ごあんな〜い！']],
      win: 'コンベアからおりて、落ちついて撃つ' },
    { id: '4-4', title: '一列にそろう', limit: 6,
      map:  ['...........', '..w.....w..', '......w....', '....w......', '...........', '.a.......a.', '.....a.....', '...........', '...........', '.....H.....', '...........'],
      belt: ['..v.v.v.v..', '..v.v.v.v..', '..v.v.v.v..', '..v.v.v.v..', '...........', '...........', '...........', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'combo', n: 4 }, { k: 'turns', n: 4 }],
      tip: 'コンベアの終わりで、作業員が<b>横一列</b>にそろう。そろったら、<b>列のはし</b>から一直線のレーザー。',
      talk: [['ink', 'コンベアの終わりで、整列〜！'], ['ink', 'きれいに並ぶと、気持ちいいよね！'], ['hero', '並んでくれるなら、ありがたい']],
      win: 'そろった列を、まとめてつらぬいた' },
    { id: '4-5', title: 'ぐるぐるコンベア', limit: 7,
      map:  ['...........', '...w..w....', '....T......', '..w.....w..', '......T....', '.....w.....', '...........', '.aa.....aa.', '...........', '.....H.....', '...........'],
      belt: ['...........', '..>>>>>>v..', '..^.....v..', '..^.....v..', '..^.....v..', '..^<<<<<<..', '...........', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'combo', n: 3 }, { k: 'turns', n: 3 }],
      tip: 'まわりつづけるコンベア。作業員が<b>タンクのそばを通るとき</b>が、ねらいどき。',
      talk: [['ink', 'ぐるぐる〜 ぐるぐる〜'], ['ink', 'まわってると、ねらいにくいでしょ！'], ['hero', 'タンクのそばに来たときが、チャンスだ']],
      win: 'まわる工場も、止めてみせた' },
    { id: '4-6', title: '柱のすき間', limit: 8,
      map:  ['...........', '.w.w.w.w...', '.#.#.#.#.#.', '...........', '..a.....a..', '...........', '...........', '...........', '...........', '.....H.....', '...........'],
      belt: ['...........', '>>>>>>>>>>.', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'turns', n: 3 }, { k: 'combo', n: 4 }],
      tip: '作業員は柱のうしろ。でもコンベアで運ばれて、<b>すき間に来たとき</b>はねらえる。列のはしに回りこむ手もある。',
      talk: [['ink', '柱のうしろで、安全に作業〜'], ['ink', 'ヒーローからは、見えないもんね！'], ['hero', '……ずっと柱のうしろに、いられるかな']],
      win: 'すき間を通る瞬間を、のがさない' },
    { id: '4-7', title: '近づくタンク', limit: 7, opt: { shootBarrel: true },
      map:  ['...........', '..a.....a..', '...........', '....a.a....', '...........', '.T.......T.', '...........', '...........', '.....H.....', '...........', '...........'],
      belt: ['...........', '...........', '...........', '...........', '...........', '.>>>>.<<<<.', '...........', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'ink', n: 0 }, { k: 'turns', n: 3 }],
      tip: 'タンクがコンベアでまん中へ運ばれてくる。作業員は、ヒーローのそばのタンクを撃つ。<b>タンクから2マス以上はなれて</b>。',
      talk: [['ink', 'タンク、まん中へ出荷〜！'], ['ink', 'ヒーローのそばに来たら、どかーんだよ！'], ['hero', 'タンクの通り道からは、はなれておこう']],
      win: '近づくタンクから、うまくにげた' },
    { id: '4-8', title: '増援のコンベア', limit: 8, opt: { reinforce: true, waves: 2, spawnWorker: true },
      map:  ['.....T.....', '...........', '...........', '..m.....m..', '.....m.....', '.M.......M.', '...........', '...........', '.....H.....', '...........', '...........'],
      belt: ['>>>>>.<<<<<', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'turns', n: 4 }, { k: 'ink', n: 12 }],
      tip: '奥のすみから来た増援は、コンベアで<b>まん中のタンク</b>へ運ばれる。集まったところを、まとめて。',
      talk: [['ink', '本部〜！ 工場にヒーローが〜！'], ['ink', '増援、コンベアで送るね〜！'], ['hero', 'コンベアの先には……タンクか']],
      win: '送られてきた増援も、まとめて' },
    { id: '4-9', title: 'タンクの行列', limit: 7,
      map:  ['...........', '...........', '.........ww', 'TwTwTw...ww', '.........ww', '...........', '.a.......a.', '...........', '...........', '.....H.....', '...........'],
      belt: ['...........', '...........', '...........', '>>>>>>>>...', '...........', '...........', '...........', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'combo', n: 9 }, { k: 'turns', n: 5 }],
      tip: 'タンクと作業員の行列が、奥の群れへ運ばれていく。<b>行列がつまって、群れにくっついたとき</b>が、いちばんの見せ場。',
      talk: [['ink', 'タンクと作業員、まとめて出荷〜！'], ['ink', 'むこうの倉庫で、みんなで待ってるよ〜'], ['hero', 'ぜんぶ集まってから……一発で']],
      win: '行列ごと、ひと息に！' },
    { id: '4-10', title: '第4層の班長', limit: 12, boss: 'モエギ班長', bossHp: 6, bossWorker: true, opt: { shootBarrel: true },
      map:  ['.............', '......K......', '...w.....w...', '.....T.T.....', '.a.w.....w.a.', '......w......', '.............', '..M.......M..', '.............', '....a...a....', '.............', '......H......', '.............'],
      belt: ['.............', '...>>>>>>v...', '...^.....v...', '...^.....v...', '...^.....v...', '...^<<<<<<...', '.............', '.............', '.............', '.............', '.............', '.............', '.............'],
      goals: [{ k: 'turns', n: 4 }, { k: 'ink', n: 10 }],
      tip: '班長はコンベアに乗って、ぐるぐるまわっている。<b>6回当てないと</b>はじけない。<b>タンクのそばを通るとき</b>に爆発させれば、まわりの作業員ごと。',
      talk: [['boss', 'インク工場へようこそ、ヒーロー！'], ['boss', 'わたしは第4層の班長、モエギ。工場のラインは、止まらないよ！'], ['hero', 'それなら、ラインごと止めてみせる'], ['ink', '班長〜、まわりながら、がんばって〜！']],
      win: '第4層、制圧！ アジトの奥へ……' },
    // ===== 第5層：地下水路のインクだまり（仕かけ：インクだまり ~。ヒーローが通るとよごれ+1・はじけた所にできる・上の戦闘員は毎ターン満タン） =====
    { id: '5-1', title: 'インクだまり', limit: 6,
      map:  ['...........', '..a.....a..', '...........', '....a.a....', '...........', '...........', '...........', '...........', '...........', '.....H.....', '...........'],
      pool: ['...........', '...........', '...........', '...........', '...........', '~~~~~.~~~~~', '~~~~~.~~~~~', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'ink', n: 0 }, { k: 'turns', n: 3 }],
      tip: '床の紫の水たまりは<b>インクだまり</b>。ヒーローが通ると<b>1マスごとによごれ+1</b>。むりに近づかず、ここからねらおう。',
      talk: [['ink', 'ここは地下水路！ インクのだまりが、いっぱいだよ〜'], ['ink', 'ヒーローが入ったら、インクまみれだね！'], ['hero', '……足もとに気をつけないと']],
      win: 'だまりには、足をふみいれずにすんだ' },
    { id: '5-2', title: 'はじけた後のだまり', limit: 6,
      map:  ['.....a.....', '.a.......a.', '...........', '...........', '...........', '....MM.....', '....MM.....', '...........', '...........', '.....H.....', '...........'],
      pool: ['...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'ink', n: 0 }, { k: 'turns', n: 3 }],
      tip: '戦闘員がはじけると、その場所に<b>新しいインクだまり</b>ができる。目の前の塊をはじけさせると、道がふさがるかも。',
      talk: [['ink', 'はじけても、わたしたちのインクは残るんだよ〜'], ['ink', 'ヒーローの通り道、インクでふさいじゃえ！'], ['hero', 'はじけさせる場所も、考えないとな']],
      win: 'はじけさせる場所で、道が変わる' },
    { id: '5-3', title: 'だまりで満タン', limit: 6,
      map:  ['...........', '..w.w.w.w..', '...w.w.w...', '..w.w.w.w..', '...........', '...........', '...........', '...........', '...........', '.....H.....', '...........'],
      pool: ['...........', '.~~~~~~~~~.', '.~~~~~~~~~.', '.~~~~~~~~~.', '...........', '...........', '...........', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'combo', n: 11 }, { k: 'turns', n: 3 }],
      tip: 'インクだまりの上の戦闘員は、<b>毎ターン満タン</b>になる。ななめにくっついた満タンの子は……<b>1ターン待って</b>から、ねらってみよう。',
      talk: [['ink', 'だまりにつかってると、インクがどんどんたまる〜'], ['ink', 'みんな満タンで、パワーアップだよ！'], ['hero', '満タンで、ななめにくっついて……か']],
      win: 'だまりの満タンは、連鎖のもと' },
    { id: '5-4', title: '沼を渡る子', limit: 7,
      map:  ['...........', '.a...a...a.', '...........', '...a...a...', '...........', '...........', '...........', '...........', '...........', '.....H.....', '...........'],
      pool: ['...........', '...........', '...........', '...........', '~~~~~~~~~~~', '~~~~~~~~~~~', '~~~~~~~~~~~', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'combo', n: 3 }, { k: 'ink', n: 6 }],
      tip: '戦闘員は沼の中を歩いてくる。<b>沼の中で番を終えた子は満タン</b>。くっついたところを、まとめて。',
      talk: [['ink', '沼なんて、へっちゃら〜！'], ['ink', 'ちゃぷちゃぷ、インクがたまっていく〜'], ['hero', '沼の中で、満タンになっているな……']],
      win: '沼の満タン組を、まとめて' },
    { id: '5-5', title: '沼とタンク', limit: 7,
      map:  ['...........', '..m.....m..', '.m.T...T.m.', '..m.....m..', '...........', '.....a.....', '...........', '...........', '...........', '.....H.....', '...........'],
      pool: ['...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'combo', n: 4 }, { k: 'ink', n: 4 }],
      tip: 'タンクの爆発は、まわりに<b>インクだまり</b>を作る。だまりに残った子は満タンになって、次の一発で連鎖しやすい。',
      talk: [['ink', 'タンクのまわりで、休けい中〜'], ['ink', 'ばくはつしても、インクがまた使えるもんね！'], ['hero', '一度で決めるか、二度に分けるか']],
      win: '爆発のあとのだまりまで、使いこなした' },
    { id: '5-6', title: '柱と沼', limit: 7,
      map:  ['...........', '..a.....a..', '...........', '.#.#.#.#.#.', '...........', '...a...a...', '...........', '...........', '...........', '.....H.....', '...........'],
      pool: ['...........', '...........', '...........', '...........', '...........', '...........', '~~~~.~.~~~~', '~~~~.~.~~~~', '...........', '...........', '...........'],
      goals: [{ k: 'ink', n: 2 }, { k: 'turns', n: 3 }],
      tip: '柱のかげの子をねらうには、動く道をえらぶこと。<b>だまりのすき間</b>を通れば、よごれない。',
      talk: [['ink', '柱と沼で、守りはかんぺき！'], ['ink', 'ヒーロー、どっちから来るの〜？'], ['hero', 'すき間の道を、さがそう']],
      win: 'すき間の道を、うまく通れた' },
    { id: '5-7', title: 'かこまれて、沼', limit: 7,
      map:  ['...........', '..A.....A..', '...........', '...........', '....aaa....', '....aHa....', '....aaa....', '...........', '...........', '..A.....A..', '...........'],
      pool: ['...........', '...........', '...~~~~~...', '...~...~...', '...~...~...', '...~...~...', '...~...~...', '...~...~...', '...~~~~~...', '...........', '...........'],
      goals: [{ k: 'turns', n: 3 }, { k: 'ink', n: 14 }],
      tip: 'まわりはかこまれ、その外は沼。薙ぎ払いのあとは、<b>はじけた所もだまり</b>になる。動かずに撃てる相手から。',
      talk: [['ink', 'つーかまえた！ まわりは沼だよ〜！'], ['ink', 'にげようとしたら、インクまみれだね！'], ['hero', '動かずに、片づけられるか']],
      win: '沼のかこみも、ぬけた' },
    { id: '5-8', title: '沼の増援', limit: 8, opt: { reinforce: true, waves: 2 },
      map:  ['...........', '...........', '...m...m...', '...........', '.....m.....', '...........', '...........', '...........', '.....H.....', '...........', '...........'],
      pool: ['~~~.....~~~', '~~.......~~', '~.........~', '...........', '...........', '...........', '...........', '...........', '~.........~', '~~.......~~', '~~~.....~~~'],
      goals: [{ k: 'turns', n: 4 }, { k: 'ink', n: 12 }],
      tip: '増援は四隅の沼から来る。<b>沼の中で番を終えた増援は満タン</b>。かたまったところをねらおう。',
      talk: [['ink', '本部〜！ 地下水路にヒーローが〜！'], ['ink', '増援、沼をこえて行くよ〜！'], ['hero', '沼から来るなら、満タンだな']],
      win: '沼からの増援も、まとめて' },
    { id: '5-9', title: '大きな沼', limit: 7,
      map:  ['...........', '.w.w.w.w.w.', '..w.w.w.w..', '.w.w.w.w.w.', '...........', '..a.....a..', '...........', '...........', '...........', '.....H.....', '...........'],
      pool: ['~~~~~~~~~~~', '~~~~~~~~~~~', '~~~~~~~~~~~', '~~~~~~~~~~~', '...........', '...........', '...........', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'combo', n: 14 }, { k: 'ink', n: 8 }],
      tip: '大きな沼につかった作業員たち。<b>満タンになるまで待って</b>から、だれか一人に一撃。その前に、近づく警備係を。',
      talk: [['ink', '沼のお風呂、気持ちいい〜'], ['ink', 'インクがたまって、ぽかぽか〜'], ['hero', '……満タンになるまで、待つか']],
      win: '沼ぜんぶを、ひと息に！' },
    { id: '5-10', title: '第5層の班長', limit: 12, boss: 'セピア班長', bossHp: 7, opt: { shootBarrel: true },
      map:  ['.............', '.....mKm.....', '....m...m....', '.............', '..T.......T..', '.............', '...a.....a...', '.............', '.M.........M.', '.............', '.............', '......H......', '.............'],
      pool: ['....~~~~~....', '...~~~~~~~...', '...~~~~~~~...', '....~~~~~....', '.............', '.............', '.............', '..~~.....~~..', '..~~.....~~..', '.............', '.............', '.............', '.............'],
      goals: [{ k: 'turns', n: 5 }, { k: 'ink', n: 15 }],
      tip: '班長は沼のまん中。まわりの子は<b>毎ターン満タン</b>。班長は<b>7回当てないと</b>はじけない。連鎖とタンクで、何回ぶんも当てよう。',
      talk: [['boss', '地下水路へようこそ、ヒーロー'], ['boss', 'わたしは第5層の班長、セピア。この沼は、わたしたちの力のみなもとだよ！'], ['hero', 'その沼ごと、片づけてみせる'], ['ink', '班長〜、沼の中なら、満タンだよ〜！']],
      win: '第5層、制圧！ アジトの底は、もうすぐ……' },
    // ===== 第6層：救護係の医務室（仕かけ：救護係 N・n。インク漏れの仲間を治す。最後は幹部ナデシコ） =====
    { id: '6-1', title: '救護係', limit: 6,
      map:  ['...........', '...a...a...', '...........', '.....N.....', '...........', '...........', '...........', '...........', '...........', '.....H.....', '...........'],
      goals: [{ k: 'turns', n: 3 }, { k: 'ink', n: 4 }],
      tip: '頭の上に白い十字の子は<b>救護係</b>。となりのインク漏れの子を<b>治して</b>しまう。先に救護係をねらおう。',
      talk: [['ink', 'けがしたら、救護係におまかせ〜！'], ['ink', 'インク漏れくらい、すぐ治しちゃうよ！'], ['hero', '……あの十字の子から、たおすべきだな']],
      win: '救護係を先に、が鉄則だ' },
    { id: '6-2', title: '救護係をねらえ', limit: 6,
      map:  ['...........', '...mmm.....', '...mNm.....', '...mmm.....', '.......a...', '...........', '...........', '...........', '...........', '.....H.....', '...........'],
      goals: [{ k: 'turns', n: 2 }, { k: 'ink', n: 0 }],
      tip: '救護係が、まわりをかこまれて守られている。まわりの子をインク漏れにしても、<b>まん中の救護係</b>が治してしまう。',
      talk: [['ink', '救護係は、みんなで守るよ〜！'], ['ink', 'まん中にいれば、安心だもんね！'], ['hero', 'まん中か……ねらい方を考えよう']],
      win: 'まん中の救護係から、くずした' },
    { id: '6-3', title: '治される前に', limit: 5,
      map:  ['...........', '..x.x.x.x..', '..n.....n..', '...........', '....a.a....', '...........', '...........', '...........', '...........', '.....H.....', '...........'],
      goals: [{ k: 'turns', n: 3 }, { k: 'combo', n: 3 }],
      tip: '爆発寸前の子は、もう1発ではじける。でも救護係がとなりにいると、<b>治されてしまう</b>。治される前に、まとめて。',
      talk: [['ink', 'うう……インクがもれて、もう限界……'], ['ink', 'まってて、いま治すからね〜！'], ['hero', '治される前に、決めないと']],
      win: '治される前に、まとめて片づけた' },
    { id: '6-4', title: '救護係と連鎖', limit: 7,
      map:  ['...........', '.MMM...MMM.', '.MMM...MMM.', '..n.....n..', '...........', '.....a.....', '...........', '...........', '...........', '.....H.....', '...........'],
      goals: [{ k: 'combo', n: 7 }, { k: 'ink', n: 2 }],
      tip: '満タンの塊は連鎖で一気に。救護係は、連鎖で<b>インク漏れのまま残った子</b>を治しにくる。救護係ごと巻きこもう。',
      talk: [['ink', '満タンで、みんなで固まってるよ〜'], ['ink', '救護係もいるから、安心安心！'], ['hero', '救護係も、塊のそばにいるな']],
      win: '救護係ごと、連鎖で' },
    { id: '6-5', title: '救護係とタンク', limit: 6,
      map:  ['...........', '..m.T.m....', '...nnn.....', '...........', '.......m.m.', '.......N...', '...........', '...........', '...........', '.....H.....', '...........'],
      goals: [{ k: 'combo', n: 5 }, { k: 'turns', n: 2 }],
      tip: '救護係がタンクのそばに集まっている。<b>タンクの爆発</b>なら、救護係もまとめて。',
      talk: [['ink', 'タンクのそばは、救護係の休けい所〜'], ['ink', 'みんなで、お茶にしよ〜'], ['hero', '……そこで休けいは、危ないぞ']],
      win: '休けい所ごと、大爆発' },
    { id: '6-6', title: '柱のうしろの救護係', limit: 7,
      map:  ['...........', '....N.N....', '....#.#....', '...........', '..a.....a..', '...a...a...', '...........', '...........', '...........', '.....H.....', '...........'],
      goals: [{ k: 'turns', n: 3 }, { k: 'ink', n: 6 }],
      tip: '救護係は柱のうしろ。前に出てくる子をインク漏れにすると、救護係が<b>治しに出てくる</b>。そこをねらう手も。',
      talk: [['ink', '救護係は、柱のうしろで待機〜'], ['ink', 'けがしたら、すぐ来てね〜！'], ['hero', '出てきたところを、ねらうか']],
      win: '出てきた救護係を、のがさない' },
    { id: '6-7', title: '沼の救護係', limit: 7,
      map:  ['...........', '..m.m.m....', '...N.N.....', '..m.m.m....', '...........', '.a.......a.', '...........', '...........', '...........', '.....H.....', '...........'],
      pool: ['...........', '.~~~~~~~...', '.~~~~~~~...', '.~~~~~~~...', '...........', '...........', '...........', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'combo', n: 6 }, { k: 'ink', n: 6 }],
      tip: '沼の中の子は毎ターン満タン。救護係も沼の中。<b>1ターン待って、みんな満タン</b>になったら……。',
      talk: [['ink', '沼の中の医務室だよ〜'], ['ink', 'インクたっぷり、元気いっぱい！'], ['hero', 'みんな満タンになるのを、待とう']],
      win: '沼の医務室、まとめて片づけた' },
    { id: '6-8', title: '救護係と増援', limit: 8, opt: { reinforce: true, waves: 2 },
      map:  ['...........', '...n...n...', '...........', '....m.m....', '...........', '...........', '...........', '...........', '...........', '.....H.....', '...........'],
      goals: [{ k: 'turns', n: 4 }, { k: 'ink', n: 12 }],
      tip: '増援が来るうえに、救護係が治してまわる。<b>救護係から先に</b>。増援は四隅から。',
      talk: [['ink', '本部〜！ 医務室にヒーローが〜！'], ['ink', '増援、すぐ来るって！ けがは治すから、がんばって！'], ['hero', '長引くほど、不利だな']],
      win: '救護係から先に、正解だった' },
    { id: '6-9', title: '救護部隊', limit: 7,
      map:  ['...........', '.xNx...xNx.', '.N.N...N.N.', '...........', '...........', '....a.a....', '...........', '...........', '...........', '.....H.....', '...........'],
      goals: [{ k: 'combo', n: 6 }, { k: 'turns', n: 3 }],
      tip: '救護係だらけの部隊。爆発寸前の子と救護係がくっついている。<b>満タンの救護係</b>がはじければ、となりの子も連鎖する。',
      talk: [['ink', '救護部隊、出動〜！'], ['ink', 'だれひとり、はじけさせないよ！'], ['hero', 'くっついているなら、連鎖でいける']],
      win: '救護部隊、まとめて解散' },
    { id: '6-10', title: '幹部ナデシコ', limit: 12, boss: '幹部ナデシコ', bossHp: 7, exec: true, bossHeal: 2,
      map:  ['.............', '.....nKn.....', '....m...m....', '..T.......T..', '....N...N....', '.............', '.............', '.............', '..#.......#..', '.............', '.............', '......H......', '.............'],
      goals: [{ k: 'turns', n: 5 }, { k: 'ink', n: 15 }],
      tip: 'インク団の<b>幹部</b>。<b>7回当てないと</b>はじけない。<b>治しの号令</b>で、まわり2マスのインク漏れの子を毎ターン治す。救護係もいる。一気にはじけさせよう。',
      talk: [['boss', 'あらあら、こんな奥まで……けがはない？ ヒーローさん'], ['boss', 'わたしはインク団の幹部、ナデシコ。みんなのけがは、わたしがぜんぶ治してあげる'], ['hero', '幹部……ここからが本番か'], ['ink', 'ナデシコさまがいれば、はじけても平気だよ〜！']],
      win: '幹部ナデシコ、撃破！ アジトの奥から、だれかの気配が……' },
    // ===== 第7層：鏡の回廊（仕かけ：鏡 / ＼。ヒーローのレーザーは鏡で直角に曲がる。最後は幹部セレナ＝はね返しの盾） =====
    { id: '7-1', title: '鏡', limit: 5,
      map:  ['...........', '.MMM.\\.....', '.###.......', '...........', '...........', '...........', '...........', '...........', '...........', '.....H.....', '...........'],
      goals: [{ k: 'turns', n: 1 }, { k: 'combo', n: 3 }],
      tip: 'ななめの板は<b>鏡</b>。レーザーを鏡に向けて撃つと、<b>直角に曲がって</b>つらぬく。柱のうしろの列も、横からねらえる。',
      talk: [['ink', 'ここは鏡の回廊〜！ 柱のうしろなら、ぜったい安全！'], ['ink', 'ヒーローのレーザーなんて、とどかないもんね！'], ['hero', '……あの鏡、使えそうだな']],
      win: '鏡で曲げて、柱のうしろへ' },
    { id: '7-2', title: '左右の鏡', limit: 5,
      map:  ['...........', '.M.......M.', '.M.......M.', '.M.......M.', '...........', '#.##...##.#', '...........', '...........', '.\\...H...\/.', '...........', '...........'],
      goals: [{ k: 'turns', n: 1 }, { k: 'combo', n: 3 }],
      tip: '鏡の向きで、曲がる向きが変わる。<b>左の鏡は上へ、右の鏡も上へ</b>。横に撃てば、柱のすき間を通って奥の列へ。',
      talk: [['ink', '左右のすみっこで、見張り中〜'], ['ink', '柱がじゃまで、まっすぐは撃てないでしょ！'], ['hero', 'まっすぐじゃなければ、いいんだろう？']],
      win: '左右の鏡で、両方の列を' },
    { id: '7-3', title: 'うしろ向きの列', limit: 6,
      map:  ['.....\\.....', '.....B.....', '.....B.....', '.....B.....', '.....B.....', '...........', '.H.........', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'turns', n: 2 }, { k: 'combo', n: 4 }],
      tip: '奥を向いた列は、下からだと背中しか見えない。<b>上の鏡</b>を使えば、列の正面からつらぬける。',
      talk: [['ink', '奥の見張り、ばっちり〜'], ['ink', 'うしろからのレーザーは、表に当たらないもんね！'], ['hero', '表に当てるには……上からか']],
      win: '鏡で、列の正面に回った' },
    { id: '7-4', title: '鏡とタンク', limit: 6,
      map:  ['...........', '.mmm.......', '.mTm.......', '.mmm.......', '.###.......', '...........', '...........', '...........', '..\\..H.....', '...........', '...........'],
      goals: [{ k: 'combo', n: 8 }, { k: 'turns', n: 1 }],
      tip: '柱のうしろのタンク。<b>鏡で曲げたレーザー</b>でも、タンクは大爆発する。',
      talk: [['ink', 'タンクは柱のうしろに、しまっといたよ〜'], ['ink', 'これなら、ばくはつしないもんね！'], ['hero', '鏡の角度は……いけるな']],
      win: '鏡ごしの大爆発！' },
    { id: '7-5', title: '二つの鏡', limit: 6,
      map:  ['...........', '..a....#M#.', '.......#M#.', '...a...#M#.', '...........', '...../../..', '...........', '...........', '.....H.....', '...........', '...........'],
      goals: [{ k: 'combo', n: 3 }, { k: 'ink', n: 7 }],
      tip: 'レーザーは、<b>鏡から鏡へ</b>何回でも曲がる（全部で10マスまで）。まっすぐ上の鏡から右の鏡へ……柱にはさまれた列にとどくかな。',
      talk: [['ink', '柱でぐるっと、かこったよ〜'], ['ink', 'ここに入るには、おりの中に入るしかないね！'], ['hero', '……鏡を、つないでいけば']],
      win: '鏡から鏡へ、ねらいどおり' },
    { id: '7-6', title: '鏡と警備係', limit: 7,
      map:  ['...........', '.MM.....MM.', '.##.....##.', '...........', '..a.....a..', '...........', '.\\.......\/.', '...........', '...........', '.....H.....', '...........'],
      goals: [{ k: 'turns', n: 3 }, { k: 'ink', n: 6 }],
      tip: '警備係が近づいてくる。<b>鏡の前に立つと</b>、奥の塊もねらえる。どちらを先にするか。',
      talk: [['ink', '警備係、出動〜！'], ['ink', '奥の子たちは、柱のうしろで休けい中！'], ['hero', '近い子と、奥の塊と……']],
      win: '近くも奥も、片づけた' },
    { id: '7-7', title: '鏡とコンベア', limit: 7,
      map:  ['...........', '...........', '...........', '.....w.w.w.', '##########.', '...........', '...........', '........../', '...........', '.....H.....', '...........'],
      belt: ['...........', '...........', '...........', '>>>>>>>>>>.', '...........', '...........', '...........', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'turns', n: 5 }, { k: 'ink', n: 0 }],
      tip: 'コンベアの作業員は、柱の壁のうしろ。壁のはしの<b>すき間</b>まで運ばれてきたところを、右の鏡で曲げたレーザーか、すき間の真下から。',
      talk: [['ink', '鏡の回廊にも、コンベアがあるんだよ〜'], ['ink', '壁のうしろで、安全にお仕事〜'], ['hero', 'はしまで運ばれてきたら……']],
      win: 'コンベアの先で、まとめて' },
    { id: '7-8', title: '鏡と沼', limit: 7,
      map:  ['...........', '..w.w.w....', '...w.w.....', '.#######...', '...........', '...........', '.\\.........', '...........', '...........', '.....H.....', '...........'],
      pool: ['...........', '.~~~~~~~...', '.~~~~~~~...', '...........', '...........', '~~~~.~~~~~~', '~~~~.~~~~~~', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'combo', n: 5 }, { k: 'ink', n: 2 }],
      tip: '沼の中の作業員は、毎ターン満タン。柱の向こうは、<b>鏡で曲げて</b>。鏡まで行く道は、沼をよけて。',
      talk: [['ink', '沼のぬくぬく作業場、柱のうしろにかくしたよ〜'], ['ink', '柱のうしろなら、まっすぐのレーザーは、とどかないもんね！'], ['hero', 'まっすぐがだめなら……鏡で曲げる']], // Ink98：前の「のぞいちゃ、だめ」「鏡ごしなら」は、のぞく話に読めた
      win: '沼も柱も、鏡でこえた' },
    { id: '7-9', title: '鏡と増援', limit: 8, opt: { reinforce: true, waves: 2 },
      map:  ['...........', '...........', '...m...m...', '...#...#...', '...........', '.....m.....', '...........', '.\/.......\\.', '...........', '.....H.....', '...........'],
      goals: [{ k: 'turns', n: 4 }, { k: 'ink', n: 12 }],
      tip: '四隅から増援。鏡を使えば、柱のかげの子にも、来たばかりの増援にもとどく。',
      talk: [['ink', '本部〜！ 鏡の回廊にヒーローが〜！'], ['ink', '増援、すみっこから行くよ〜！'], ['hero', '鏡の向きを、よく見ておこう']],
      win: '鏡ごしに、増援も' },
    { id: '7-10', title: '幹部セレナ', limit: 12, boss: '幹部セレナ', bossHp: 7, exec: true, bossReflect: true,
      map:  ['.............', '.\\....K..../.', '.....m.m.....', '.............', '...T.....T...', '.............', '..m.......m..', '.............', './.........\\.', '....a...a....', '.............', '......H......', '.............'],
      goals: [{ k: 'turns', n: 6 }, { k: 'ink', n: 22 }],
      tip: '幹部セレナの<b>はね返しの盾</b>は、<b>正面</b>からのレーザー・ブレードをはね返す。<b>鏡で横やうしろ</b>に回すか、タンクの爆発・連鎖の飛沫で。<b>7回</b>当てればはじける。',
      talk: [['boss', 'ようこそ、鏡の回廊へ。わたしは幹部、セレナ'], ['boss', 'わたしの盾は、正面からの攻撃を、ぜんぶはね返す。あなたの光も、ね'], ['hero', '正面からが、だめなら……'], ['ink', 'セレナさまの盾は、無敵なんだから〜！']],
      win: '幹部セレナ、撃破！ 鏡の回廊のその先へ……' },
    // ===== 第8層：ワープの実験室（仕かけ：ワープ床 1〜9。止まると飛ぶ・レーザーは、もう一方から出る。最後は幹部ハヤテ＝1つの番に2回動く） =====
    { id: '8-1', title: 'ワープ床', limit: 5,
      map:  ['...........', '.#########.', '.#M.M.M.1#.', '.#########.', '...........', '...........', '.....1.....', '...........', '...........', '.....H.....', '...........'],
      goals: [{ k: 'turns', n: 1 }, { k: 'combo', n: 3 }],
      tip: '同じ色に光る輪は<b>ワープ床</b>。上で止まると、<b>もう一方へ飛ぶ</b>。柱にかこまれた部屋にも入れる。',
      talk: [['ink', 'ここはワープの実験室〜！'], ['ink', '柱の部屋の中なら、だれも入ってこられないよ！'], ['hero', '……あの光る輪は、どこにつながっている？']],
      win: 'ワープで、部屋の中へ' },
    { id: '8-2', title: 'ワープごしのレーザー', limit: 5,
      map:  ['...........', '..MMMMM..1.', '.#########.', '...........', '...........', '...........', '...........', '...........', '..1..H.....', '...........', '...........'],
      goals: [{ k: 'turns', n: 1 }, { k: 'combo', n: 5 }],
      tip: 'ワープ床にレーザーを撃つと、<b>もう一方のワープ床から、同じ向きに</b>出ていく。',
      talk: [['ink', '柱のうしろで、ずらっと整列〜'], ['ink', 'ワープを通ってくるなんて、むりむり〜'], ['hero', '光なら、通れるかもしれない']],
      win: 'ワープごしに、列をつらぬいた' },
    { id: '8-3', title: '飛んでくる警備係', limit: 6,
      map:  ['...........', '..a.....a..', '...1...2...', '...........', '...........', '...........', '...........', '..2.....1..', '...........', '.....H.....', '...........'],
      goals: [{ k: 'ink', n: 0 }, { k: 'turns', n: 2 }],
      tip: 'ワープ床は、<b>戦闘員も使う</b>。奥の警備係が、急に目の前に飛んでくることも。ワープ床のそばに立つときは注意。',
      talk: [['ink', 'ワープを使えば、一瞬でヒーローのそばへ！'], ['ink', 'どこから出てくるか、わかるかな〜？'], ['hero', '出口のそばには、立たないほうがいいな']],
      win: '飛んできた子も、落ちついて' },
    { id: '8-4', title: 'ワープとタンク', limit: 6,
      map:  ['...........', '.mmm.......', '.mTm......1', '.mmm.......', '.###.......', '...........', '...........', '...........', '1....H.....', '...........', '...........'],
      goals: [{ k: 'combo', n: 8 }, { k: 'turns', n: 1 }],
      tip: '柱のむこうのタンク。ワープの出口は、タンクと同じ列。<b>ワープごしのレーザー</b>でも、タンクは大爆発。',
      talk: [['ink', 'タンク置き場は、柱のむこう〜'], ['ink', 'ワープの出口？ そっちは、だれもいないよ〜'], ['hero', '出口の向きが、ちょうどいい']],
      win: 'ワープごしの大爆発！' },
    { id: '8-5', title: 'ワープと鏡', limit: 6,
      map:  ['...........', '.......#M#.', '.......#M#.', '.......#M#.', '...........', '.1......\/..', '...........', '...........', '.....H...1.', '...........', '...........'],
      goals: [{ k: 'turns', n: 1 }, { k: 'combo', n: 3 }],
      tip: 'ワープで出たレーザーも、<b>鏡で曲がる</b>。右のワープ床へ撃てば……。',
      talk: [['ink', '鏡とワープ、ぜんぶそろった部屋だよ〜'], ['ink', 'これだけあれば、まよっちゃうでしょ！'], ['hero', '組み合わせれば、とどく']],
      win: 'ワープと鏡で、ねらいどおり' },
    { id: '8-6', title: 'ワープの近道', limit: 6,
      map:  ['...........', '..w.w.w....', '...w.w...1.', '..w.w.w....', '...........', '...........', '...........', '...........', '.1...H.....', '...........', '...........'],
      pool: ['...........', '.~~~~~~~...', '.~~~~~~~...', '.~~~~~~~...', '~~~~~~~~~~~', '~~~~~~~~~~~', '~~~~~~~~~~~', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'combo', n: 8 }, { k: 'ink', n: 0 }],
      tip: '沼をこえると、よごれる。<b>ワープなら、沼を飛びこえられる</b>。沼の中の作業員は、毎ターン満タン。',
      talk: [['ink', '沼の中で、作業中〜'], ['ink', 'ここまで来るには、沼をわたらないとね〜'], ['hero', 'わたらなくても、飛べばいい']],
      win: 'ワープで、沼をひとっ飛び' },
    { id: '8-7', title: 'ワープの迷路', limit: 7,
      map:  ['1.........2', '.###...###.', '.#M#...#M#.', '.#M#...#M#.', '.#3#...#4#.', '...........', '...........', '...........', '...........', '..4..H..3..', '.....2.1...'],
      goals: [{ k: 'turns', n: 2 }, { k: 'combo', n: 2 }],
      tip: 'ワープ床が4組。どれがどこにつながっているか、<b>同じ色</b>をよく見よう。柱にかこまれた2人を、レーザーで上から。',
      talk: [['ink', 'ワープだらけの迷路だよ〜'], ['ink', 'どこにつながってるか、わたしたちも、わかんない〜'], ['hero', '色を見れば、わかるはずだ']],
      win: 'ワープの迷路、とけた' },
    { id: '8-8', title: 'ワープと増援', limit: 8, opt: { reinforce: true, waves: 2 },
      map:  ['...........', '.1.......2.', '...m...m...', '...........', '.....m.....', '...........', '...........', '...........', '.....H.....', '..2.....1..', '...........'],
      goals: [{ k: 'turns', n: 4 }, { k: 'ink', n: 12 }],
      tip: '四隅から増援。すみのワープ床を使われると、<b>すぐ目の前</b>に。ワープの出口のそばは、気をつけて。',
      talk: [['ink', '本部〜！ 実験室にヒーローが〜！'], ['ink', '増援、ワープで行くね〜！'], ['hero', '出口を見張っておこう']],
      win: 'ワープの増援も、まとめて' },
    { id: '8-9', title: '二つの部屋', limit: 7,
      map:  ['...........', '.#####.....', '.#MMM#.....', '.#MMM#.....', '.#.1.#.....', '.#####.....', '...........', '...a.a.1...', '...........', '.....H.....', '...........'],
      goals: [{ k: 'combo', n: 6 }, { k: 'turns', n: 2 }],
      tip: '柱でかこまれた部屋の中に、満タンの塊。<b>右のワープ床</b>は、部屋の中につながっている。ワープで入って、満タンのうちに一撃。',
      talk: [['ink', '部屋の中で、満タンで待機中〜'], ['ink', '入り口なんて、ないもんね〜'], ['hero', '入り口がなくても、ワープがある']],
      win: '部屋の中の塊、まとめて' },
    { id: '8-10', title: '幹部ハヤテ', limit: 12, boss: '幹部ハヤテ', bossHp: 7, exec: true, bossFast: true,
      map:  ['.............', '..1.......2..', '......K......', '.....m.m.....', '...T.....T...', '.............', '.............', '.............', '.....3.3.....', '.............', '..2.......1..', '......H......', '.............'],
      goals: [{ k: 'turns', n: 5 }, { k: 'ink', n: 20 }],
      tip: '幹部ハヤテは<b>すばやい</b>：1つの番に<b>2回</b>動いて撃つ。ワープ床も使って飛びまわる。<b>7回</b>当てればはじける。タンクのそばに来たときがチャンス。',
      talk: [['boss', 'おっそーい！ ここまで来るのに、何ターンかかってんの？'], ['boss', 'あたしはインク団の幹部、ハヤテ！ あたしの速さに、ついてこれる？'], ['hero', '速いだけなら、待ちぶせればいい'], ['ink', 'ハヤテさま、はやーい！']],
      win: '幹部ハヤテ、撃破！ この下が、アジトのいちばん奥……' },
    // ===== 特別ステージ：首領の間への通路（鉄柱。となりの戦闘員をつかんで、鉄柱へ放り投げる） =====
    { id: 'S-1', layer: 8.5, special: true, title: '首領の間への通路', limit: 14, opt: { reinforce: true, waves: 7, heroAtk: 3, poleLimit: 12, poleChainMin: 6, rush: true },
      map:  ['.............', '..a..a..a..a.', '.a....a....a.', '....a...a....', '...I.....I...', '.a.........a.', '......a......', '...a.....a...', '...I.....I...', '..a.......a..', '.............', '......H......', '.............'],
      goals: [{ k: 'poleChain', n: 3 }, { k: 'combo', n: 18 }],
      tip: 'この通路だけ、ヒーローは<b>となりの戦闘員を全員まとめて、鉄柱へ放り投げる</b>。<b>投げ方</b>：ヒーローの<b>上下左右のとなり</b>（ななめはだめ）にいる子を押すと、メニューのいちばん上に「🪝 鉄柱へ」が出る。鉄柱は<b>ヒーローから4マス以内</b>のものだけ。攻撃1回ぶん（この面は、攻撃が1つの番に3回）。<b>よごれ55で撤退＝負け</b>なので、増援にかこまれる前に投げよう。<b>1本に12人</b>重なると、その柱がはじけ、<b>同じ列で6人以上</b>つながった柱も<b>連鎖</b>してはじける。先に何本か6人以上にしてから、1本を12人に！',
      talk: [['ink', 'ここから先は、首領さまの間！ ぜったいに通さないよ〜！'], ['ink', 'みんな〜！ ありったけで、かかれ〜！'], ['hero', '数が多いな……あの鉄柱、使えるか'], ['ink', '鉄柱？ あんなの、ただの飾りだよ〜！']],
      win: '通路は、とおらせてもらった。……そこで、しばらくおとなしくしていろ' },
    // ===== 第9層：首領の間（今までの仕かけの組み合わせ。最後は首領ノワール：部下がいるあいだは守られ、ひとりぼっちになると覚醒） =====
    { id: '9-1', title: '最後の守り：タンクと鏡', limit: 6,
      map:  ['...........', '.mmm.......', '.mTm.......', '.mmm.......', '.###.......', '...........', '...a...a...', '...........', '..\\..H.....', '...........', '...........'],
      goals: [{ k: 'combo', n: 8 }, { k: 'ink', n: 3 }],
      tip: '首領の間の守り。柱のうしろのタンクは、<b>鏡で曲げたレーザー</b>で。近づく警備係にも気をつけて。',
      talk: [['ink', 'ここから先は、首領さまのお部屋！'], ['ink', '今までの守り、ぜんぶ使っちゃうよ〜！'], ['hero', '今までの戦い方、ぜんぶ使うまでだ']],
      win: '最後の守り、ひとつめ' },
    { id: '9-2', title: '最後の守り：柱とワープ', limit: 8,
      map:  ['...........', '.#########.', '.#M.M.M.1#.', '.#########.', '...........', '..a.....a..', '.....1.....', '...........', '...........', '.....H.....', '...........'],
      goals: [{ k: 'turns', n: 2 }, { k: 'ink', n: 4 }],
      tip: '柱の部屋の中へは、<b>ワープ床</b>で。警備係をかわしながら。',
      talk: [['ink', '部屋の中は、首領さまの親衛隊！'], ['ink', 'ワープの出口？ 気づかないでね〜'], ['hero', 'もう、見なれた仕かけだ']],
      win: 'ワープで、部屋の中へ' },
    { id: '9-3', title: '最後の守り：沼とコンベア', limit: 7,
      map:  ['...........', '...........', '.w.w.w.....', '...........', '...........', '..a.....a..', '...........', '...........', '...........', '.....H.....', '...........'],
      belt: ['...........', '...........', '>>>>>>>>...', '...........', '...........', '...........', '...........', '...........', '...........', '...........', '...........'],
      pool: ['...........', '...........', '....~~~~~~~', '...........', '~~~~.~.~~~~', '...........', '...........', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'combo', n: 3 }, { k: 'ink', n: 2 }],
      tip: '作業員がコンベアで<b>沼の中</b>へ運ばれると、毎ターン満タン。くっついて満タンになったところを、まとめて。',
      talk: [['ink', '沼の工場で、首領さまのインクを作ってるの〜'], ['ink', 'みんなで満タン、パワーアップ！'], ['hero', '満タンで、くっつくのを待とう']],
      win: '沼の工場も、止めた' },
    { id: '9-4', title: '最後の守り：救護係とタンク', limit: 7,
      map:  ['...........', '..m.T.m....', '...nnn.....', '.......#...', '.......mN..', '.......mm..', '..a........', '...........', '...........', '.....H.....', '...........'],
      goals: [{ k: 'combo', n: 5 }, { k: 'turns', n: 2 }],
      tip: '救護係が治してしまう前に。<b>タンク</b>なら救護係ごと。柱のかげの救護係は、回りこんで。',
      talk: [['ink', '首領さまの前で、だれひとりはじけさせない！'], ['ink', 'けがは、すぐ治すからね〜'], ['hero', '治される前に、まとめてだ']],
      win: '救護係ごと、片づけた' },
    { id: '9-5', title: '最後の守り：鏡とワープ', limit: 6,
      map:  ['...........', '.......#M#.', '.......#M#.', '.......#M#.', '...........', '.1......\/..', '...........', '..a........', '.....H...1.', '...........', '...........'],
      goals: [{ k: 'turns', n: 1 }, { k: 'combo', n: 3 }],
      tip: 'ワープから出たレーザーは、鏡で曲がる。右のワープ床へ撃てば……。',
      talk: [['ink', '鏡とワープのお部屋、いらっしゃいませ〜'], ['ink', 'ここで、まよっちゃえ〜！'], ['hero', 'つなぎ方は、もう知っている']],
      win: 'ワープと鏡で、一発' },
    { id: '9-6', title: '最後の守り：沼の救護係', limit: 7,
      map:  ['...........', '..m.m.m....', '...N.N.....', '..m.m.m....', '...........', '.a.......a.', '...........', '...........', '...........', '.....H.....', '...........'],
      pool: ['...........', '.~~~~~~~...', '.~~~~~~~...', '.~~~~~~~...', '...........', '...........', '...........', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'combo', n: 6 }, { k: 'ink', n: 6 }],
      tip: '沼の中で、みんな満タン。救護係もいる。<b>1ターン待って</b>、満タンになったら一撃。',
      talk: [['ink', '沼のお医者さん、またまた登場〜'], ['ink', 'インクたっぷり、元気いっぱい！'], ['hero', '待ってから、まとめてだ']],
      win: '沼の医務室、もう一度' },
    { id: '9-7', title: '最後の守り：コンベアと鏡', limit: 7,
      map:  ['...........', '...........', '...........', '.....w.w.w.', '##########.', '...........', '..a........', '..........\/', '...........', '.....H.....', '...........'],
      belt: ['...........', '...........', '...........', '>>>>>>>>>>.', '...........', '...........', '...........', '...........', '...........', '...........', '...........'],
      goals: [{ k: 'turns', n: 5 }, { k: 'ink', n: 2 }],
      tip: '壁のうしろの作業員が、はしのすき間へ運ばれてくる。鏡で曲げるか、すき間の真下から。',
      talk: [['ink', '壁のうしろで、首領さまのおやつを運んでま〜す'], ['ink', 'のぞいちゃ、だめ〜！'], ['hero', 'はしまで来たら、ねらえる']],
      win: 'おやつの運び手も、片づけた' },
    { id: '9-8', title: '最後の守り：ワープとタンク', limit: 7,
      map:  ['...........', '.mmm.......', '.mTm......1', '.mmm.......', '.###.......', '...........', '...a...a...', '...........', '1....H.....', '...........', '...........'],
      goals: [{ k: 'combo', n: 8 }, { k: 'ink', n: 0 }],
      tip: 'ワープの出口は、タンクと同じ列。<b>ワープごしのレーザー</b>で大爆発。',
      talk: [['ink', '首領さまのタンク置き場は、ぜったい守る！'], ['ink', 'ワープの出口なんて、関係ないもんね〜'], ['hero', '関係、大ありだ']],
      win: 'ワープごしの大爆発、もう一度' },
    { id: '9-9', title: '首領の親衛隊', limit: 10, boss: '親衛隊長', bossHp: 4,
      map:  ['.............', '....N.K.N....', '...M.....M...', '..T.......T..', '...a.....a...', '.....#.#.....', '..a.......a..', '..\\......./..', '.............', '.............', '.............', '......H......', '.............'],
      goals: [{ k: 'turns', n: 4 }, { k: 'ink', n: 10 }],
      tip: '首領の親衛隊。隊長は<b>4回</b>当てないとはじけない。救護係・タンク・鏡、ぜんぶ使って。',
      talk: [['boss', 'ここが最後の守り。首領さまには、指一本ふれさせない！'], ['ink', '親衛隊、全員そろってるよ〜！'], ['hero', 'この先に、首領がいるのか']],
      win: '親衛隊、突破！ 次は……首領の間だ' },
    { id: '9-10', title: '首領ノワール', limit: 16, boss: '首領ノワール', chief: true, awakeHp: 8, final: true,
      map:  ['.............', '......K......', '....M...M....', '...M..m..M...', '.............', '..#.......#..', '.....a.a.....', '.............', '..#.......#..', '...T.....T...', '.............', '......H......', '.............'],
      goals: [{ k: 'turns', n: 9 }, { k: 'ink', n: 30 }],
      tip: '首領ノワールは、<b>部下が1人でも残っているあいだは、守られていて攻撃が効かない</b>。部下を全員はじけさせると……。覚醒したら、<b>2ターンに1回のインクストーム</b>は<b>柱のかげ</b>で防げる。覚醒したら体力8。',
      talk: [['boss', 'よ、ようこそなのじゃ！ わらわは、インク団首領……ノワールなのじゃ！'], ['hero', '……ちいさい'], ['boss', 'ち、ちいさいとか言うでないっ！ みんな、わらわを守るのじゃ〜！'], ['ink', 'はーい！ 首領さまは、わたしたちが守ります！']],
      win: 'インク団首領ノワール、撃破！ アジト、完全制圧！' },
  ];
  IW.STAGES.forEach((s, i) => { if (s.layer == null) s.layer = +s.id.split('-')[0]; s.no = +s.id.split('-')[1]; s.idx = i; });
  // ===== おはなしの場面（オープニング・再生の部屋・エンディング） =====
  //   1行 = [だれ, セリフ, しかけ, 声の演技メモ]。だれ：narr（語り）・hero・noir（首領ノワール）・ink（戦闘員。'ink:2' で何番目の子か）・mon（部屋の画面の文字）
  //   しかけ：場面ごとのカメラや動き（src/ui/scene.js の ACT が読む）。before：この面を始める前に見せる。after：この面をクリアしたあとに見せる
  IW.STORY = {
    opening: { title: 'オープニング', before: '1-1', set: 'throne', lines: [
      ['narr', 'インクの町のはずれ。地下ふかくに、インク団のアジトがある。', 'wide'],
      ['narr', 'アジトのいちばん奥にすむのは、首領ノワール。ふしぎなインクを作れる女の子。', 'noir'],
      ['narr', 'ずっとひとりぼっちだったノワールは、インクから友だちを作った。それが、インク団の戦闘員たち。', 'minions'],
      ['narr', '戦闘員たちは、町の子とも遊ぶようになった。「いっしょに、インク団にならない？」――「いいよ」と答えた子は、インクをあびて、仲間になった。', 'minions2'],
      ['narr', '友だちが入ったからと、自分から「わたしも入れて」と来た子もいる。', 'minions2'],
      ['ink:0', '首領さま〜！ 今日のおやつです！', 'snack', 'おやつを差し出す。うれしそうに、元気よく'],
      ['noir', 'うむ、ごくろうなのじゃ！ ……でも、まだまだ足りないのじゃ', 'noir', 'いばって受け取るが、少しさみしそう'],
      ['ink:1', 'おやつが、ですか？', 'minions', 'きょとんとして聞き返す'],
      ['noir', '友だちが、なのじゃ！ もっと、もーっと、たくさんほしいのじゃ！', 'noirUp', 'じたばたして、子どもっぽくだだをこねる'],
      ['noir', 'そこで、大作戦なのじゃ！ 町じゅうにインクの雨をふらせて、町の人を、みんなインクの仲間にするのじゃ！', 'tanks', '得意げに、高らかに発表する'],
      ['ink:2', 'さすが首領さま〜！', 'cheer', 'みんなで大喜び。ばんざい'],
      ['narr', 'その大作戦のうわさは、町を守るヒーローの耳にも、とどいていた。', 'gate'],
      ['hero', '町じゅうをインクに……そんなこと、させるわけにはいかない', 'gateHero', '静かに、決意をこめて'],
      ['hero', '待っていろ、インク団。……いくぞ！', 'gateGo', 'きりっと、気合いを入れる'],
    ] },
    capsule: { title: '再生の部屋', before: '9-6', set: 'lab', lines: [
      ['narr', '最後の守りをすすむヒーローは、ふしぎな部屋に出た。', 'labEnter'],
      ['hero', '……なんだ、この部屋は', 'labHero', '息をのむ。おどろいて、小さく'],
      ['narr', '円柱のカプセルが、奥までびっしり。うすく光る液の中に、戦闘員たちがふわりと浮かんでいる。', 'labDolly'],
      ['hero', 'さっきはじけた子たちが……みんな、ここで元にもどっているのか', 'labWalk', 'おどろきながら、しみじみと'],
      ['mon', '再生中：347体　首領さまの手作りインクで、ひとりずつ', 'monitor'],
      ['hero', 'ひとりずつ……全部、首領が作ったのか', 'labHero2', '心を動かされて、つぶやく'],
      ['ink:0', 'むにゃ……首領さま……つぎは、かつから……', 'sleeper', 'カプセルの中の寝言。ねぼけて、むにゃむにゃ'],
      ['ink:0', '……ひっ！ ヒ、ヒーロー！？ う、動けない……！', 'wake1', '目をさまして、びっくりあわてる。動けなくてじたばた'],
      ['ink:1', 'やだやだ、いま来ないで〜！', 'wakeAll', '泣きそうにあわてる'],
      ['hero', '……寝てろ。動けない相手と戦う気はない', 'heroCalm', 'ぶっきらぼうだけど、やさしく'],
      ['ink:0', '……わたし、もとは町の子なんだよ。ヒーローは、知らないでしょ', 'town1', '少し落ちついて、ないしょ話のように'],
      ['ink:0', 'みんなと遊んでて、「仲間にならない？」って聞かれて……自分で「いいよ」って言ったの', 'town1', '思い出して、少しうれしそうに'],
      ['hero', '……自分で、選んだのか', 'heroCalm2', '考えこむように、静かに'],
      ['ink:2', 'うそだ〜！ 固定砲台部隊のときは、えんりょなく撃ってたくせに〜！', 'tsukkomi1', 'ぷんぷん怒ってツッコむ。コミカルに'],
      ['ink:3', 'わたしなんか、柱に投げられたんですけど〜！', 'tsukkomi2', 'さらにツッコむ。すねて'],
      ['hero', '……あれは、撃ってきたからだ。……柱は、その……作戦だ', 'heroAway', '言いわけ。最後はしどろもどろ'],
      ['ink:1', '……にげた', 'away1', 'ぽかんとして'],
      ['ink:2', 'にげたね', 'away2', 'ぽかんとして、うなずく'],
      ['ink:0', '……でも、ヒーローって、もっとこわい人だと思ってた', 'away3', '少し見直したように、ほほえんで'],
    ] },
    ending: { title: 'エンディング', after: '9-10', set: 'lab', lines: [
      ['narr', '首領の間のおくは、あの再生の部屋につながっていた。', 'endWide'],
      ['noir', 'うっ……ぐすっ……わらわの、負けなのじゃ……', 'endNoir', '泣きじゃくる。しゃくりあげながら'],
      ['noir', 'わらわは……友だちが、ほしかっただけなのじゃ……', 'endNoir', '泣きながら、本音をこぼす'],
      ['noir', '……そなた、この部屋の子たちに、手を出さなかったそうじゃな。どうしてなのじゃ……？', 'endNoirLook', '涙声で、不思議そうに聞く'],
      ['hero', '動けない相手と、戦う気はない。……それに', 'endHero', 'やさしく、ゆっくり'],
      ['hero', '友だちは、むりやりインクをかけて作るものじゃない', 'endHero', 'さとすように、やさしく'],
      ['noir', '…………', 'endNoir', '言葉が出ない。小さく息をのむだけ'],
      ['hero', '……でも、ほら。もう、いるじゃないか', 'endOpen', 'ほほえんで、やさしく'],
      ['mon', '再生完了', 'endDone'],
      ['ink:0', '首領さま〜！', 'endRun', '目をさまして、うれしそうにかけよる'],
      ['ink:1', '首領さま、だいじょうぶですか！？', 'endCrowd', '心配して、かけよる'],
      ['ink:2', '負けちゃっても、わたしたちがいます〜！', 'endCrowd', '元気づける。明るく'],
      ['noir', 'みんな……みんな〜！ うわぁぁん！', 'endHug', 'うれし泣き。大声で泣く'],
      ['ink:3', 'それにね、ヒーロー。わたしは「いいよ」って言ったよ？', 'endTalk3', 'ヒーローに、にこっと'],
      ['ink:0', 'わたしなんか、自分から「入れて」って言ったもん！', 'endTalk0', 'えっへん、と得意げ'],
      ['hero', '……ああ。聞いて、答えてもらったなら、それでいい', 'endHero2', '少し笑って、うなずく'],
      ['hero', 'でも、インクの雨は、だれにも聞かない', 'endHero2', 'まじめに、静かに'],
      ['noir', '……雨だと、ひとりずつ聞けないのじゃな', 'endNoir2', '気づいて、しゅんとする'],
      ['noir', '……わかったのじゃ。インクの雨の大作戦は、やめるのじゃ', 'endNoir2', '涙をふいて、すなおに'],
      ['noir', 'わらわには、もう……こんなに、友だちがいたのじゃな', 'endNoir2', 'しみじみ、うれしそうに'],
      ['ink:3', 'はい！ ずっと前から、です！', 'endCheer', '元気いっぱいに'],
      ['hero', '町の人と友だちになりたいなら、遊びに来て、ひとりずつ聞けばいい', 'endHero2', 'あたたかく、提案する'],
      ['noir', 'ほ、ほんとうか！？ ……では、ヒーロー。そなたも、わらわの友だちに……', 'endNoir3', 'ぱっと明るくなる。後半はもじもじ'],
      ['hero', 'スライムにしないなら、な', 'endHero2', '少しからかうように'],
      ['noir', 'し、しないのじゃ！ ……たぶん', 'endNoir3', 'あわてて否定。最後は小声'],
      ['ink:1', 'たぶん！？', 'endCheer', 'みんなでツッコむ'],
      ['noir', '……というか、そなた。もう、なりかけておるのじゃ', 'endSlime', 'じーっと見て、ぽつりと'],
      ['hero', '……え？', 'endSlime2', 'きょとんとして'],
      ['ink:2', 'ほんとだ！ ほっぺ、青いよ〜！', 'endSlimeInk', '楽しそうに指さす'],
      ['noir', '何百人もはじけさせて、そのインクをずっとあびておったからの。体の芯まで、しみこんでおるのじゃ', 'endNoir3', 'もっともらしく、ちょっと得意げに説明する'],
      ['ink:0', 'おそろいだ〜！', 'endSame', 'みんなで大喜び'],
      ['hero', '……変身をとけば、もどる。……たぶん', 'endHero3', '言い聞かせるように。最後は自信なさげに小声'],
      ['ink:1', 'たぶん！？', 'endCheer', 'みんなでツッコむ'],
      ['narr', 'こうして、インクの雨の大作戦は中止になった。', 'endFar'],
      ['narr', 'インク団は、今日もアジトでにぎやかにくらしている。ときどき、ヒーローとのインク合戦をたのしみながら。', 'endFar'],
      ['narr', '―― おしまい ――', 'endFin'],
    ] },
  };
  IW.stageById = (id) => IW.STAGES.find(s => s.id === id) || null;

  // 面を並べる
  IW.newStage = function (def, seed) {
    const opt = Object.assign({ seed: seed || ('stage' + def.id + Date.now()), mode: 'hero', form: 'stage', count: 0, power: false, reinforce: false }, def.opt || {});
    if (def.bonus) opt.stageBonus = true;
    const rows = def.map, N = rows.length;
    opt.N = N; IW.resetIds();
    const G = { opt, N, grid: new Array(N * N).fill(null), units: [], r: IW.rng(opt.seed), turn: 1, side: 'hero', stat: {}, result: null, noTimeBurst: false, log: [], spawnN: 0, spawnWaves: 0, stage: def };
    let hx = Math.floor(N / 2), hy = N - 2;
    rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === 'H') { hx = x; hy = y; } });
    const h = IW.makeHero(hx, hy, { power: opt.power, name: HERO }); h.dir = 0; if (opt.heroAtk) h.extraAtk = opt.heroAtk - 2; G.hero = h; G.units.push(h); IW.place(G, h, hx, hy);
    const names = G.r.shuffle(IW.NAMES.filter(n => !def.boss || def.boss.indexOf(n) < 0)); let ni = 0;
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = row[x]; if (c === '.' || c === 'H' || c === ' ') continue;
        if (c >= '1' && c <= '9') continue; // ワープ床（第8層。下で、つなぐ）
        if (c === 'T') { const b = IW.makeBarrel(x, y); G.units.push(b); IW.place(G, b, x, y); continue; }
        if (c === 'I') { const p = { id: IW.newId(), kind: 'pole', team: 'prop', name: '鉄柱', x, y, dir: 0, state: 'ok', gone: false, parts: {}, stack: [] }; G.units.push(p); IW.place(G, p, x, y); (G.poles = G.poles || []).push(p); continue; } // 鉄柱（特別ステージ）
        if (c === '/' || c === '\\') { const mr = { id: IW.newId(), kind: 'mirror', team: 'prop', name: '鏡', mirror: c, x, y, dir: 0, state: 'ok', gone: false, parts: {} }; G.units.push(mr); IW.place(G, mr, x, y); continue; } // 鏡（第7層）
        if (c === '#') { const w = { id: IW.newId(), kind: 'wall', team: 'prop', name: '柱', x, y, dir: 0, state: 'ok', gone: false, parts: {} }; G.units.push(w); IW.place(G, w, x, y); continue; }
        const boss = c === 'K';
        const u = IW.makeMinion('ink', boss ? (def.boss || '班長') : names[ni++ % names.length], x, y, 2);
        u.voice = (G.units.length - 1) % 9;
        if (c === 'A' || c === 'a') u.dir = IW.dirTo(u, h);
        else if (c === 'B' || c === 'b') u.dir = 0;
        else if (c === '>') u.dir = 1;
        else if (c === '<') u.dir = 3;
        if (c === 'm' || c === 'a' || c === 'b') u.full = false;
        if (c === 'N' || c === 'n') { u.medic = true; u.full = c === 'N'; u.dir = IW.dirTo(u, h); } // 救護係（第6層）
        if (boss && def.chief) { u.chief = true; u.full = false; u.hp = 0; u.hp0 = 0; } // 首領（第9層）：部下がみんなはじけるまで、守られている
        if (boss && def.bossFast) u.fast = true; // すばやい幹部：1つの番に2回動く
        if (boss && def.bossReflect) u.reflect = true; // 幹部の「はね返しの盾」：正面からの弾・レーザー・ブレードをはね返す
        if (boss && def.bossHeal) u.healer = def.bossHeal; // 幹部の「治しの号令」：まわり何マスのインク漏れの仲間を、番のはじめにまとめて治す
        if (boss && def.exec) u.exec = true; // 幹部（班長より大きく、しるしもちがう）
        if (c === 'w') { u.worker = true; u.full = false; } // 作業員（第4層）：持ち場から歩かない（撃つことはできる。コンベアには運ばれる）
        if (boss && def.bossWorker) u.worker = true;
        if (c === 'W') { u.pinned = true; u.parts.valve = false; u.dir = 2; } // 壁に大の字で張り付いた子（ボーナス）：動けない・跳べない・ずっと満タン
        if (c === 'x') { u.full = false; u.state = 'leak'; u.parts.cannon = false; u.leakAge = 0; u.sit = false; u.press = 4; }
        if (boss) { u.boss = true; if (def.bossHp) { u.hp = def.bossHp; u.hp0 = def.bossHp; } } // 第2層からのボスは体力つき
        G.units.push(u); IW.place(G, u, x, y);
      }
    });
    if (def.pool) { G.puddle = new Uint8Array(N * N); def.pool.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === '~') G.puddle[y * N + x] = 1; }); } // 第5層：インクだまり
    // ワープ床（第8層）：盤の数字 1〜9。同じ数字の2マスがつながる。G.pads はレーザーのねらい先（人ではない）
    { const P = {}; rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const c = row[x]; if (c >= '1' && c <= '9') (P[c] = P[c] || []).push({ x, y }); } });
      const ks = Object.keys(P).filter(k => P[k].length === 2);
      if (ks.length) { G.warp = new Int16Array(N * N).fill(-1); G.pads = []; for (const k of ks) { const [a, b] = P[k]; G.warp[a.y * N + a.x] = b.y * N + b.x; G.warp[b.y * N + b.x] = a.y * N + a.x; G.pads.push({ kind: 'pad', id: 'p' + k + 'a', pair: +k, x: a.x, y: a.y }, { kind: 'pad', id: 'p' + k + 'b', pair: +k, x: b.x, y: b.y }); } } }
    if (def.belt) { G.belt = new Int8Array(N * N).fill(-1); def.belt.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const d = '^>v<'.indexOf(row[x]); if (d >= 0) G.belt[y * N + x] = d; } }); }
    G.count0 = IW.minions(G).length;
    return G;
  };

  // ===== ベルトコンベア（第4層の仕かけ） =====
  //   面の belt（盤と同じ形の文字：^ 奥へ・> 右へ・v 手前へ・< 左へ）。毎ターンの終わり（戦闘員の番のあと）に、
  //   コンベアの上の戦闘員・ヒーロー・インクタンクが、その向きに1マス運ばれる（行き先がふさがっていれば動かない）。前にいる子から先に動くので、列のまま運ばれる。
  IW.beltAt = (G, x, y) => G.belt && IW.inB(G, x, y) ? G.belt[y * G.N + x] : -1;
  IW.beltStep = function (G, ev) {
    const L = G.units.filter(u => IW.alive(u) && (u.kind === 'minion' || u.kind === 'hero' || u.kind === 'barrel') && !u.pinned && IW.beltAt(G, u.x, u.y) >= 0)
      .map(u => { const d = IW.beltAt(G, u.x, u.y), D = IW.DIRS[d]; return { u, d, D, k: u.x * D[0] + u.y * D[1] }; }).sort((a, b) => b.k - a.k);
    const moves = [], done = new Set();
    for (let pass = 0; pass < 3; pass++) for (const o of L) {
      if (done.has(o.u.id)) continue;
      const x = o.u.x + o.D[0], y = o.u.y + o.D[1];
      if (!IW.inB(G, x, y) || IW.at(G, x, y)) continue;
      IW.place(G, o.u, x, y); done.add(o.u.id); moves.push({ id: o.u.id, x, y });
    }
    if (moves.length) ev.push({ k: 'belt', moves });
  };
  // ===== インクタンク（第2層の仕かけ） =====
  //   盤の上に置いてある大きなタンク（物）。撃つ・斬る・飛沫がかかると大爆発する。
  //   まわり1マスの戦闘員は即はじける。2マスの戦闘員には飛沫（満タン・インク漏れは、たいていはじける）。2マス以内のほかのタンクも誘爆する。
  //   ヒーローも、1マスならよごれ6、2マスならよごれ3。
  IW.BARREL_INK = [0, 6, 3];
  IW.makeBarrel = (x, y) => ({ id: IW.newId(), kind: 'barrel', team: 'prop', name: 'インクタンク', x, y, dir: 0, state: 'ok', gone: false, parts: {} });
  IW.barrelBlast = function (G, b, src, ev, from) {
    if (!IW.alive(b)) return;
    b.state = 'gone'; IW.remove(G, b);
    ev.push({ k: 'barrel', id: b.id, x: b.x, y: b.y, by: src ? src.id : 0, from: from || 0 });
    if (G.puddle) for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = b.x + dx, y = b.y + dy; if (IW.inB(G, x, y) && !IW.isWall(G, x, y) && !G.puddle[y * G.N + x]) { G.puddle[y * G.N + x] = 1; ev.push({ k: 'puddle', x, y }); } } // タンクの爆発で、まわりにもだまり
    const n0 = ev.length, h = G.hero;
    if (h && !h.gone) { const d = IW.dist(h, b); if (d <= 2 && IW.clear(G, b, h)) IW.heroInk(G, IW.BARREL_INK[d], ev, 'barrel'); } // 柱のかげなら、爆風はとどかない
    const T = [];
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const v = (dx || dy) && IW.inB(G, b.x + dx, b.y + dy) && IW.at(G, b.x + dx, b.y + dy); if (v && IW.alive(v) && (v.kind === 'minion' || v.kind === 'barrel') && IW.clear(G, b, v)) T.push({ v, d: Math.max(Math.abs(dx), Math.abs(dy)) }); }
    T.sort((p, q) => p.d - q.d);
    for (const { v, d } of T) {
      if (!IW.alive(v)) continue;
      if (v.kind === 'barrel') IW.barrelBlast(G, v, null, ev, b.id);
      else if (d === 1) IW.burst(G, v, null, ev, 'barrel');
      else IW.hitMinion(G, v, 'splash', null, ev);
    }
    // 2マス先の子が、飛沫ではじけたときも「タンクの爆発で、まとめて」の見せ方にする
    for (let i = n0; i < ev.length; i++) if (ev[i].k === 'burst' && (ev[i].why === 'full' || ev[i].why === 'again') && !ev[i].by) ev[i].why = 'barrel';
  };
  // AI 用：このタンクが爆発したら、どれくらいの得か（はじける人数のめやす − ヒーローのよごれ）
  IW.barrelValue = function (G, b, hx, hy, seen) {
    seen = seen || new Set(); if (seen.has(b.id)) return 0; seen.add(b.id);
    let s = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      if (!dx && !dy) continue; const x = b.x + dx, y = b.y + dy; if (!IW.inB(G, x, y)) continue;
      const v = IW.at(G, x, y); if (!v || !IW.alive(v) || !IW.clear(G, b, v)) continue; const d = Math.max(Math.abs(dx), Math.abs(dy));
      if (v.kind === 'barrel') s += IW.barrelValue(G, v, hx, hy, seen) * 0.9;
      else if (v.kind === 'minion') s += v.hp ? 0.7 / v.hp : d === 1 ? 1 : (v.full || v.state === 'leak') ? 0.85 : 0.35;
    }
    const hd = Math.max(Math.abs(hx - b.x), Math.abs(hy - b.y));
    if (hd <= 2 && IW.clear(G, b, { x: hx, y: hy })) s -= IW.BARREL_INK[hd] * 0.22;
    return s;
  };
  // 目標のことば
  IW.goalText = function (g) {
    if (g.k === 'poled') return '鉄柱に' + g.n + '人つなぐ';
    if (g.k === 'poleChain') return '鉄柱の' + g.n + '連鎖';
    return g.k === 'turns' ? g.n + 'ターン以内にクリア' : g.k === 'ink' ? (g.n ? 'よごれ' + g.n + '以下でクリア' : 'よごれ0でクリア') : g.k === 'combo' ? '1回の攻撃で' + g.n + '人はじけさせる' : g.k === 'nosp' ? 'わざを使わずにクリア' : '';
  };
  // 目標を満たしたか（クリアしたときだけ★がつく）
  IW.goalMet = function (G, g) {
    const st = G.stat.hero || {};
    if (g.k === 'turns') return G.turn <= g.n;
    if (g.k === 'ink') return G.hero.ink <= g.n;
    if (g.k === 'combo') return (st.combo || 0) >= g.n;
    if (g.k === 'nosp') return !st.sp;
    if (g.k === 'poled') return (G.stat.poled || 0) >= g.n;
    if (g.k === 'poleChain') return (G.stat.poleChain || 0) >= g.n;
    return false;
  };
  IW.stageStars = function (G) {
    if (G.result !== 'cleared') return { stars: 0, met: G.stage.goals.map(() => false) };
    const met = G.stage.goals.map(g => IW.goalMet(G, g));
    return { stars: 1 + met.filter(Boolean).length, met };
  };
  // ヒーローの攻撃1回ぶんの記録（1回で何人はじけたか・わざを使ったか）
  IW.noteHeroAttack = function (G, m, ev, from) {
    const st = G.stat.hero = G.stat.hero || { combo: 0, sp: 0 };
    let n = 0; for (let i = from || 0; i < ev.length; i++) if (ev[i].k === 'burst' && ev[i].team !== 'hero') n++;
    st.combo = Math.max(st.combo, n);
    if (m && m.w !== 'blade' && m.w !== 'laser') st.sp++;
    return n;
  };
})(typeof window !== 'undefined' ? (window.IW = window.IW || {}) : (globalThis.IW = globalThis.IW || {}));
