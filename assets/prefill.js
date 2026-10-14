document.querySelectorAll('[data-service]').forEach(function(button){
      button.addEventListener('click', function(){
        var value = button.getAttribute('data-service');
        try{if(value)sessionStorage.setItem('isket-prefill',value)}catch(e){}
        var select = document.getElementById('service');

        if(!select || !value) return;

        Array.from(select.options).forEach(function(option){
          if(option.value.trim() === value.trim()){
            select.value = option.value || option.text;
          }
        });
      });
    });

    (function(){
      var form=document.getElementById('leadForm'),requestInput=document.getElementById('request_id');
      if(!form||!requestInput)return;
      form.addEventListener('submit',function(){
        if(!requestInput.value)requestInput.value='ISKET-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,8).toUpperCase();
      });
    })();
  
;(function(){
  var select=document.getElementById('service'),value=null;
  try{value=sessionStorage.getItem('isket-prefill')}catch(e){}
  if(!select||!value)return;
  Array.prototype.slice.call(select.options).forEach(function(o){if(o.value.trim()===value.trim())select.value=o.value||o.text});
  try{sessionStorage.removeItem('isket-prefill')}catch(e){}
})();
