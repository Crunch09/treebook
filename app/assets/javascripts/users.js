$(function() {
  // check for error message
  if($('.alert').text() != "") {
    makeToast($('.alert').text());
  }
  
  // check for player
  if($('#player').length > 0) {
    initMusicPlayer();
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
    
    // STATUS UPDATE
    setInputDefault($('#content input[name="status_update"]'), "Teile deine Gedanken!");
    $('#content input[name="status_update"]').bind('focus', function() {
      if($(this).nextAll('input[name="send_post"]').length == 0) {
        $(this).after('<input type="text" name="treetag[]" value="" class="treetag"/><br /><input type="button" name="send_post" value="Teilen" />');
        
        var jsonTrees = new Array();
        $('#navigation a[name^="tree_"]').each(function() {
          var tree_data = $(this).attr("name").split("_");
          jsonTrees.push({ "id": tree_data[1], "label": tree_data[2], "value": tree_data[2] });
        });
        
        $('input.treetag').tagedit({
          allowEdit: false,
          autocompleteOptions: {
            source: jsonTrees
          },
          texts: { // some texts
            removeLinkTitle: 'Entfernen.',
            saveEditLinkTitle: 'Änderungen speichern.',
            breakEditLinkTitle: 'Abbrechen'
          }
        });
        
        $(this).nextAll('input[name="send_post"]').button();
      }
    });
  }
});
