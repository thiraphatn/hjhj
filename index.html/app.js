// ===================== DATA =====================
// ต้นแบบ/คลิปต้นฉบับทั้งหมด (ธีมและภาพตัวอย่างสร้างขึ้นเองทุกอัน)
const TEMPLATES = [
  { id: 1,  thumb: 'assets/thumb1.jpg',  name: 'HAPPY BIRTHDAY',   author: 'hanhan ✨',      badge: 'Standard', stats: '225.9K', cat: 'follow', anim: 'confetti' },
  { id: 2,  thumb: 'assets/thumb2.jpg',  name: 'ยุค 90 VIBES',      author: 'journeystory',   badge: 'AI',       stats: '23.3K',  cat: 'follow', anim: 'zoom' },
  { id: 3,  thumb: 'assets/thumb3.jpg',  name: 'OUR DAY',           author: 'loveclip',       badge: 'Standard', stats: '18.2K',  cat: 'seed',   anim: 'zoom' },
  { id: 4,  thumb: 'assets/thumb4.jpg',  name: 'I LOVE YOU',        author: 'bestie.edit',    badge: 'Standard', stats: '61.4K',  cat: 'selfie', anim: 'sparkle' },
  { id: 5,  thumb: 'assets/thumb5.jpg',  name: 'Y2K AESTHETIC',     author: 'retro.wave',     badge: 'AI',       stats: '104K',   cat: 'seed',   anim: 'shake' },
  { id: 6,  thumb: 'assets/thumb6.jpg',  name: 'TRAVEL DIARY',      author: 'wanderclip',     badge: 'Standard', stats: '77.5K',  cat: 'follow', anim: 'zoom' },
  { id: 7,  thumb: 'assets/thumb7.jpg',  name: 'GRADUATION 2026',   author: 'gradmoment',     badge: 'New',      stats: '9.8K',   cat: 'seed',   anim: 'confetti' },
  { id: 8,  thumb: 'assets/thumb8.jpg',  name: 'FAMILY TIME',       author: 'homevideo',      badge: 'Standard', stats: '32.1K',  cat: 'follow', anim: 'zoom' },
  { id: 9,  thumb: 'assets/thumb9.jpg',  name: 'MY CUTE PET',       author: 'petdiary',       badge: 'Standard', stats: '48.9K',  cat: 'selfie', anim: 'sparkle' },
  { id: 10, thumb: 'assets/thumb10.jpg', name: 'FOREVER TOGETHER',  author: 'weddingclip',    badge: 'AI',       stats: '15.6K',  cat: 'seed',   anim: 'sparkle' },
  { id: 11, thumb: 'assets/thumb11.jpg', name: 'GYM PROGRESS',      author: 'fit.journey',    badge: 'Trending', stats: '52.3K',  cat: 'follow', anim: 'shake' },
  { id: 12, thumb: 'assets/thumb12.jpg', name: 'FOODIE DIARY',      author: 'tastyclip',      badge: 'Standard', stats: '29.7K',  cat: 'selfie', anim: 'zoom' },
];

let currentTemplate = null;
let layers = [];        // {type:'image'|'text', x,y,w,h,rotation,img,text,color,size}
let selectedLayer = null;
let dragState = null;
let mediaRecorder = null;

// ===================== NAV =====================
const screens = ['home', 'editor', 'ailab', 'projects', 'profile'];
function showScreen(name) {
  screens.forEach(s => document.getElementById('screen-' + s)?.classList.toggle('active', s === name));
  document.querySelectorAll('.nav-item').forEach(btn => {
    const target = btn.dataset.screen === 'editor-blank' ? 'editor' : btn.dataset.screen;
    btn.classList.toggle('active', target === name);
  });
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.screen;
    if (target === 'editor-blank') {
      openEditor(null); // blank canvas
    } else if (target === 'projects') {
      renderProjects();
      showScreen('projects');
    } else {
      showScreen(target);
    }
  });
});

