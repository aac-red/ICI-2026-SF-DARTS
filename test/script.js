const NUMS = [20,19,18,17,16,15,14,13,12,'BULL'];
const VALS = [20,19,18,17,16,15,14,13,12,25];
const MAX_HITS = 99;
const KEY = 'cricket_darts_v2';

const blankHits = () => [new Array(10).fill(0), new Array(10).fill(0)];
const blankFirst = () => new Array(10).fill(null); // per number: 0 / 1 = who closed first, null = nobody yet
const freshState = () => ({names:['Player 1','Player 2'], logos:[null,null], hits:blankHits(), first:blankFirst(), frozen:blankFirst(), adj:[0,0]});

function sanitize(s){
  const d = freshState();
  if(!s || typeof s !== 'object') return d;
  const okNum = v => Number.isFinite(v) ? Math.min(MAX_HITS, Math.max(0, Math.floor(v))) : 0;
  if(Array.isArray(s.names)) d.names = [0,1].map(i => typeof s.names[i]==='string' ? s.names[i].slice(0,16) : d.names[i]);
  if(Array.isArray(s.logos)) d.logos = [0,1].map(i => (typeof s.logos[i]==='string' && s.logos[i].startsWith('data:image/')) ? s.logos[i] : null);
  if(Array.isArray(s.hits)) d.hits = [0,1].map(p => Array.isArray(s.hits[p]) ? NUMS.map((_,i)=>okNum(s.hits[p][i])) : new Array(10).fill(0));
  if(Array.isArray(s.first)) d.first = NUMS.map((_,i)=> (s.first[i]===0||s.first[i]===1) ? s.first[i] : null);
  if(Array.isArray(s.frozen)) d.frozen = NUMS.map((_,i)=> Number.isFinite(s.frozen[i]) ? okNum(s.frozen[i]) : null);
  if(Array.isArray(s.adj)) d.adj = [0,1].map(i => Number.isFinite(s.adj[i]) ? Math.round(s.adj[i]) : 0);
  // make "first" / "frozen" consistent with hits
  NUMS.forEach((_,i)=> refreshNumber(d, i));
  return d;
}

// Decide who closed a number first, given the previous answer and current hits.
function resolveFirst(prev, h1, h2){
  const c1 = h1>=3, c2 = h2>=3;
  if(!c1 && !c2) return null;
  if(c1 && !c2) return 0;
  if(c2 && !c1) return 1;
  return prev;  // both closed: keep whoever was first (null if unknown, e.g. both typed at once)
}

// Keep first-closer and frozen-points info consistent for number i.
// "frozen" = the first closer's hit count at the moment the opponent closed too;
// points are kept up to that count and never wiped when both players close.
function refreshNumber(st, i){
  const h1 = st.hits[0][i], h2 = st.hits[1][i];
  st.first[i] = resolveFirst(st.first[i], h1, h2);
  if(h1>=3 && h2>=3 && st.first[i]!==null){
    if(st.frozen[i]===null) st.frozen[i] = st.hits[st.first[i]][i];
  } else st.frozen[i] = null;   // someone re-opened the number (or order unknown)
}

let state = freshState();
try{
  const saved = localStorage.getItem(KEY);
  if(saved) state = sanitize(JSON.parse(saved));
}catch(e){ state = freshState(); }

let saveWarned = false;
function save(){
  try{ localStorage.setItem(KEY, JSON.stringify(state)); }
  catch(e){
    if(!saveWarned){ saveWarned = true; console.warn('Could not save game (storage full or blocked).'); }
  }
}

function marksFor(h){ return ['','/','Λ','▲'][Math.min(h,3)]; }
function marksLabel(h){ return ['no hits','1 hit','2 hits','closed'][Math.min(h,3)]; }
function pointsFor(side, i){
  const me = state.hits[side][i], opp = state.hits[1-side][i];
  if(me<3) return 0;
  if(opp<3) return (me-3)*VALS[i];                       // opponent still open: every extra hit scores
  if(state.first[i]===side && state.frozen[i]!==null)     // both closed: keep what was earned before that
    return Math.max(0, Math.min(me, state.frozen[i]) - 3) * VALS[i];
  return 0;
}
const autoTotal = side => NUMS.reduce((sum,_,i)=> sum + pointsFor(side,i), 0);

