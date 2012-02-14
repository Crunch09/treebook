$(function() {
  $('#login_layer > div').position({
    of: $('#login_layer > b'),
    my: 'right top',
    at: 'right bottom',
    offset: '0 -1'
  });
  $('#signup_layer > div').position({
    of: $('#signup_layer > b'),
    my: 'right top',
    at: 'right bottom',
    offset: '0 -1'
  });
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
});