document.getElementById('btnBack').addEventListener('click', () => showScreen('home'));

// chip tabs (cosmetic filter)
document.getElementById('chipTabs').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip || chip.classList.contains('chip-more')) return;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  renderGrid(chip.dataset.cat);
});

document.getElementById('searchInput').addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase();
  const grid = document.getElementById('templateGrid');
  [...grid.children].forEach(card => {
    const name = card.dataset.name.toLowerCase();
    card.style.display = name.includes(q) ? '' : 'none';
  });
});

// ===================== HOME GRID =====================
function renderGrid(cat) {
  const grid = document.getElementById('templateGrid');
  grid.innerHTML = '';
  const list = (!cat || cat === 'reco') ? TEMPLATES : TEMPLATES.filter(t => t.cat === cat);
  const badgeIcon = { 'AI': '🤖', 'New': '🆕', 'Trending': '🔥', 'Standard': '💎' };
  list.forEach(t => {
    const card = document.createElement('div');
    card.className = 'tpl-card';
    card.dataset.name = t.name;
    card.innerHTML = `
      <img src="${t.thumb}" alt="${t.name}" loading="lazy">
      <span class="tpl-badge">${badgeIcon[t.badge] || '💎'} ${t.badge}</span>
      <span class="tpl-stats">✂️ ${t.stats}</span>
    `;
    const meta = document.createElement('div');
    meta.className = 'tpl-meta';
    meta.innerHTML = `<div class="tpl-name">${t.name}</div><div class="tpl-author">🐱 ${t.author}</div>`;
    const wrap = document.createElement('div');
    wrap.appendChild(card);
    wrap.appendChild(meta);
    wrap.addEventListener('click', () => openEditor(t));
    grid.appendChild(wrap);
  });
  if (!list.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">ยังไม่มีแม่แบบในหมวดนี้</div>';
  }
}
renderGrid('reco');

// ===================== EDITOR =====================
const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');

function openEditor(template) {
  currentTemplate = template;
  layers = [];
  selectedLayer = null;
  document.getElementById('editorTitle').textContent = template ? template.name : 'โปรเจกต์ใหม่';
  document.getElementById('exportStatus').textContent = '';

  if (template) {
    const bg = new Image();
    bg.src = template.thumb;
    bg.onload = () => {
      layers.push({ type: 'image', img: bg, x: 0, y: 0, w: canvas.width, h: canvas.height, locked: true });
      drawCanvas();
    };
  } else {
    drawCanvas(); // blank dark canvas
  }
  showScreen('editor');
}

function drawCanvas() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  layers.forEach(layer => {
    ctx.save();
    if (layer.type === 'image') {
      ctx.drawImage(layer.img, layer.x, layer.y, layer.w, layer.h);
    } else if (layer.type === 'text') {
      ctx.font = `800 ${layer.size}px sans-serif`;
      ctx.fillStyle = layer.color;
      ctx.textBaseline = 'top';
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 4;
      ctx.strokeText(layer.text, layer.x, layer.y);
      ctx.fillText(layer.text, layer.x, layer.y);
    }
    if (layer === selectedLayer && !layer.locked) {
      const m = ctx.measureText ? null : null;
      const w = layer.type === 'text' ? ctx.measureText(layer.text).width : layer.w;
      const h = layer.type === 'text' ? layer.size : layer.h;
      ctx.strokeStyle = '#00d6c7';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(layer.x - 4, layer.y - 4, w + 8, h + 8);
      ctx.setLineDash([]);
    }
    ctx.restore();
  });
}

