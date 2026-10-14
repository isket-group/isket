(function(){
      // Goal IDs must match the JavaScript event goals in counter 113582962.
      // Send only fixed service names/element locations, never contact details.
      function reachGoal(name, params){
        try {
          if(typeof window.ym === 'function'){
            window.ym(113582962, 'reachGoal', name, params || {});
          }
        } catch (error) {
          // Analytics must never interrupt navigation or lead delivery.
        }
      }

      document.querySelectorAll('a[href^="https://wa.me/"]').forEach(function(link){
        link.addEventListener('click', function(){
          reachGoal('whatsapp_click', {
            placement: link.classList.contains('floating-wa') ? 'floating' : 'header'
          });
        });
      });

      document.querySelectorAll('[data-goal="calculate_click"]').forEach(function(link){
        link.addEventListener('click', function(){
          reachGoal('calculate_click', {
            service: link.getAttribute('data-service') || 'general'
          });
        });
      });

      document.querySelectorAll('[data-service]').forEach(function(button){
        button.addEventListener('click', function(){
          reachGoal('service_select', {
            service: button.getAttribute('data-service'),
            source: 'button'
          });
        });
      });

      var select = document.getElementById('service');
      if(select){
        select.addEventListener('change', function(){
          if(select.value){
            reachGoal('service_select', {service: select.value, source: 'form'});
          }
        });
      }

      var form = document.getElementById('leadForm');
      if(form){
        form.addEventListener('submit', function(){
          // Native validation runs before submit. This records submission,
          // not confirmed delivery (the CRM request uses no-cors).
          reachGoal('form_submit', {service: select ? select.value : ''});
        });
      }
    })();
