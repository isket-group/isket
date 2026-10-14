(function(){
  var KEY='isket-cookie',bar=document.getElementById('cookie-bar');if(!bar)return;
  function get(){try{return localStorage.getItem(KEY)}catch(e){return null}}
  function set(v){try{localStorage.setItem(KEY,v)}catch(e){}}
  if(!get())bar.hidden=false;
  bar.querySelector('[data-cookie=accept]').addEventListener('click',function(){set('accepted');bar.hidden=true;if(window.isketLoadMetrika)window.isketLoadMetrika()});
  bar.querySelector('[data-cookie=decline]').addEventListener('click',function(){set('declined');bar.hidden=true;if(window.__ymLoaded)location.reload()});
  var s=document.getElementById('cookie-settings');
  if(s)s.addEventListener('click',function(e){e.preventDefault();bar.hidden=false});
})();