const board = document.getElementById('board');
const nameOf = idx => (state.names[idx] || '').trim() || ('Player '+(idx+1));

function buildBoard(){
  board.innerHTML = '';
  NUMS.forEach((n,i)=>{
    const row = document.createElement('div');
    row.className = 'row' + (n==='BULL' ? ' bull' : '');
    row.dataset.row = i;
    row.innerHTML = `
      <div class="cell p1side">
        <input class="hits-input" type="number" min="0" max="${MAX_HITS}" inputmode="numeric" data-side="0" data-i="${i}" value="0" aria-label="Player 1 hits on ${n}">
        <span class="marks" data-marks="0-${i}"></span>
        <span class="pts" data-pts="0-${i}"></span>
      </div>
      <div class="num" data-num="${i}">${n}</div>
      <div class="cell p2side">
        <span class="pts" data-pts="1-${i}"></span>
        <span class="marks" data-marks="1-${i}"></span>
        <input class="hits-input" type="number" min="0" max="${MAX_HITS}" inputmode="numeric" data-side="1" data-i="${i}" value="0" aria-label="Player 2 hits on ${n}">
      </div>
    `;
    board.appendChild(row);
  });
  board.querySelectorAll('.hits-input').forEach(inp=>{
    inp.addEventListener('input', ()=>{
      const side = +inp.dataset.side, i = +inp.dataset.i;
      const v = Math.min(MAX_HITS, Math.max(0, parseInt(inp.value,10) || 0));
      state.hits[side][i] = v;
      refreshNumber(state, i);
      if(String(v) !== inp.value && inp.value !== '') inp.value = v;  // clamp visibly (keep empty field editable)
      save(); update();
    });
    inp.addEventListener('focus', ()=> inp.select());
  });
}

function update(){
  const [H1,H2] = state.hits;
  NUMS.forEach((n,i)=>{
    const h1 = H1[i], h2 = H2[i], f = state.first[i];
    const in1 = board.querySelector(`.hits-input[data-side="0"][data-i="${i}"]`);
    const in2 = board.querySelector(`.hits-input[data-side="1"][data-i="${i}"]`);
    if(document.activeElement !== in1) in1.value = h1;
    if(document.activeElement !== in2) in2.value = h2;

    [[0,h1],[1,h2]].forEach(([side,h])=>{
      const m = board.querySelector(`[data-marks="${side}-${i}"]`);
      m.textContent = marksFor(h);
      m.setAttribute('aria-label', marksLabel(h));
      const isFirst = (f === side);
      m.classList.toggle('first', isFirst);
      m.title = isFirst ? `${nameOf(side)} closed ${n} first` : '';
    });
    const p1 = pointsFor(0,i), p2 = pointsFor(1,i);
    board.querySelector(`[data-pts="0-${i}"]`).textContent = p1 ? '+'+p1 : '';
    board.querySelector(`[data-pts="1-${i}"]`).textContent = p2 ? '+'+p2 : '';

    // number cell: colored to the team that closed it first
    const num = board.querySelector(`[data-num="${i}"]`);
    num.classList.toggle('first-p1', f===0);
    num.classList.toggle('first-p2', f===1);
  });

  const total1 = autoTotal(0) + state.adj[0];
  const total2 = autoTotal(1) + state.adj[1];
  const closed1 = H1.filter(h=>h>=3).length;
  const closed2 = H2.filter(h=>h>=3).length;
  const first1 = state.first.filter(f=>f===0).length;
  const first2 = state.first.filter(f=>f===1).length;

  [[0,total1],[1,total2]].forEach(([side,t])=>{
    const el = document.getElementById('score'+(side+1));
    if(document.activeElement !== el) el.value = t;
    el.classList.toggle('adjusted', state.adj[side] !== 0);
    el.title = state.adj[side] !== 0 ? `Edited by hand (${state.adj[side]>0?'+':''}${state.adj[side]} from automatic)` : 'Tap to edit the score';
  });
  document.getElementById('closed1').textContent = closed1;
  document.getElementById('closed2').textContent = closed2;
  document.getElementById('first1').textContent = '★ ' + first1 + ' first';
  document.getElementById('first2').textContent = '★ ' + first2 + ' first';

  const n1 = nameOf(0), n2 = nameOf(1);
  const statusEl = document.getElementById('status');
  let msg;
  const all1 = closed1===10, all2 = closed2===10;
  if(all1 && all2){
    // both closed everything: higher score wins; if level, whoever closed more numbers first
    if(total1 > total2) msg = n1 + ' wins! 🏆';
    else if(total2 > total1) msg = n2 + ' wins! 🏆';
    else if(first1 > first2) msg = n1 + ' wins! 🏆 (closed more numbers first)';
    else if(first2 > first1) msg = n2 + ' wins! 🏆 (closed more numbers first)';
    else msg = 'Both closed everything — tie!';
  }
  else if(all1 && total1>=total2) msg = n1 + ' wins! 🏆';
  else if(all2 && total2>=total1) msg = n2 + ' wins! 🏆';
  else if(total1>total2) msg = n1 + ' is leading';
  else if(total2>total1) msg = n2 + ' is leading';
  else msg = 'Scores are tied';
  statusEl.textContent = msg;
}

