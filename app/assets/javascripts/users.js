$(function() {
  // check for error message
  if($('.alert').text() != "") {
    makeToast($('.alert').text());
  }
  
  // check for login layer
  if($('#login_layer').length > 0) {
    // init login layer position
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
    
    // show selectable trees and post-button on focus
    $('#content input[name="status_update"]').bind('focus', function() {
      if($(this).nextAll('input[name="send_post"]').length == 0) {
        $(this).after('<input type="button" name="send_post" value="Teilen" /><input type="text" name="treetag" value="|all" class="treetag"/><ul class="status_trees"><li>Alle</li></ul>');
        
        // collect users trees
        var jsonTrees = new Array();
        $('#navigation a[name^="tree_"]').each(function() {
          var tree_data = $(this).attr("name").split("_");
          jsonTrees.push({ "id": tree_data[1], "label": tree_data[2], "value": tree_data[2] });
        });
        
        $('.status_trees').after('<input type="text" name="status_trees_input" />');
        $('input[name="status_trees_input"]').autocomplete({
          autoFocus: true,
          minLength: 0,
          source: jsonTrees,
          select: function(event, ui) {
            $('.status_trees').append('<li>'+ui.item.label+'</li>');
            if(ui.item.id != "all") {
              $('input[name="treetag"]').val($('input[name="treetag"]').val().split("|all").join(""));
              $('.status_trees li:contains("Alle")').remove();
            } else {
              $('input[name="treetag"]').val("");
              $('.status_trees li:not(:contains("Alle"))').remove();
            }
            $('input[name="treetag"]').val($('input[name="treetag"]').val()+"|"+ui.item.id);
            $('input[name="status_trees_input"]').val("");
          },
          close: function(event, ui) {
            $('input[name="status_trees_input"]').val("");
            var selected = $('input[name="treetag"]').val().substr(1).split("|");
            var newSource = new Array();
            for(var i = 0; i < jsonTrees.length; i++) {
              if(!arrayHas(selected, jsonTrees[i].id)) {
                newSource.push(jsonTrees[i]);
              }
            }
            if(newSource.length > 0) {
              $(this).autocomplete("option", "source", newSource);
            } else {
              $(this).hide();
            }
          }
        }).bind('focus', function() {
          var e = jQuery.Event("keydown", { keyCode: 40 });
          $(this).trigger(e);
        });
        
        jsonTrees.push({"id": "all", "label": "Alle", "value": "Alle"});
        
        $(this).nextAll('input[name="send_post"]').button().click(function() {
          var chosenTrees = $('input[name="treetag"]').val().substr(1).split("|");
          if(arrayHas(chosenTrees, "all")) {
            chosenTrees = new Array();
            for(var i = 0; i < jsonTrees.length; i++) {
              if(jsonTrees[i].id != "all") {
                chosenTrees.push(jsonTrees[i].id);
              }
            }
          }
          $.ajax({
            url: 'posts',
            type: 'POST',
            dataType: 'json',
            data: {
              'post[user_id]': gon.user_id,
              'post[text]': $('input[name="status_update"]').val(),
              'post[likes]': 0,
              'post[dislikes]': 0,
              'post[post_id]': '',
              'post[tree_ids]': chosenTrees
            },
            success: function(newPost) {
              $('input[name="status_update"]').val("").trigger("blur").siblings("*").remove();
              $('#Stream').prepend('<div class="post"><div class="post_user">'+newPost.user_id+'</div><div class="post_date">'+newPost.created_at+'</div><div class="post_msg">'+newPost.text+'</div></div>');
              $('#Stream .post:first').css('backgroundColor', '#DDD').animate({
                'backgroundColor': '#FFF'
              }, 1500);
            }
          });
        });
      }
    });
    
    // STREAM
    
    var posts = new Array();
    
    $.ajax({
      url: 'posts.json',
      dataType: 'json',
      success: function(resp) {
        for(var i = 0; i < resp.length; i++) {
          var p = resp[i];
          $('#Stream').prepend('<div class="post"><div class="post_user">'+p.user_id+'</div><div class="post_date">'+p.created_at+'</div><div class="post_msg">'+p.text+'</div></div>');
        }
      }
    });
  }
});
