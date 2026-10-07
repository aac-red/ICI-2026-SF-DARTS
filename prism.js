(function buildPrismMesh(){
  const svgNS = 'http://www.w3.org/2000/svg';
  const cols = 11, rows = 8, W = 1200, H = 800, jitter = 0.55;
  const cellW = W/cols, cellH = H/rows;
  const pts = [];
  for(let j=0;j<=rows;j++){
    const row = [];
    for(let i=0;i<=cols;i++){
      let x = i*cellW, y = j*cellH;
      if(i>0 && i<cols) x += (Math.random()-0.5)*cellW*jitter;
      if(j>0 && j<rows) y += (Math.random()-0.5)*cellH*jitter;
      row.push({x,y});
    }
    pts.push(row);
  }
  const stops = [
    {t:0.00, h:172}, {t:0.32, h:262}, {t:0.55, h:312}, {t:0.78, h:348}, {t:1.00, h:34}
  ];
  function hueAt(t){
    t = Math.max(0, Math.min(1,t));
    for(let k=0;k<stops.length-1;k++){
      if(t>=stops[k].t && t<=stops[k+1].t){
        const lt = (t-stops[k].t)/(stops[k+1].t-stops[k].t);
        return stops[k].h + (stops[k+1].h-stops[k].h)*lt;
      }
    }
    return stops[stops.length-1].h;
  }
  function colorFor(cx,cy){
    const t = (cx/W)*0.6 + (1-cy/H)*0.4;
    const h = hueAt(t);
    const light = 8 + Math.random()*44;
    const sat = 55 + Math.random()*30;
    return `hsl(${h.toFixed(1)},${sat.toFixed(0)}%,${light.toFixed(0)}%)`;
  }
  const svg = document.createElementNS(svgNS,'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio','none');
  for(let j=0;j<rows;j++){
    for(let i=0;i<cols;i++){
      const TL=pts[j][i], TR=pts[j][i+1], BL=pts[j+1][i], BR=pts[j+1][i+1];
      const flip = Math.random()<0.5;
      const triA = flip ? [TL,TR,BL] : [TL,TR,BR];
      const triB = flip ? [TR,BR,BL] : [TL,BR,BL];
      [triA,triB].forEach(tri=>{
        const cx=(tri[0].x+tri[1].x+tri[2].x)/3, cy=(tri[0].y+tri[1].y+tri[2].y)/3;
        const poly = document.createElementNS(svgNS,'polygon');
        poly.setAttribute('points', tri.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
        poly.setAttribute('fill', colorFor(cx,cy));
        svg.appendChild(poly);
      });
    }
  }
  const container = document.getElementById('prismBg');
  container.appendChild(svg);

  const sparkColors = ['#ffffff','#ffe066','#ffb703','#fca5a5'];
  for(let s=0; s<28; s++){
    const dot = document.createElement('span');
    dot.className = 'sparkle';
    const size = 1.5 + Math.random()*3;
    dot.style.width = size+'px';
    dot.style.height = size+'px';
    dot.style.left = (Math.random()*100)+'%';
    dot.style.top = (Math.random()*100)+'%';
    dot.style.background = sparkColors[Math.floor(Math.random()*sparkColors.length)];
    dot.style.boxShadow = `0 0 ${size*3}px ${size}px currentColor`;
    dot.style.color = dot.style.background;
    dot.style.animationDuration = (2 + Math.random()*3)+'s';
    dot.style.animationDelay = (Math.random()*3)+'s';
    container.appendChild(dot);
  }
})();
