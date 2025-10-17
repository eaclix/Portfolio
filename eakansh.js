// Desktop core: clock, sounds, tray popup, fullscreen, taskbar, dynamic app loader, window manager, drag.

//////////////////////////////////
// Clock
function updateClock(){
  const el = document.getElementById('xpClock');
  if(!el) return;
  const d = new Date(), h=d.getHours(), m=String(d.getMinutes()).padStart(2,'0');
  const ampm = h>=12?'PM':'AM', h12=((h+11)%12)+1;
  el.textContent = `${h12}:${m} ${ampm}`;
}
updateClock(); setInterval(updateClock,30000);

//////////////////////////////////
// Startup sound
const audio = new Audio('Sounds/windows-xp-startup.mp3');
audio.volume = 1.0;
const playMaybe = ()=> audio.play().catch(()=>{});
if (document.readyState === 'complete' || document.readyState === 'interactive') playMaybe();
else document.addEventListener('DOMContentLoaded', playMaybe, { once:true });

//////////////////////////////////
// Tray popup
const infoBtn = document.getElementById('infoIcon');
const popup = document.getElementById('welcomePopup');
function positionPopup(){
  const r = infoBtn.getBoundingClientRect();
  popup.style.left = (r.left + r.width/2) + 'px';
  popup.style.top = (r.top - 10) + 'px';
}
if(infoBtn){
  infoBtn.addEventListener('click', e=>{
    e.stopPropagation(); positionPopup();
    const on = popup.classList.toggle('show');
    popup.setAttribute('aria-hidden', on ? 'false':'true');
  });
  document.addEventListener('click', e=>{
    if(!popup.contains(e.target) && e.target!==infoBtn){
      popup.classList.remove('show'); popup.setAttribute('aria-hidden','true');
    }
  });
  window.addEventListener('resize', ()=>{ if(popup.classList.contains('show')) positionPopup(); });
}

//////////////////////////////////
// Sound toggle
const soundIcon = document.getElementById('soundIcon');
const soundImg = document.getElementById('soundImg');
let isMuted=false;
if(soundIcon){
  soundIcon.addEventListener('click', ()=>{
    isMuted=!isMuted; audio.muted=isMuted;
    soundImg.src = isMuted ? 'Images/sound_off.png' : 'Images/sound_on.png';
    soundImg.alt = isMuted ? 'Sound muted' : 'Sound';
  });
}

//////////////////////////////////
// Fullscreen toggle
const fullIcon = document.getElementById('fullIcon');
const fullImg = document.getElementById('fullImg');
function isFullscreen(){ return document.fullscreenElement||document.webkitFullscreenElement||document.msFullscreenElement; }
function enterFullscreen(){ const el=document.documentElement; (el.requestFullscreen||el.webkitRequestFullscreen||el.msRequestFullscreen).call(el); }
function exitFullscreen(){ (document.exitFullscreen||document.webkitExitFullscreen||document.msExitFullscreen).call(document); }
function updateFullIcon(){
  const fs=!!isFullscreen(); if(!fullImg) return;
  fullImg.src = fs ? 'Images/fullscreen_exit.png' : 'Images/fullscreen.png';
  fullImg.alt = fs ? 'Exit fullscreen' : 'Fullscreen';
}
if(fullIcon){
  fullIcon.addEventListener('click', ()=>{ isFullscreen()?exitFullscreen():enterFullscreen(); });
  document.addEventListener('fullscreenchange', updateFullIcon);
  document.addEventListener('webkitfullscreenchange', updateFullIcon);
  document.addEventListener('msfullscreenchange', updateFullIcon);
}

