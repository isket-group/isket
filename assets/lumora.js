/* İSKET GROUP — живые анимации (Lumora-слой). Никогда не блокирует контент:
   при любой ошибке/отсутствии IntersectionObserver всё показывается, как есть. */
(function(){
  'use strict';
  var html=document.documentElement;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch=window.matchMedia&&matchMedia('(hover: none)').matches;
  function $(s,r){return (r||document).querySelector(s)}
  function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}

  if(reduce||!('IntersectionObserver' in window)){html.classList.remove('loading','mo');html.classList.add('ready');return}
  html.classList.add('mo');

  /* ---------- Готовность: после заставки ---------- */
  var ready=false,cbs=[];
  function setReady(){if(ready)return;ready=true;html.classList.add('ready');cbs.splice(0).forEach(function(f){try{f()}catch(e){}})}
  function whenReady(f){ready?f():cbs.push(f)}
  // страховка: что бы ни случилось, через 4,5 с показываем всё
  setTimeout(function(){html.classList.remove('loading');setReady();$$('.mv,.mh,.mv-line').forEach(function(e){e.classList.add('in')})},4500);

  /* ---------- Плавный скролл (Lenis) ---------- */
  var lenis=null;
  function initLenis(){
    if(!window.Lenis||touch)return;
    try{
      lenis=new Lenis({smoothWheel:true,lerp:.09,anchors:{offset:-86}});
      (function raf(t){lenis.raf(t);requestAnimationFrame(raf)})(0);
      $$('dialog').forEach(function(d){d.setAttribute('data-lenis-prevent','')});
      $$('dialog').forEach(function(d){
        new MutationObserver(function(){d.open?lenis.stop():lenis.start()}).observe(d,{attributes:true,attributeFilter:['open']});
      });
    }catch(e){lenis=null}
  }
  if(window.Lenis)initLenis();else addEventListener('load',initLenis);

  /* ---------- Заставка ---------- */
  var L=$('#loader');
  if(L&&html.classList.contains('loading')){
    var fill=$('#ldFill'),num=$('#ldNum'),FILL=1500,t0=null;
    function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
    (function step(ts){if(t0===null)t0=ts;var t=Math.min((ts-t0)/FILL,1),p=Math.round(ease(t)*100);
      if(fill)fill.style.width=p+'%';if(num)num.textContent=('00'+p).slice(-3);
      if(t<1)requestAnimationFrame(step);
      else setTimeout(function(){L.classList.add('out');setTimeout(function(){html.classList.remove('loading');setReady();setTimeout(function(){L.remove()},900)},520)},160)})(performance.now());
  }else{if(L)L.remove();html.classList.remove('loading');requestAnimationFrame(setReady)}

  /* ---------- Прогресс-бар и шапка ---------- */
  var bar=document.createElement('div');bar.id='scroll-progress';document.body.appendChild(bar);
  var hdr=$('header'),lastY=0;
  function onScroll(){
    var y=window.pageYOffset||html.scrollTop,h=html.scrollHeight-innerHeight;
    bar.style.transform='scaleX('+(h>0?clamp(y/h,0,1):0)+')';
    if(hdr){hdr.classList.toggle('scrolled',y>20);
      var menuOpen=hdr.querySelector('.menu-toggle[aria-expanded="true"]');
      hdr.classList.toggle('hide',y>420&&y>lastY+4&&!menuOpen);if(y<lastY-4||y<420)hdr.classList.remove('hide')}
    lastY=y;
    parallax(y);
  }
  addEventListener('scroll',onScroll,{passive:true});

  /* ---------- Параллакс героя ---------- */
  var heroVis=$('.hero-visual'),heroSec=$('.editorial-hero');
  function parallax(y){if(!heroVis||!heroSec)return;var hh=heroSec.offsetHeight;if(y>hh+200)return;heroVis.style.transform='translate3d(0,'+(y*0.12).toFixed(1)+'px,0)'}

  /* ---------- Цвет под курсором (hero + каталог) ---------- */
  function Reveal(box,img,opt){
    opt=opt||{};
    var top=img.cloneNode(false);top.removeAttribute('id');top.removeAttribute('loading');top.alt='';top.setAttribute('aria-hidden','true');top.className='rv-top';
    img.classList.add('rv-base');img.parentNode.insertBefore(top,img.nextSibling);
    var tx=0,ty=0,cx=0,cy=0,tr=0,cr=0,raf=0,bounds=null,maxR=opt.r||150,idle=false,ph=0,last=0;
    function rect(){return (opt.rectEl||img).getBoundingClientRect()}
    function loop(ts){
      raf=0;
      if(idle){ph+=0.011;var b=rect();tx=b.width*(.58+.28*Math.sin(ph*1.3));ty=b.height*(.48+.30*Math.cos(ph*.9));tr=maxR*.62}
      cx+=(tx-cx)*.16;cy+=(ty-cy)*.16;cr+=(tr-cr)*(tr>cr?.12:.07);
      top.style.setProperty('--mx',cx.toFixed(1)+'px');top.style.setProperty('--my',cy.toFixed(1)+'px');top.style.setProperty('--r',cr.toFixed(1)+'px');
      if(idle||Math.abs(tx-cx)>.4||Math.abs(ty-cy)>.4||Math.abs(tr-cr)>.4)raf=requestAnimationFrame(loop)
    }
    function kick(){if(!raf)raf=requestAnimationFrame(loop)}
    function move(e){
      var b=rect(),x=e.clientX-b.left,y=e.clientY-b.top;
      if(opt.rectEl&&opt.rectEl!==img){}
      var sp=Math.hypot(x-tx,y-ty);tx=x;ty=y;tr=clamp(maxR*.7+sp*1.4,maxR*.7,maxR*1.5);idle=false;
      if(!cr){cx=x;cy=y}kick()}
    function leave(){tr=0;kick();if(opt.idle)setTimeout(function(){if(!tr)startIdle()},1800)}
    function startIdle(){idle=true;kick()}
    function sweep(){
      var b=rect(),t0=performance.now(),D=2200;
      (function s(now){var t=clamp((now-t0)/D,0,1);
        tx=b.width*(.1+.8*t);ty=b.height*(.5+.22*Math.sin(t*6.2));tr=maxR*Math.sin(Math.PI*t)*1.1;
        if(!cr&&t<.05){cx=tx;cy=ty}kick();if(t<1)requestAnimationFrame(s);else{tr=0;kick()}})(t0)}
    var target=opt.eventEl||box;
    if(!touch){target.addEventListener('pointermove',move);target.addEventListener('pointerleave',leave)}
    return {sweep:sweep,idle:startIdle}
  }
  var heroImg=$('.hero-visual>img');
  if(heroImg){
    var hr=Reveal(heroSec,heroImg,{r:190,idle:true,eventEl:heroSec});
    whenReady(function(){setTimeout(function(){touch?hr.sweep():hr.idle()},900)});
    if(touch){heroSec.addEventListener('pointerdown',function(){hr.sweep()})}
  }
  $$('.cat-photo').forEach(function(ph){
    var im=ph.querySelector('img');if(!im)return;
    var card=ph.closest('.cat-card')||ph;
    var h=document.createElement('span');h.className='hint';h.textContent=touch?'Коснитесь':'Наведите курсор';h.setAttribute('aria-hidden','true');ph.appendChild(h);
    var r=Reveal(ph,im,{r:touch?110:140,eventEl:ph});
    if(touch){
      var done=false;new IntersectionObserver(function(es,o){if(es[0].isIntersecting&&!done){done=true;setTimeout(r.sweep,400);o.disconnect()}},{threshold:.6}).observe(ph);
      ph.addEventListener('pointerdown',function(){card.classList.add('touched');r.sweep()})
    }
  });

  /* ---------- Появление блоков по скроллу ---------- */
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    if(!e.isIntersecting)return;io.unobserve(e.target);var t=e.target;
    t.classList.add('in');
    if(t.hasAttribute('data-count'))countUp(t)})},{threshold:.05,rootMargin:'0px 0px -6% 0px'});
  function reg(el,delay){if(el.classList.contains('mv'))return;el.classList.add('mv');if(delay)el.style.setProperty('--d',delay+'ms');io.observe(el)}
  function regHead(el,delay){el.classList.add('mh');if(delay)el.style.setProperty('--d',delay+'ms');io.observe(el)}
  // заголовки
  $$('main .section h2, main .editorial-intro h2').forEach(function(h){regHead(h,60)});
  // прямые потомки .wrap секций, кроме героя
  $$('main section:not(.editorial-hero) > .wrap > *').forEach(function(el){
    if(el.matches('h2'))return;reg(el,0)});
  // сетки — каскад
  [['.cat-grid>*',120],['#services .services>*',110],['.intro-proof>*',130],['.allin-grid>*',140],['.retail-band .wrap>*',90],['.contact-grid>*',140]].forEach(function(p){
    $$(p[0]).forEach(function(el,i){reg(el,i*p[1])})});
  $$('.section-head,.products-heading').forEach(function(el){reg(el,0)});
  // линии-разделители
  $$('.intro-proof,.format-toolbar,.product-note').forEach(function(el){});
  if(!$$('.mv').length&&!$$('.mh').length)html.classList.remove('mo');

  /* ---------- Счётчики ---------- */
  $$('.intro-proof strong').forEach(function(s){s.setAttribute('data-count','1');io.observe(s)});
  function countUp(el){
    var orig=el.textContent,m=orig.match(/^(\D*)(\d+)(.*)$/);if(!m)return;
    var pre=m[1],n=parseInt(m[2],10),post=m[3],t0=performance.now(),D=1400;
    (function s(now){var t=clamp((now-t0)/D,0,1),v=Math.round(n*(1-Math.pow(1-t,3)));
      if(t<1){el.textContent=pre+v+post;requestAnimationFrame(s)}else{
        // если за время анимации язык сменили — не затираем перевод
        if(el.textContent.indexOf(String(v))!==-1||el.textContent===pre+v+post)el.textContent=orig}})(t0)}

  /* ---------- Бегущая строка ---------- */
  var names=$('.retail-names');
  if(names&&!names.querySelector('.retail-track')){
    var track=document.createElement('div');track.className='retail-track';
    while(names.firstChild)track.appendChild(names.firstChild);
    var c2=track.cloneNode(true);c2.setAttribute('aria-hidden','true');
    // повторяем содержимое, чтобы строка закрывала широкие экраны
    var c3=track.cloneNode(true);c3.setAttribute('aria-hidden','true');
    names.appendChild(track);names.appendChild(c2);names.appendChild(c3);
  }

  /* ---------- Магнитные кнопки ---------- */
  if(!touch){
    $$('.btn-primary,.header-cta').forEach(function(b){
      b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;
        b.style.transform='translate('+(x*.18).toFixed(1)+'px,'+(y*.28).toFixed(1)+'px)'});
      b.addEventListener('pointerleave',function(){b.style.transform=''})});
  }

  /* ---------- Наклон карточек каталога ---------- */
  if(!touch){
    $$('.cat-card').forEach(function(c){
      c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect(),px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;
        c.style.transform='perspective(1100px) rotateY('+(px*5).toFixed(2)+'deg) rotateX('+(-py*4).toFixed(2)+'deg) translateY(-4px)'});
      c.addEventListener('pointerleave',function(){c.style.transform=''})});
  }

  /* ---------- Тёплый блик за курсором ---------- */
  if(!touch){
    var glow=document.createElement('div');glow.id='cursor-glow';document.body.appendChild(glow);
    var gx=0,gy=0,tgx=0,tgy=0,gr=0;
    addEventListener('pointermove',function(e){tgx=e.clientX;tgy=e.clientY;glow.classList.add('on');if(!gr)gr=requestAnimationFrame(gl)},{passive:true});
    document.addEventListener('pointerleave',function(){glow.classList.remove('on')});
    function gl(){gr=0;gx+=(tgx-gx)*.12;gy+=(tgy-gy)*.12;glow.style.transform='translate3d('+gx.toFixed(1)+'px,'+gy.toFixed(1)+'px,0)';
      if(Math.abs(tgx-gx)>.5||Math.abs(tgy-gy)>.5)gr=requestAnimationFrame(gl)}
  }

  /* ---------- Подсветка пункта меню ---------- */
  var links=$$('.nav-links a[href^="#"]');
  links.forEach(function(a){var sec=$(a.getAttribute('href'));if(!sec)return;
    new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)links.forEach(function(l){l.classList.toggle('active',l===a)})})},{rootMargin:'-40% 0px -55% 0px'}).observe(sec)});

  onScroll();
})();
