$(function() {
  $('#login_layer > b').toggle(function() {
    $(this).next('div').slideDown();
    if($('#signup_layer > div:visible').length > 0)
      $('#signup_layer > b').click();
    $(this).css({
      'textShadow': '#000 0px 0px 6px'
    });
  }, function() {
    $(this).next('div').slideUp();
    $(this).css({
      'textShadow': 'none'
    });
  });
  
  $('#signup_layer > b').toggle(function() {
    $(this).next('div').slideDown();
    if($('#login_layer > div:visible').length > 0)
      $('#login_layer > b').click();
    $(this).css({
      'textShadow': '#000 0px 0px 6px'
    });
  }, function() {
    $(this).next('div').slideUp();
    $(this).css({
      'textShadow': 'none'
    });
  });
});
