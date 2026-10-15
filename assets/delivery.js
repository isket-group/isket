(function(){
 var endpoint='https://script.google.com/macros/s/AKfycby66lxFruVK5vGV_2LhWZNHyz4wVgv-mqA3xrZE59uJMcq8RzjsofvTIJp8lRKa2g9Icg/exec';
 var t=window.isketTranslate||function(text){return text},states=new WeakMap();
 function randomHex(bytes){var a=new Uint8Array(bytes);crypto.getRandomValues(a);return Array.from(a,function(n){return ('0'+n.toString(16)).slice(-2)}).join('')}
 function newCode(){return 'IG-'+randomHex(20).toUpperCase().match(/.{8}/g).join('-')}
 function status(code){
  return new Promise(function(resolve,reject){
   var callback='isketStatus_'+randomHex(8),script=document.createElement('script'),timer;
   function finish(error,data){clearTimeout(timer);script.remove();delete window[callback];error?reject(error):resolve(data)}
   window[callback]=function(data){finish(null,data)};
   script.onerror=function(){finish(Error('Unavailable'))};
   timer=setTimeout(function(){finish(Error('Timeout'))},20000);
   script.referrerPolicy='no-referrer';script.src=endpoint+'?action=status&callback='+callback+'&code='+encodeURIComponent(code);
   document.head.appendChild(script);
  });
 }
 var stages={received:'Заявка получена',review:'Заявка рассматривается',waiting:'Ожидаем уточнений',in_progress:'Заявка в работе',completed:'Обработка заявки завершена'};
 var statusForm=document.getElementById('statusForm'),statusResult=document.getElementById('status-result'),lastStatusText='';
 function showStatus(text){lastStatusText=text;if(statusResult)statusResult.textContent=t(text)}
 if(statusForm)statusForm.addEventListener('submit',async function(e){
  e.preventDefault();if(statusForm.dataset.busy)return;
  var code=document.getElementById('status-code').value.trim().toUpperCase();
  if(!/^IG-(?:[0-9A-F]{8}-){4}[0-9A-F]{8}$|^IG-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)){showStatus('Введите код формата IG-…');return}
  statusForm.dataset.busy='true';var button=statusForm.querySelector('button');button.disabled=true;showStatus('Проверяем статус…');
  try{var result=await status(code);if(!result.ok)throw Error('Unavailable');showStatus(result.found?(stages[result.stage]||stages.review):'Код не найден. Проверьте символы или свяжитесь с нами.')}
  catch(error){showStatus('Проверка временно недоступна. Попробуйте позже или свяжитесь с нами.')}
  finally{delete statusForm.dataset.busy;button.disabled=false}
 });
 document.querySelectorAll('#leadForm,[data-service-form]').forEach(function(form){
  var feedback=document.createElement('div');feedback.className='delivery-feedback';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');feedback.hidden=true;form.appendChild(feedback);
  var state={busy:false,done:false,code:'',text:'',registered:false};states.set(form,state);
  function render(){feedback.hidden=!state.text;feedback.replaceChildren();var p=document.createElement('p');p.textContent=t(state.text);feedback.appendChild(p);
   if(state.registered){var label=document.createElement('label');label.textContent=t('Код для проверки статуса');var input=document.createElement('input');input.readOnly=true;input.value=state.code;input.setAttribute('aria-label',t('Код для проверки статуса'));input.addEventListener('click',function(){input.select()});label.appendChild(input);feedback.appendChild(label)}
  }
  state.render=render;
  form.addEventListener('submit',async function(e){
   e.preventDefault();if(state.busy||state.done)return;
   state.busy=true;var button=form.querySelector('[type=submit]');button.disabled=true;state.text='Отправляем заявку…';render();
   if(!state.code)state.code=newCode();
   var data=new FormData(form);data.set('tracking_code',state.code);data.set('language',document.documentElement.lang);
   var controller=new AbortController(),timer=setTimeout(function(){controller.abort()},20000);
   try{
    var results=await Promise.allSettled([
     fetch(form.action,{method:'POST',body:data,headers:{Accept:'application/json'},signal:controller.signal}),
     fetch(endpoint,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:new URLSearchParams(data).toString(),signal:controller.signal})
    ]);
    clearTimeout(timer);
    var emailDelivered=results[0].status==='fulfilled'&&results[0].value.ok,registered=false;
    try{var receipt=await status(state.code);registered=receipt.ok&&receipt.found}catch(error){}
    if(registered){state.done=true;state.registered=true;state.text='Заявка получена. Сохраните персональный код для проверки статуса.'}
    else if(emailDelivered){state.done=true;state.text='Заявка доставлена по email. Регистрация статуса пока не подтверждена; свяжитесь с нами, если потребуется уточнение.'}
    else state.text='Не удалось подтвердить получение заявки. Данные сохранены в форме; попробуйте отправить снова или свяжитесь с нами.';
   }catch(error){state.text='Не удалось подтвердить получение заявки. Данные сохранены в форме; попробуйте отправить снова или свяжитесь с нами.'}
   finally{clearTimeout(timer);state.busy=false;button.disabled=state.done;render()}
  });
 });
 window.addEventListener('isket-language-change',function(){showStatus(lastStatusText);document.querySelectorAll('#leadForm,[data-service-form]').forEach(function(form){var state=states.get(form);if(state)state.render()})});
})();
