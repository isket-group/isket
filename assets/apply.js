(function(){
  var map={contracts:'contracts-dialog',documents:'documents-dialog',legal:'legal-dialog',general:'general-panel'};
  var tabs=Array.prototype.slice.call(document.querySelectorAll('.apply-tabs [data-tab]'));
  if(!tabs.length)return;
  function show(key,push){
    if(!map[key])key='contracts';
    tabs.forEach(function(t){var on=t.dataset.tab===key;t.setAttribute('aria-selected',String(on));t.classList.toggle('on',on)});
    Object.keys(map).forEach(function(k){var el=document.getElementById(map[k]);if(el)el.classList.toggle('active',k===key)});
    if(push){try{history.replaceState(null,'','#'+key)}catch(e){}}
    var sel=document.querySelector('#'+map[key]+' select');
    if(sel)sel.dispatchEvent(new Event('change',{bubbles:true}));
  }
  tabs.forEach(function(t){t.addEventListener('click',function(){show(t.dataset.tab,true)})});
  var key=(location.hash||'').replace('#','');
  if(!map[key]){var s=document.getElementById('service');key=(s&&s.value)?'general':'contracts'}
  show(key,false);
  window.addEventListener('hashchange',function(){var k=(location.hash||'').replace('#','');if(map[k])show(k,false)});
})();