function render(){ buildBoard(); update(); }

// Shrink uploaded logos (384px square) so they stay sharp on the face-off but don't blow the localStorage quota.
function shrinkImage(file, cb){
  const reader = new FileReader();
  reader.onload = ()=>{
    const img = new Image();
    img.onload = ()=>{
      const S = 384, c = document.createElement('canvas');
      c.width = c.height = S;
      const ctx = c.getContext('2d');
      const scale = Math.max(S/img.width, S/img.height);   // cover-crop to a square
      const w = img.width*scale, h = img.height*scale;
      ctx.drawImage(img, (S-w)/2, (S-h)/2, w, h);
      cb(file.type === 'image/png' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = ()=> cb(null);
    img.src = reader.result;
  };
  reader.onerror = ()=> cb(null);
  reader.readAsDataURL(file);
}

function renderLogo(idx){
  const logoEl = document.getElementById('logo'+(idx+1));
  logoEl.textContent = '';
  if(state.logos[idx]){
    const img = document.createElement('img');
    img.src = state.logos[idx];
    img.alt = '';
    logoEl.appendChild(img);
  } else logoEl.append('+');
  // face-off emblem: the same logo, large and half cropped on this player's side
  const face = document.getElementById('face'+(idx+1));
  face.textContent = '';
  face.classList.remove('show');
  if(state.logos[idx]){
    const big = document.createElement('img');
    big.src = state.logos[idx]; big.alt = '';
    face.appendChild(big);
    void face.offsetWidth;            // restart the entrance animation
    face.classList.add('show');
  }
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/png,image/jpeg'; input.id = 'logoInput'+(idx+1);
  input.setAttribute('aria-label', 'Upload logo for player '+(idx+1));
  input.addEventListener('change', ()=>{
    const file = input.files[0];
    if(!file) return;
    shrinkImage(file, url=>{
      if(!url) return;
      state.logos[idx] = url;
      save(); renderLogo(idx);
    });
  });
  logoEl.appendChild(input);
}

// Listeners are attached once; reset only changes values.
[0,1].forEach(idx=>{
  const nameEl = document.getElementById('name'+(idx+1));
  nameEl.addEventListener('input', ()=>{ state.names[idx]=nameEl.value; save(); update(); });
});
// Editable totals: the typed value is stored as an offset from the automatic total.
[0,1].forEach(side=>{
  const el = document.getElementById('score'+(side+1));
  el.addEventListener('input', ()=>{
    if(el.value.trim()==='' || el.value==='-') return;
    const v = Math.round(Number(el.value));
    if(!Number.isFinite(v)) return;
    state.adj[side] = Math.max(-99999, Math.min(99999, v)) - autoTotal(side);
    save(); update();
  });
  el.addEventListener('blur', update);
  el.addEventListener('focus', ()=> el.select());
});
function syncPlayers(){
  [0,1].forEach(idx=>{
    document.getElementById('name'+(idx+1)).value = state.names[idx];
    renderLogo(idx);
  });
}

document.getElementById('newGame').addEventListener('click', ()=>{
  if(!confirm('Start a new game? Hits will be cleared (names and logos are kept).')) return;
  state.hits = blankHits(); state.first = blankFirst(); state.frozen = blankFirst(); state.adj = [0,0];
  save(); render();
});
document.getElementById('resetAll').addEventListener('click', ()=>{
  if(!confirm('Reset everything, including names and logos?')) return;
  state = freshState();
  save(); syncPlayers(); render();
});

syncPlayers();
render();