// ---- pointer interaction (drag layers) ----
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  return { x: cx * (canvas.width / rect.width), y: cy * (canvas.height / rect.height) };
}
function hitTest(pos) {
  for (let i = layers.length - 1; i >= 0; i--) {
    const l = layers[i];
    if (l.locked) continue;
    let w = l.w, h = l.h;
    if (l.type === 'text') { w = (l.text.length * l.size * 0.55); h = l.size; }
    if (pos.x >= l.x && pos.x <= l.x + w && pos.y >= l.y && pos.y <= l.y + h) return l;
  }
  return null;
}
function startDrag(e) {
  const pos = getPos(e);
  const hit = hitTest(pos);
  selectedLayer = hit;
  if (hit) dragState = { offX: pos.x - hit.x, offY: pos.y - hit.y };
  drawCanvas();
}
function moveDrag(e) {
  if (!dragState || !selectedLayer) return;
  e.preventDefault();
  const pos = getPos(e);
  selectedLayer.x = pos.x - dragState.offX;
  selectedLayer.y = pos.y - dragState.offY;
  drawCanvas();
}
function endDrag() { dragState = null; }

canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('mousemove', moveDrag);
window.addEventListener('mouseup', endDrag);
canvas.addEventListener('touchstart', startDrag, { passive: true });
canvas.addEventListener('touchmove', moveDrag, { passive: false });
window.addEventListener('touchend', endDrag);

// ---- toolbar actions ----
document.getElementById('photoInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    const w = canvas.width * 0.55;
    const h = w * (img.height / img.width);
    const layer = { type: 'image', img, x: canvas.width * 0.2, y: canvas.height * 0.15, w, h, locked: false };
    layers.push(layer);
    selectedLayer = layer;
    drawCanvas();
    showToast('เพิ่มรูปแล้ว ลากเพื่อจัดตำแหน่ง');
  };
  img.src = URL.createObjectURL(file);
});

document.getElementById('btnAddText').addEventListener('click', () => {
  const panel = document.getElementById('textPanel');
  panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
  if (!selectedLayer || selectedLayer.type !== 'text') {
    const layer = { type: 'text', text: 'ข้อความของฉัน', x: canvas.width * 0.15, y: canvas.height * 0.45, color: '#ffffff', size: 48, locked: false };
    layers.push(layer);
    selectedLayer = layer;
    document.getElementById('textValue').value = layer.text;
  }
  drawCanvas();
});
document.getElementById('textValue').addEventListener('input', e => {
  if (selectedLayer && selectedLayer.type === 'text') { selectedLayer.text = e.target.value || ' '; drawCanvas(); }
});
document.getElementById('textColorPicker').addEventListener('input', e => {
  if (selectedLayer && selectedLayer.type === 'text') { selectedLayer.color = e.target.value; drawCanvas(); }
});
document.getElementById('textSize').addEventListener('input', e => {
  if (selectedLayer && selectedLayer.type === 'text') { selectedLayer.size = +e.target.value; drawCanvas(); }
});

document.getElementById('btnColor').addEventListener('click', () => {
  const colors = ['#ff6b81', '#feca57', '#1dd1a1', '#54a0ff', '#5f27cd', '#111111', '#ffffff'];
  const c = colors[Math.floor(Math.random() * colors.length)];
  if (selectedLayer && selectedLayer.type === 'text') { selectedLayer.color = c; drawCanvas(); }
  else { showToast('เลือกเลเยอร์ข้อความก่อนเปลี่ยนสี'); }
});

document.getElementById('btnSticker').addEventListener('click', () => {
  const emojis = ['✨', '❤️', '🎉', '🌸', '🔥', '⭐️', '🎂'];
  const e = emojis[Math.floor(Math.random() * emojis.length)];
  const layer = { type: 'text', text: e, x: canvas.width * 0.4, y: canvas.height * 0.3, color: '#ffffff', size: 64, locked: false };
  layers.push(layer);
  selectedLayer = layer;
  drawCanvas();
});

document.getElementById('btnDelete').addEventListener('click', () => {
  if (selectedLayer && !selectedLayer.locked) {
    layers = layers.filter(l => l !== selectedLayer);
    selectedLayer = null;
    drawCanvas();
  } else {
    showToast('ไม่มีเลเยอร์ที่เลือกให้ลบ');
  }
});

