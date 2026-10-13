(function(){
  var filter='all';
  document.querySelectorAll('[data-format]').forEach(function(button){button.addEventListener('click',function(){filter=button.dataset.format;document.querySelectorAll('[data-format]').forEach(function(b){b.setAttribute('aria-pressed',String(b===button))});document.querySelectorAll('[data-format-row]').forEach(function(row){row.hidden=filter!=='all'&&row.dataset.formatRow!==filter})})});
  document.querySelectorAll('[data-product-choice]').forEach(function(link){link.addEventListener('click',function(){var category=document.getElementById('product-category'),format=document.getElementById('product-format');if(category)category.value=link.dataset.productChoice;if(format&&filter!=='all')format.value=filter==='packed'?'Фасовка':'Вал / на вес'})});
  var lead=document.getElementById('leadForm');
  if(lead)lead.addEventListener('formdata',function(event){var data=event.formData,category=data.get('product_category'),format=data.get('product_format'),message=data.get('message')||'';var context=[];if(category)context.push('Продукция: '+category);if(format)context.push('Формат: '+format);if(context.length)data.set('message',context.join('\n')+'\n\n'+message)});
  // Optional motion never gates the page or its content.
  if(!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target)}})},{threshold:0.12});
  document.querySelectorAll('.catalog-card,.intro-proof,.products-heading,.allin-card').forEach(function(el){observer.observe(el)});
})();
