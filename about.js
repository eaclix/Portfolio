// About window initializer called by the desktop loader after injection.
// ctx: { getWindow, onRequestClose, focusWindow, attachDrag, createTaskBtn }
window.__aboutInit = function(ctx){
  const win = ctx.getWindow();

  // Show and larger default size
  win.classList.add('visible');
  win.style.top = '60px';
  win.style.left = '100px';
  win.style.width = '1120px';
  win.style.height = '720px';
  win.setAttribute('aria-hidden','false');

  // Taskbar button with dark-blue active while focused
  const taskBtn = ctx.createTaskBtn();
  const setStrongActive = (on)=> taskBtn.classList.toggle('active-strong', !!on);
  setStrongActive(true);
  ctx.focusWindow(win, taskBtn);

  // Dragging via titlebar
  ctx.attachDrag(win, taskBtn);

  // Optional demo actions
  const btnProjects = win.querySelector('#openProjects');
  const btnResume   = win.querySelector('#openResume');
  if(btnProjects) btnProjects.addEventListener('click', ()=> alert('Open Projects placeholder'));
  if(btnResume)   btnResume.addEventListener('click', ()=> alert('Open Resume placeholder'));

  // Window controls
  const btnMin = win.querySelector('.btn.min');
  const btnMax = win.querySelector('.btn.max');
  const btnClose = win.querySelector('.btn.close');

  // Minimize
  btnMin.addEventListener('click', ()=>{
    win.classList.add('minimized');
    win.classList.remove('visible');
    taskBtn.classList.remove('active');
    setStrongActive(false);
  });

  // Maximize: dummy press effect (no maximize)
  btnMax.addEventListener('click', ()=>{
    btnMax.classList.add('pressed');
    setTimeout(()=>btnMax.classList.remove('pressed'), 120);
  });

  // Close
  btnClose.addEventListener('click', ()=> ctx.onRequestClose());

  // Sidebar collapse toggles
  win.querySelectorAll('.panel .panel-caret').forEach(caret=>{
    caret.addEventListener('click', ()=> caret.closest('.panel').classList.toggle('collapsed'));
  });

  // Focus on interaction
  win.addEventListener('mousedown', ()=>{
    ctx.focusWindow(win, taskBtn);
    setStrongActive(true);
  });

  // Add resize handles and behavior (only when not maximized)
  addResizeHandles(win);
};

/* ===== Resize logic ===== */
function addResizeHandles(win){
  if(win.__resizersAdded) return;

  // Create handle elements
  ['left','right'].forEach(side=>{
    const d=document.createElement('div'); d.className='resize-h '+side; win.appendChild(d);
  });
  ['top','bottom'].forEach(side=>{
    const d=document.createElement('div'); d.className='resize-v '+side; win.appendChild(d);
  });
  ['nw','ne','sw','se'].forEach(c=>{
    const d=document.createElement('div'); d.className='resize-'+c; win.appendChild(d);
  });
  win.__resizersAdded = true;

  let resizing=false, edge='', startX=0, startY=0, startW=0, startH=0, startL=0, startT=0;
  const minW=720, minH=480;

  function startResize(e, which){
    resizing = !win.classList.contains('maximized');
    if(!resizing) return;
    edge=which;
    const r=win.getBoundingClientRect();
    const pt=('touches' in e? e.touches[0]:e);
    startX=pt.clientX; startY=pt.clientY;
    startW=r.width; startH=r.height; startL=r.left; startT=r.top;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', stop);
    document.addEventListener('touchmove', onMove, {passive:false});
    document.addEventListener('touchend', stop);
    e.preventDefault();
  }

  function onMove(e){
    if(!resizing) return;
    const pt=('touches' in e? e.touches[0]:e);
    const dx=pt.clientX-startX, dy=pt.clientY-startY;
    let w=startW, h=startH, l=startL, t=startT;

    if(edge.includes('right')) w=Math.max(minW, startW+dx);
    if(edge.includes('left'))  { w=Math.max(minW, startW-dx); l=startL+dx; }
    if(edge.includes('bottom')) h=Math.max(minH, startH+dy);
    if(edge.includes('top'))    { h=Math.max(minH, startH-dy); t=startT+dy; }

    const vw=window.innerWidth, vh=window.innerHeight;
    w=Math.min(w, vw-10);
    h=Math.min(h, vh-40);

    win.style.width = w+'px';
    win.style.height = h+'px';
    win.style.left = Math.max(0, Math.min(l, vw-w))+'px';
    win.style.top  = Math.max(0, Math.min(t, vh-h-30))+'px';
  }

  function stop(){
    resizing=false; edge='';
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', stop);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', stop);
  }

  // Bind mouse
  win.querySelector('.resize-h.left').addEventListener('mousedown', e=>startResize(e,'left'));
  win.querySelector('.resize-h.right').addEventListener('mousedown', e=>startResize(e,'right'));
  win.querySelector('.resize-v.top').addEventListener('mousedown', e=>startResize(e,'top'));
  win.querySelector('.resize-v.bottom').addEventListener('mousedown', e=>startResize(e,'bottom'));
  win.querySelector('.resize-nw').addEventListener('mousedown', e=>startResize(e,'left top'));
  win.querySelector('.resize-ne').addEventListener('mousedown', e=>startResize(e,'right top'));
  win.querySelector('.resize-sw').addEventListener('mousedown', e=>startResize(e,'left bottom'));
  win.querySelector('.resize-se').addEventListener('mousedown', e=>startResize(e,'right bottom'));

  // Bind touch
  win.querySelector('.resize-h.left').addEventListener('touchstart', e=>startResize(e,'left'), {passive:false});
  win.querySelector('.resize-h.right').addEventListener('touchstart', e=>startResize(e,'right'), {passive:false});
  win.querySelector('.resize-v.top').addEventListener('touchstart', e=>startResize(e,'top'), {passive:false});
  win.querySelector('.resize-v.bottom').addEventListener('touchstart', e=>startResize(e,'bottom'), {passive:false});
  win.querySelector('.resize-nw').addEventListener('touchstart', e=>startResize(e,'left top'), {passive:false});
  win.querySelector('.resize-ne').addEventListener('touchstart', e=>startResize(e,'right top'), {passive:false});
  win.querySelector('.resize-sw').addEventListener('touchstart', e=>startResize(e,'left bottom'), {passive:false});
  win.querySelector('.resize-se').addEventListener('touchstart', e=>startResize(e,'right bottom'), {passive:false});
}
