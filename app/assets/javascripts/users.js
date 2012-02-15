$(function() {
  // check for error message
  if($('.alert').text() != "") {
    makeToast($('.alert').text());
  }
  
  // check for login layer
  if($('#login_layer').length > 0) {
    // init layer position
    $('#login_layer > div').position({
      of: $('#login_layer > b'),
      my: 'right top',
      at: 'right bottom',
      offset: '0 -1'
    });
    
    // init functionality slide up/down
    $('#login_layer > b').toggle(function() {
      $(this).next('div').slideDown(200);
      
      if($('#signup_layer > div:visible').length > 0)
        $('#signup_layer > b').click();
      $(this).css({
        'borderLeft': '1px solid #666',
        'borderRight': '1px solid #666',
        'textShadow': '#000 0px 0px 6px',
        'backgroundColor': '#FFF',
        'backgroundImage': $('#top_bar').css('backgroundImage')
      });
    }, function() {
      $(this).next('div').slideUp(200);
      $(this).css({
        'borderLeft': '1px solid transparent',
        'borderRight': '1px solid transparent',
        'textShadow': 'none',
        'background': 'transparent'
      });
    });
  }
  
  // check for signup layer
  if($('#signup_layer').length > 0) {
    // init layer position
    $('#signup_layer > div').position({
      of: $('#signup_layer > b'),
      my: 'right top',
      at: 'right bottom',
      offset: '0 -1'
    });
    
    // init functionality slide up/down
    $('#signup_layer > b').toggle(function() {
      $(this).next('div').slideDown(200);
      
      if($('#login_layer > div:visible').length > 0)
        $('#login_layer > b').click();
      $(this).css({
        'borderLeft': '1px solid #666',
        'borderRight': '1px solid #666',
        'textShadow': '#000 0px 0px 6px',
        'backgroundColor': '#FFF',
        'backgroundImage': $('#top_bar').css('backgroundImage')
      });
    }, function() {
      $(this).next('div').slideUp(200);
      $(this).css({
        'borderLeft': '1px solid transparent',
        'borderRight': '1px solid transparent',
        'textShadow': 'none',
        'background': 'transparent'
      });
    });
  }
  
  // user is logged in
  if($('#user_menu').length > 0) {
    // USER MENU
    // init user menu layer position
    $('#user_menu_layer').position({
      of: $('#user_menu > b'),
      my: 'right top',
      at: 'right bottom',
      offset: '0 -1'
    });
    // init user menu
    $('#user_menu > b').toggle(function() {
      $('#user_menu_layer').slideDown(200);
      
      $(this).css({
        'borderLeft': '1px solid #666',
        'borderRight': '1px solid #666',
        'textShadow': '#000 0px 0px 6px',
        'backgroundColor': '#FFF',
        'backgroundImage': $('#top_bar').css('backgroundImage')
      });
    }, function() {
      $(this).next('div').slideUp(200);
      $(this).css({
        'borderLeft': '1px solid transparent',
        'borderRight': '1px solid transparent',
        'textShadow': 'none',
        'background': 'transparent'
      });
    });
    
    show('Startseite');
    
    $('#content input[name="status_update"]').data('origText', $('#content input[name="status_update"]').val());
    // STATUS UPDATE
    $('#content input[name="status_update"]').bind('focus', function() {
      if($(this).val() == $(this).data('origText')) {
        $(this).val("").css({
          'color': '#000000'
        });
      }
    });
    
    $('#content input[name="status_update"]').bind('blur', function() {
      if($(this).val() == '') {
        $(this).val($(this).data('origText')).css({
          'color': '#999999'
        });
      }
    });
  }
});