document.getElementById('btnExportMenu').addEventListener('click', () => {
  showToast('เมนู: บันทึก / ส่งออก อยู่ด้านล่าง');
});

// ===================== EXPORT HELPERS =====================
let lastExportBlob = null;
let lastExportName = '';
let lastExportMime = '';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// sparkle particle system used to make the exported clip look "ปัง"
function makeSparkles(count) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    arr.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 2 + Math.random() * 4,
      speed: 0.3 + Math.random() * 0.9,
      phase: Math.random() * Math.PI * 2,
      emoji: ['✨', '⭐️', '💫'][Math.floor(Math.random() * 3)]
    });
  }
  return arr;
}

// ===================== EXPORT: IMAGE =====================
document.getElementById('btnExportImage').addEventListener('click', () => {
  selectedLayer = null;
  drawCanvas();
  canvas.toBlob(blob => {
    lastExportBlob = blob; lastExportName = `cutclone-${Date.now()}.png`; lastExportMime = 'image/png';
    downloadBlob(blob, lastExportName);
    document.getElementById('exportStatus').textContent = '✅ บันทึกรูปภาพออกนอกแอปแล้ว (ไปที่คลังรูปภาพ/Downloads)';
    showToast('บันทึกรูปภาพสำเร็จ 🖼️');
  }, 'image/png');
});

// ===================== EXPORT: VIDEO (canvas record, flashy) =====================
document.getElementById('btnExportVideo').addEventListener('click', () => {
  if (!window.MediaRecorder) { showToast('อุปกรณ์นี้ไม่รองรับการบันทึกวิดีโอ'); return; }
  const statusEl = document.getElementById('exportStatus');
  selectedLayer = null;

  const stream = canvas.captureStream(30);
  const chunks = [];
  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
  mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });
  mediaRecorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    lastExportBlob = blob; lastExportName = `cutclone-clip-${Date.now()}.webm`; lastExportMime = 'video/webm';
    downloadBlob(blob, lastExportName);
    statusEl.textContent = '✅ ส่งออกคลิปวิดีโอสำเร็จ (.webm) — บันทึกออกนอกแอปแล้ว';
    showToast('ส่งออกคลิป ปัง! 🎉');
  };

  const animStyle = (currentTemplate && currentTemplate.anim) || 'zoom';
  const sparkles = makeSparkles(26);
  const duration = 4200; // 4.2 วินาที: อินโทรแฟลช + เอฟเฟกต์ + เฟรมนิ่งท้ายคลิป
  const introFlash = 220; // ms ของแสงแฟลชตอนเปิดคลิป
  const start = performance.now();
  const baseLayers = layers.map(l => ({ ...l }));

  mediaRecorder.start();
  statusEl.textContent = '⏺ กำลังสร้างคลิป 4 วินาทีแบบมีเอฟเฟกต์...';

  function drawSparkles(t) {
    sparkles.forEach(s => {
      s.y -= s.speed;
      if (s.y < -10) s.y = canvas.height + 10;
      const alpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 6 + s.phase));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `${s.r * 6}px sans-serif`;
      ctx.fillText(s.emoji, s.x, s.y);
      ctx.restore();
    });
  }

  function animate(now) {
    const elapsed = now - start;
    const t = Math.min(1, elapsed / duration);
    layers = baseLayers;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // เอฟเฟกต์เคลื่อนไหวตามสไตล์ของแม่แบบ
    let shakeX = 0, shakeY = 0, zoom = 1, rot = 0;
    if (animStyle === 'zoom') {
      zoom = 1 + 0.10 * Math.sin(t * Math.PI);
    } else if (animStyle === 'shake') {
      zoom = 1.04;
      shakeX = Math.sin(elapsed * 0.05) * 4;
      shakeY = Math.cos(elapsed * 0.07) * 3;
    } else if (animStyle === 'sparkle') {
      zoom = 1 + 0.05 * Math.sin(t * Math.PI * 2);
    } else if (animStyle === 'confetti') {
      zoom = 1 + 0.08 * Math.sin(t * Math.PI);
      rot = Math.sin(elapsed * 0.002) * 0.015;
    }

    ctx.translate(canvas.width / 2 + shakeX, canvas.height / 2 + shakeY);
    ctx.rotate(rot);
    ctx.scale(zoom, zoom);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    drawCanvas();
    if (animStyle === 'sparkle' || animStyle === 'confetti' || t > 0.15) drawSparkles(elapsed / 1000);

    ctx.restore();

    // แฟลชสีขาวตอนเปิดคลิป ให้ความรู้สึก "ปัง"
    if (elapsed < introFlash) {
      ctx.save();
      ctx.globalAlpha = 1 - elapsed / introFlash;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      layers = baseLayers;
      drawCanvas();
      mediaRecorder.stop();
    }
  }
  requestAnimationFrame(animate);
});

