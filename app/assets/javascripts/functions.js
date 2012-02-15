var makeToast = function(str) {
  $('body').append('<div id="toast">'+str+'</div>');
  $('#toast').fadeIn(500, function() {
    $(this).delay(2500).fadeOut(500, function() {
      $(this).remove();
    });
  });
}

var show = function(str) {
  if($('#'+str).length > 0) {
    $('#content > div').hide();
    $('#'+str).show();
    $('#navigation').find('a').removeClass('active');
    $('#navigation').find('a[name="'+str+'"]').addClass('active');
  }
}

var setInputDefault = function(input, str) {
  input.data('origText', str);
  input.val(str).css('color', '#999999');
  input.bind('focus', function() {
    if($(this).val() == $(this).data('origText')) {
      $(this).val("");
      $(this).css('color', '#000000');
    }
  });
  input.bind('blur', function() {
    if($(this).val() == "") {
      $(this).css('color', '#999999');
      $(this).val($(this).data('origText'));
    }
  });
}

var addTree = function() {
  if($('input[name="newTree"]').length == 0) {
    $('li:has(a[name="addTree"])').before('<li style="display: none"><input type="text" name="newTree" value="" size="25" />');
    var nTree = $('input[name="newTree"]');
    setInputDefault(nTree, "Mein neuer Tree");
    nTree.after('<input type="button" name="saveNewTree" value="OK" />');
    nTreeBt = nTree.next('input[name="saveNewTree"]');
    nTreeBt.after('<input type="button" name="discardNewTree" value="X" />');
    nTreeBtDis = nTreeBt.next('input[name="discardNewTree"]');
    
    nTree.parents('li').slideDown(300, function() {
      nTree.focus();
    });
    
    nTree.bind('keyup', function(e) {
      if(e.which == 13) {
        nTreeBt.click();
      }
    });
    
    nTreeBt.button().click(function() {
      var tx = $('input[name="newTree"]').val();
      if(tx.trim() == "") {
        $(this).parents('li').slideUp(300, function() {
          $(this).remove();
        });
      } else {
        var newtree = new Object();
        newtree['title'] = $('input[name="newTree"]').val();
        newtree['user_id'] = gon.user_id;
        $.ajax({
          url: '/trees.json',
          type: 'POST',
          data: {
            'tree': newtree
          },
          dataType: 'json',
          success: function(t) {
            var li = $('input[name="newTree"]').parents('li');
            li.empty();
            li.append('<a href="#" name="tree_'+t.title+'" onclick="show(\'tree:'+t.id+'\')">'+t.title+'</a>');
            makeToast("Tree erfolgreich erstellt!");
          }
        });
      }
    });
    
    nTreeBtDis.button().click(function() {
      $(this).parents('li').slideUp(300, function() {
        $(this).remove();
      });
    });
  }
}
