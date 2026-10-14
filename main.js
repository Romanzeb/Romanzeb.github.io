  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animId = null;

  function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function initParticles(){
    particles = [];
    const count = Math.min(70, Math.floor((canvas.width * canvas.height) / 18000));
    for(let i = 0; i < count; i++){
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4
      });
    }
  }
  initParticles();

  function drawParticles(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(const p of particles){
      p.x += p.vx;
      p.y += p.vy;
      if(p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if(p.y < 0 || p.y > canvas.height) p.vy *= -1;
    }
    for(let i = 0; i < particles.length; i++){
      for(let j = i + 1; j < particles.length; j++){
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < 130){
          ctx.strokeStyle = `rgba(61, 139, 212, ${1 - dist/130})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
      ctx.fillStyle = 'rgba(61, 139, 212, 0.8)';
      ctx.beginPath();
      ctx.arc(particles[i].x, particles[i].y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    animId = requestAnimationFrame(drawParticles);
  }

  function startBgAnimation(opacity){
    canvas.style.opacity = opacity || '0.35';
    if(!animId) drawParticles();
  }
  function stopBgAnimation(){
    canvas.style.opacity = '0';
  }
 
  

  const listEl = document.getElementById('post-list');
  const detailEl = document.getElementById('post-detail');
  const aboutEl = document.getElementById('about');
  const navPosts = document.getElementById('nav-posts');
  const navAbout = document.getElementById('nav-about');
  const backToTop = document.getElementById('back-to-top');

  window.addEventListener('scroll', () => {
    backToTop.style.display = window.scrollY > 400 ? 'flex' : 'none';
  });

  const tagPalette = ['#3d8bd4', '#e2483c', '#2dd4bf', '#f0a020', '#a78bfa', '#4ade80', '#e05a9c', '#eab308'];
  const tagColorOverrides = {
    'crowdstrike': '#e2483c',
    'mitre att&ck': '#a78bfa',
    'siem': '#2dd4bf',
    'yara': '#f0a020',
    'kerberos': '#eab308',
    'active directory': '#e05a9c',
    'red team': '#e2483c',
    'red team operations': '#e2483c',
    'adversary simulation': '#e2483c',
    'penetration testing': '#e2483c',
    'blue team': '#3d8bd4',
    'detection engineering': '#4ade80',
    'network security': '#3d8bd4',
    'threat detection': '#4ade80',
    'incident response': '#f0a020',
    'soc operations': '#3d8bd4',
    'network forensics': '#2dd4bf'
  };
  function tagColor(tag){
    const key = tag.toLowerCase();
    if(tagColorOverrides[key]) return tagColorOverrides[key];
    let hash = 0;
    for(let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return tagPalette[hash % tagPalette.length];
  }

  function tagsHtml(tags){
    if(!tags || !tags.length) return '';
    return `<div class="tags">${tags.map(t => `<span class="tag-badge" style="color:${tagColor(t)}; border-color:${tagColor(t)};">${t}</span>`).join('')}</div>`;
  }

  function renderList(){
    listEl.innerHTML = `
      <div class="list-heading">
        <span class="cmd">EVIDENCE LOG</span>
      </div>
    ` + posts.map((p, i) => `
      <article class="post">
        <div class="case-no">CASE-${String(posts.length - i).padStart(3,'0')}<span class="sev sev-${p.severity}">${p.severity}</span></div>
        <div class="post-meta">${p.date}</div>
        <h2><a href="#${p.id}" onclick="showPost('${p.id}'); return false;">${p.title}</a></h2>
        <p class="excerpt">${p.excerpt}</p>
        ${tagsHtml(p.tags)}
        <a class="read-more" href="#${p.id}" onclick="showPost('${p.id}'); return false;">Devamını oku →</a>
      </article>
    `).join('');
  }

  function showPost(id){
    const p = posts.find(x => x.id === id);
    if(!p) return showList();
    startBgAnimation('0.15');
    listEl.style.display = 'none';
    aboutEl.classList.remove('open');
    detailEl.classList.add('open');
    detailEl.innerHTML = `
      <a class="back-link" href="#" onclick="showList(); return false;">← Tüm Kayıtlar</a>
      <div class="case-no">CASE-${String(posts.findIndex(x=>x.id===id)>=0 ? posts.length - posts.findIndex(x=>x.id===id) : 1).padStart(3,'0')}<span class="sev sev-${p.severity}">${p.severity}</span></div>
      <h1>${p.title}</h1>
      <div class="post-meta">${p.date}</div>
      ${tagsHtml(p.tags)}
      ${p.body}
    `;
    window.scrollTo(0,0);
    history.pushState({view:'post', id}, '', '#' + id);
    navPosts.classList.add('active');
    navAbout.classList.remove('active');
  }

  function showList(){
    startBgAnimation();
    detailEl.classList.remove('open');
    detailEl.innerHTML = '';
    aboutEl.classList.remove('open');
    listEl.style.display = 'block';
    history.pushState({view:'list'}, '', '#');
    navPosts.classList.add('active');
    navAbout.classList.remove('active');
  }

  function showAbout(){
    startBgAnimation();
    listEl.style.display = 'none';
    detailEl.classList.remove('open');
    detailEl.innerHTML = '';
    aboutEl.classList.add('open');
    window.scrollTo(0,0);
    history.pushState({view:'about'}, '', '#hakkimda');
    navAbout.classList.add('active');
    navPosts.classList.remove('active');
  }

  window.addEventListener('popstate', (e) => {
  const hash = location.hash.replace('#','');
  if(hash === 'hakkimda'){
    startBgAnimation();
    listEl.style.display = 'none';
    detailEl.classList.remove('open');
    detailEl.innerHTML = '';
    aboutEl.classList.add('open');
    navAbout.classList.add('active');
    navPosts.classList.remove('active');
  } else if(hash){
    const p = posts.find(x => x.id === hash);
    if(p){
      startBgAnimation('0.15');
      listEl.style.display = 'none';
      aboutEl.classList.remove('open');
      detailEl.classList.add('open');
      detailEl.innerHTML = `
        <a class="back-link" href="#" onclick="showList(); return false;">← tüm kayıtlar</a>
        <div class="case-no">CASE-${String(posts.length - posts.findIndex(x=>x.id===hash)).padStart(3,'0')}<span class="sev sev-${p.severity}">${p.severity}</span></div>
        <h1>${p.title}</h1>
        <div class="post-meta">${p.date}</div>
        ${tagsHtml(p.tags)}
        ${p.body}
      `;
    }
  } else {
    startBgAnimation();
    detailEl.classList.remove('open');
    detailEl.innerHTML = '';
    aboutEl.classList.remove('open');
    listEl.style.display = 'block';
    navPosts.classList.add('active');
    navAbout.classList.remove('active');
  }
});

  renderList();

  
  const initial = location.hash.replace('#','');
  if(initial === 'hakkimda'){
    showAbout();
  } else if(initial){
    const found = posts.find(p => p.id === initial);
    if(found) showPost(initial);
    else startBgAnimation();
  } else {
    startBgAnimation();
  }
