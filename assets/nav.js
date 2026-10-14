(function(){
  var header=document.querySelector('header'),button=document.querySelector('.menu-toggle'),nav=document.querySelector('.nav-links');
  function label(){var lang=document.documentElement.lang;var opened=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-label',lang==='tr'?(opened?'Menüyü kapat':'Menüyü aç'):lang==='en'?(opened?'Close menu':'Open menu'):(opened?'Закрыть меню':'Открыть меню'));}
  function setOpen(open){header.classList.toggle('menu-open',open);button.setAttribute('aria-expanded',String(open));label();}
  button.addEventListener('click',function(){setOpen(button.getAttribute('aria-expanded')!=='true');});
  nav.addEventListener('click',function(event){if(event.target.closest('a'))setOpen(false);});
  document.addEventListener('click',function(event){if(!header.contains(event.target))setOpen(false);});
  document.addEventListener('keydown',function(event){if(event.key==='Escape'&&button.getAttribute('aria-expanded')==='true'){setOpen(false);button.focus();}});
  window.addEventListener('resize',function(){if(window.innerWidth>980)setOpen(false);});
  window.addEventListener('isket-language-change',label);label();
})();
