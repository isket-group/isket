(function(){
 var $=function(id){return document.getElementById(id)};
 var t=window.isketTranslate||function(text){return text};
 var money=function(n,c){return n.toLocaleString('ru-RU')+(c==='USD'?' $':' ₽')};
 function quote(network,supplier,role,age,code){
   var bases={'ТСЧ Чижик':500000,'ТСХ Перекресток':600000,'ДСК Пятерочка':750000,MAGNIT:500000,'Все три сети':1650000,TANDER_DIRECT:600000,ARVIAY_DIRECT:4000,ARVIAY_TECH:3500};
   if(!bases[network])return null;
   var usd=network.indexOf('ARVIAY_')===0;
   var importMode=usd||network==='TANDER_DIRECT';
   var extras=importMode?0:(supplier==='Недействующий поставщик'?200000:0)+(role==='Как производитель'?200000:0)+(age==='Менее 1 года'?100000:0);
   var discount=code.trim().toUpperCase()==='ISKET5'?.05:0;
   return {base:bases[network],extras:extras,currency:usd?'USD':'RUB',total:Math.round((bases[network]+extras)*(1-discount)*100)/100,discount:discount};
 }
 function promoStatus(prefix){
   var code=$(prefix+'-promo').value.trim(),valid=code.toUpperCase()==='ISKET5';
   $(prefix+'-promo-status').textContent=t(code?(valid?'Промокод применён: скидка 5%.':'Промокод не найден. Расчёт без скидки.'):'');
   return valid;
 }
 function custom(select,block,input){
   var show=$(select).value==='Другая сеть'||$(select).value==='Свой вариант';
   $(block).style.display=show?'block':'none';$(input).required=show;$(input).disabled=!show;
 }

 var fxRate=null,fxUnavailable=false,fxCached=false;
 var FX_KEY='isket-cbr-usd-v1',FX_TTL=6*60*60*1000;
 function moscowDay(date){
   var parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
   var values={};parts.forEach(function(p){values[p.type]=p.value});return values.year+'-'+values.month+'-'+values.day;
 }
 function validRate(rate){
   return rate&&Number.isFinite(rate.value)&&rate.value>0&&rate.value<1000000&&/^\d{4}-\d{2}-\d{2}$/.test(rate.day)&&rate.day<=moscowDay(new Date());
 }
 function readRate(data){
   var usd=data&&data.Valute&&data.Valute.USD;
   if(!usd||!Number.isFinite(Number(usd.Nominal))||Number(usd.Nominal)<=0)throw Error('Invalid rate');
   var date=new Date(data.Date);if(!Number.isFinite(date.getTime()))throw Error('Invalid date');
   var day=moscowDay(date),value=Number(usd.Value)/Number(usd.Nominal);
   if(day>moscowDay(new Date())){
     date=new Date(data.PreviousDate);if(!Number.isFinite(date.getTime()))throw Error('Invalid previous date');
     day=moscowDay(date);value=Number(usd.Previous)/Number(usd.Nominal);
   }
   var rate={value:value,day:day};if(!validRate(rate))throw Error('Invalid effective rate');return rate;
 }
 function formatRateDay(day){var p=day.split('-');return p[2]+'.'+p[1]+'.'+p[0]}
 function renderFx(q){
   var price=$('contracts-rub'),info=$('currency-rate-info'),range=$('import-rub-range');
   var usd=q&&q.currency==='USD';price.hidden=!usd;info.hidden=!usd;
   if(!fxRate){
     var status=fxUnavailable?'Рублёвый эквивалент временно недоступен.':'Загружаем курс ЦБ РФ…';
     range.textContent=t(status);if(usd){price.textContent=t(status);info.textContent=t('Стоимость услуги указана в долларах США.')}return;
   }
   var rub=function(amount){return Math.round(amount*fxRate.value).toLocaleString('ru-RU')+' ₽'};
   var rateLabel=(fxCached?'Последний загруженный курс ЦБ РФ':'Курс ЦБ РФ')+' на '+formatRateDay(fxRate.day)+': 1 $ = '+fxRate.value.toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:4})+' ₽.';
   range.textContent=t('≈ '+rub(3500)+'–'+rub(4000)+' · на '+formatRateDay(fxRate.day)+(fxCached?' · сохранённый курс':''));
   if(usd){price.textContent=t('≈ '+rub(q.total));info.textContent=t(rateLabel+' Справочный пересчёт; условия оплаты согласуем в договоре.')}
 }
 async function refreshRate(){
   if(document.hidden)return;
   var saved=null;try{saved=JSON.parse(localStorage.getItem(FX_KEY)||'null')}catch(error){}
   if(saved&&validRate(saved.rate)){
     fxRate=saved.rate;fxCached=true;update();
     if(saved.checkedDay===moscowDay(new Date())&&Number.isFinite(saved.checkedAt)&&saved.checkedAt<=Date.now()&&Date.now()-saved.checkedAt<FX_TTL){fxCached=false;update();return}
   }
   var controller=new AbortController(),timeout=setTimeout(function(){controller.abort()},10000);
   try{
     var response=await fetch('https://www.cbr-xml-daily.ru/daily_json.js',{signal:controller.signal,cache:'no-cache'});
     if(!response.ok)throw Error('Rate source unavailable');
     fxRate=readRate(await response.json());fxUnavailable=false;fxCached=false;
     try{localStorage.setItem(FX_KEY,JSON.stringify({rate:fxRate,checkedDay:moscowDay(new Date()),checkedAt:Date.now()}))}catch(error){}
   }catch(error){fxUnavailable=true;fxCached=!!fxRate}
   finally{clearTimeout(timeout);update()}
 }
 function update(){
   var network=$('retailTarget').value,usd=network.indexOf('ARVIAY_')===0,importMode=usd||network==='TANDER_DIRECT';
   $('contract-role-block').hidden=importMode;$('entryRole').disabled=importMode;
   $('contract-import-info').hidden=!importMode;
   ['contract_product','contract_country'].forEach(function(id){$(id).disabled=!importMode;$(id).required=importMode});
   $('supplierCategory').options[2].textContent=t(importMode?'2.2 Недействующий поставщик':'2.2 Недействующий поставщик (+200 000 ₽)');
   $('companyAge').options[2].textContent=t(importMode?'Менее 1 года':'Менее 1 года (+100 000 ₽ к стоимости)');
   var q=quote(network,$('supplierCategory').value,$('entryRole').value,$('companyAge').value,$('contracts-promo').value);
   var complete=q&&(importMode||($('supplierCategory').value&&$('companyAge').value));
   $('contracts-total').textContent=t(q?(q.currency==='RUB'?'от ':'')+money(q.total,q.currency):'Выберите направление');
   $('contracts-breakdown').textContent=t(q?'Базовая стоимость: '+money(q.base,q.currency)+(q.extras?' · Дополнительные условия: '+money(q.extras,q.currency):'')+(q.discount?' · Скидка: 5%':'')+(!complete?' · Заполните остальные параметры для полного расчёта.':''):'');
   $('hiddenPrice').value=q?$('contracts-total').textContent:'';
   renderFx(q);
   promoStatus('contracts');
   var docsDiscount=promoStatus('documents');
   $('documents-total').textContent=t(money(docsDiscount?237500:250000,'RUB'));$('docsPrice').value=$('documents-total').textContent;
   custom('targetNetworkSelect','customNetworkBlock','custom_network_name');
   custom('retailNetworkSelect','customRetailBlock','custom_retail_name');
 }
 document.querySelectorAll('[data-open-service]').forEach(function(b){
   b.addEventListener('click',function(){
     var kind=b.dataset.openService;
     var prefix={contracts:'contract',documents:'docs',legal:'order'}[kind];
     if(prefix){
       ['name','email'].forEach(function(field){var target=$(prefix+'_'+field);var src=$(field);if(!target.value&&src)target.value=src.value});
       var phone=$(prefix+'_client_phone');var ps=$('phone');if(!phone.value&&ps)phone.value=ps.value;
       var company=$(prefix+'_company_name');var cs=$('company');if(!company.value&&cs)company.value=cs.value;
     }
     update();$(kind+'-dialog').showModal();
     if(typeof ym==='function')ym(113582962,'reachGoal','service_select',{service:kind,source:'details'});
   });
 });
 document.querySelectorAll('.service-dialog').forEach(function(d){
   d.querySelector('[data-close-dialog]').addEventListener('click',function(){d.close()});
   d.addEventListener('click',function(e){if(e.target===d){var r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}});
   d.querySelectorAll('input,select').forEach(function(el){el.addEventListener('input',update);el.addEventListener('change',update)});
 });
 $('docs_creation_year').max=String(new Date().getFullYear());
 var mc=document.querySelector('[data-management-contact]');if(mc)mc.addEventListener('click',function(){$('service').value='KAM и специалисты';$('management-dialog').close();location.hash='contact';$('name').focus()});
 var serviceForNetwork={'ТСЧ Чижик':'Выход в Чижик','ТСХ Перекресток':'Выход в Перекрёсток','ДСК Пятерочка':'Выход в Пятёрочку',MAGNIT:'Выход в Магнит / АО «Тандер»','Все три сети':'Выход во все три сети',TANDER_DIRECT:'АО «Тандер» — прямой импорт',ARVIAY_DIRECT:'АО «АРВИАЙ» — прямой импорт',ARVIAY_TECH:'АО «АРВИАЙ» — технический импорт'};
 var crm='https://script.google.com/macros/s/AKfycby66lxFruVK5vGV_2LhWZNHyz4wVgv-mqA3xrZE59uJMcq8RzjsofvTIJp8lRKa2g9Icg/exec';
 document.querySelectorAll('[data-service-form]').forEach(function(form){
   form.addEventListener('submit',function(){
     update();
     var kind=form.dataset.serviceForm,summary,service;
     var selected=function(id){return $(id).value};
     if(kind==='contract'){
       service=serviceForNetwork[$('retailTarget').value];
       summary='Направление: '+service+'; статус: '+selected('supplierCategory')+'; компания: '+selected('companyCategory')+'; возраст: '+selected('companyAge')+'; регион: '+$('contract_sales_region').value+'. ';
       if($('retailTarget').value.indexOf('ARVIAY_')===0||$('retailTarget').value==='TANDER_DIRECT')summary+='Продукция: '+$('contract_product').value+'; страна поставки: '+$('contract_country').value+'. ';
       else summary+='Выход: '+selected('entryRole')+'. ';
       summary+='Ориентировочная стоимость: '+$('contracts-total').textContent+($('contracts-promo').value.trim().toUpperCase()==='ISKET5'?' (ISKET5, скидка 5%)':'')+'.';
       if($('retailTarget').value.indexOf('ARVIAY_')===0&&fxRate)summary+=' Справочный эквивалент: '+$('contracts-rub').textContent+'. '+$('currency-rate-info').textContent;
       form.querySelector('[name=form_type]').value='Заявка: '+service;
     }else if(kind==='docs'){
       service='Документы производителя';summary='Документы: '+($('targetNetworkSelect').value==='Другая сеть'?$('custom_network_name').value:selected('targetNetworkSelect'))+'; статус поставщика: '+selected('docs_supplier_status')+'; год создания: '+$('docs_creation_year').value+'. Стоимость: '+$('documents-total').textContent+(promoStatus('documents')?' (ISKET5, скидка 5%)':'')+'.';
     }else{
       service='Штрафы и претензии';summary='Заказ / претензия: '+$('order_number').value+'; дата: '+$('order_date').value+'; процедура: '+selected('order_operation')+'; SAP: '+$('sap_company_number').value+'; сеть: '+($('retailNetworkSelect').value==='Свой вариант'?$('custom_retail_name').value:selected('retailNetworkSelect'))+'. Суть вопроса: '+$('order_comments').value;
     }
     form.querySelector('[name=service]').value=service;
     form.querySelector('[name=company]').value=$(kind+'_company_name').value;
     form.querySelector('[name=phone]').value=$(kind+'_client_phone').value;
     form.querySelector('[name=message]').value=summary;
     // Standard names keep the same CRM mapping as the main contact form.
     var name=$(kind+'_name'),email=$(kind+'_email');name.name='name';email.name='email';
     if(!form.querySelector('[name=request_id]').value)form.querySelector('[name=request_id]').value='ISKET-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,8).toUpperCase();

     if(typeof ym==='function')ym(113582962,'reachGoal','form_submit',{service:service});
   });
 });
 window.addEventListener('isket-language-change',update);
 update();
 refreshRate();
 setInterval(refreshRate,60*60*1000);
 document.addEventListener('visibilitychange',function(){if(!document.hidden)refreshRate()});
})();