//////////////////////////////////
// Simple window manager helpers
const taskStrip = document.getElementById('taskButtons');
let zTop = 100;
function focusWindow(win, taskBtn){
  zTop += 1; win.style.zIndex = zTop;
  document.querySelectorAll('.task-btn').forEach(b=>b.classList.remove('active'));
  if(taskBtn) taskBtn.classList.add('active');
}
function attachDrag(win, taskBtn){
  const handle = win.querySelector('.handle');
  if(!handle) return;
  let dragging=false, ox=0, oy=0;
  const start=(e)=>{
    if(win.classList.contains('maximized')) return;
    dragging=true;
    const p=('touches' in e? e.touches[0]:e);
    const rect=win.getBoundingClientRect();
    ox=p.clientX-rect.left; oy=p.clientY-rect.top;
    focusWindow(win, taskBtn);
    e.preventDefault();
  };
  const move=(e)=>{
    if(!dragging) return;
    const p=('touches' in e? e.touches[0]:e);
    let x=p.clientX-ox, y=p.clientY-oy;
    const vw=innerWidth, vh=innerHeight, w=win.offsetWidth, h=win.offsetHeight;
    x=Math.min(Math.max(0,x), vw-w); y=Math.min(Math.max(0,y), vh-h-30);
    win.style.left=x+'px'; win.style.top=y+'px';
  };
  const end=()=> dragging=false;

  handle.addEventListener('mousedown', start);
  addEventListener('mousemove', move);
  addEventListener('mouseup', end);
  handle.addEventListener('touchstart', start, {passive:false});
  addEventListener('touchmove', move, {passive:false});
  addEventListener('touchend', end);
}

//////////////////////////////////
// App: About (lazy loaded)
const openAboutBtn = document.getElementById('openAbout');
const aboutHost = document.getElementById('aboutHost');
let aboutLoaded = false;
let aboutWin = null;
let aboutTaskBtn = null;

async function loadAbout(){
  if(aboutLoaded) return;
  // Load HTML
  const html = await fetch('about.html', {cache:'no-store'}).then(r=>r.text());
  // Create window shell and inject
  const wrapper = document.createElement('div');
  wrapper.className = 'xp-window';
  wrapper.id = 'aboutWin';
  wrapper.innerHTML = html;
  aboutHost.appendChild(wrapper);
  aboutWin = wrapper;

  // Load CSS once
  const cssId = 'about-css-link';
  if(!document.getElementById(cssId)){
    const link=document.createElement('link');
    link.id = cssId;
    link.rel='stylesheet';
    link.href='about.css';
    document.head.appendChild(link);
  }
  // Load JS (module pattern: it will call window.__aboutInit if provided)
  const jsId='about-js';
  if(!document.getElementById(jsId)){
    const s=document.createElement('script');
    s.id=jsId; s.src='about.js'; document.body.appendChild(s);
    // Wait a tick for script to register initializer
    await new Promise(res=> s.onload = res);
  }

  // Initialize after assets are present
  if(typeof window.__aboutInit === 'function'){
    window.__aboutInit({ getWindow:()=>aboutWin, onRequestClose: closeAbout, focusWindow, attachDrag, createTaskBtn });
  }
  aboutLoaded = true;
}

function createTaskBtn(){
  if(aboutTaskBtn) return aboutTaskBtn;
  aboutTaskBtn = document.createElement('button');
  aboutTaskBtn.className='task-btn active';
  aboutTaskBtn.innerHTML = `<img src="Images/explorer.png" alt=""> <span>About Me</span>`;
  taskStrip.appendChild(aboutTaskBtn);
  aboutTaskBtn.addEventListener('click', ()=>{
    if(aboutWin.classList.contains('minimized')){
      aboutWin.classList.remove('minimized'); aboutWin.classList.add('visible');
      focusWindow(aboutWin, aboutTaskBtn);
    }else if(aboutWin.classList.contains('visible')){
      // Minimize if already focused
      aboutWin.classList.add('minimized'); aboutWin.classList.remove('visible');
      aboutTaskBtn.classList.remove('active');
    }else{
      aboutWin.classList.add('visible'); focusWindow(aboutWin, aboutTaskBtn);
    }
  });
  return aboutTaskBtn;
}

function openAbout(){
  createTaskBtn();
  aboutWin.classList.remove('minimized');
  aboutWin.classList.add('visible');
  focusWindow(aboutWin, aboutTaskBtn);
}

function closeAbout(){
  if(!aboutWin) return;
  aboutWin.classList.remove('visible','minimized','maximized');
  aboutWin.setAttribute('aria-hidden','true');
  if(aboutTaskBtn){ aboutTaskBtn.remove(); aboutTaskBtn=null; }
}

if(openAboutBtn){
  openAboutBtn.addEventListener('click', async ()=>{
    if(!aboutLoaded) await loadAbout();
    openAbout();
  });
}