// ===================== SHARE OUT OF APP =====================
document.getElementById('btnShare').addEventListener('click', async () => {
  const statusEl = document.getElementById('exportStatus');
  if (!lastExportBlob) {
    showToast('กรุณาส่งออกรูปภาพหรือคลิปก่อนแชร์');
    return;
  }
  const file = new File([lastExportBlob], lastExportName, { type: lastExportMime });
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'CutClone', text: 'ผลงานจาก CutClone ✂️✨' });
      statusEl.textContent = '📤 แชร์ออกไปยังแอปอื่นเรียบร้อย';
    } catch (err) {
      if (err.name !== 'AbortError') showToast('ยกเลิกการแชร์ หรือแชร์ไม่สำเร็จ');
    }
  } else {
    // เบราว์เซอร์ไม่รองรับ Web Share API แบบไฟล์ -> ดาวน์โหลดซ้ำให้แทน
    downloadBlob(lastExportBlob, lastExportName);
    showToast('อุปกรณ์นี้ไม่รองรับแชร์ไฟล์ ระบบดาวน์โหลดไฟล์ให้แทน');
  }
});

// ===================== SAVE PROJECT (localStorage) =====================
document.getElementById('btnSaveProject').addEventListener('click', () => {
  selectedLayer = null;
  drawCanvas();
  const thumb = canvas.toDataURL('image/jpeg', 0.7);
  const projects = JSON.parse(localStorage.getItem('cutclone_projects') || '[]');
  projects.unshift({
    id: Date.now(),
    name: currentTemplate ? currentTemplate.name : 'โปรเจกต์ใหม่',
    thumb,
    date: new Date().toLocaleString('th-TH')
  });
  localStorage.setItem('cutclone_projects', JSON.stringify(projects.slice(0, 30)));
  showToast('บันทึกโปรเจกต์แล้ว 💾');
});

function renderProjects() {
  const list = document.getElementById('projectList');
  const projects = JSON.parse(localStorage.getItem('cutclone_projects') || '[]');
  if (!projects.length) {
    list.innerHTML = '<div class="empty-state">ยังไม่มีโปรเจกต์ที่บันทึกไว้<br>ลองแก้ไขแม่แบบแล้วกด "บันทึกโปรเจกต์"</div>';
    return;
  }
  list.innerHTML = projects.map(p => `
    <div class="project-item" data-id="${p.id}">
      <img src="${p.thumb}">
      <div class="project-info">
        <div class="pname">${p.name}</div>
        <div class="pdate">${p.date}</div>
      </div>
      <div class="project-actions">
        <button class="btnDeleteProject" data-id="${p.id}">🗑️</button>
      </div>
    </div>
  `).join('');
  list.querySelectorAll('.btnDeleteProject').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = +btn.dataset.id;
      const remaining = projects.filter(p => p.id !== id);
      localStorage.setItem('cutclone_projects', JSON.stringify(remaining));
      renderProjects();
    });
  });
}

// ===================== TOAST =====================
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
}

// ===================== PWA SERVICE WORKER =====================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
