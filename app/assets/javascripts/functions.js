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
  } else {
    if(str.substring(0,5) == "tree:") {
      $.ajax({
        url: 'trees/'+str.substring(5)+'.json',
        dataType: 'json',
        success: function(tree) {
          //console.log(tree);
        }
      });
    }
  }
}

var showProfile = function(user_id) {
  $.ajax({
    url: 'users/'+user_id+'.json',
    dataType: 'json',
    success: function(u) {
      $('#Profil').html("<h3>"+u.firstname+" "+u.name+"</h3>"+
                        "<div class='profile_image'><img src='"+u.image+"' width='64' /></div>"+
                        "<div class='profile_posts'></div>");
      for(var i = 0; i < u.shared_posts.length; i++) {
          var p = u.shared_posts[i];
          addSharedPost(p);
          for(var j = 0; j < 3; j++) {
            if(j < p.comments.length)
              addSharedComment(p, j);
          }
          if(p.comments.length > 3) {
            addShowAllCommentsLink(p);
          }
        }
      show("Profil");
    }
  });
}

var addSharedPost = function(p) {
  var u = checkUserCache(p.user_id);
  $('#Profil .profile_posts').prepend('<div id="post_'+p.id+'" class="post"><div class="post_user" onclick="showProfile('+u.id+')"><span class="post_avatar"><img src="'+u.image+'" width="32" /></span> '+u.firstname+' '+u.name+'</div><div class="post_date">'+p.time_ago+'</div><div class="post_text">'+p.text+'</div><span class="post_toggle"></span><div class="post_actions"><span class="post_like" title="Likes"><img src="assets/like.png" onclick="like('+p.id+')" />'+p.likes+'</span> <span class="post_dislike" title="Dislikes"><img src="assets/dislike.png" onclick="dislike('+p.id+')" />'+p.dislikes+'</span> - <span class="post_comment">'+p.comments.length+' Kommentar'+(p.comments.length != 1 ? 'e' : '')+'</span> <span class="do_comment" onclick="comment('+p.id+')">Kommentieren</span></div></div>');
  $('#post_'+p.id).data('user_id', u.id);
  if(p.text.length > 200) {
    $('#post_'+p.id+' .post_text').data('text', p.text).html(p.text.substring(0,200)+"...");
    $('#post_'+p.id+' .post_toggle').html("Mehr anzeigen").click(function() {
      var pt = $(this).siblings('.post_text');
      var t = pt.data('text');
      var s = pt.text();
      pt.data('text', s);
      pt.html(t);
      $(this).text($(this).text() == "Mehr anzeigen" ? "Weniger anzeigen" : "Mehr anzeigen");
    });
  }
}

var addSharedComment = function(p, i, where) {
  var c = (i.id == undefined ? p.comments[i] : i);
  var u = checkUserCache(c.user_id);
  if(where == 'after') {
    if($('#post_'+p.id).nextAll('.post').length > 0) {
      $('#post_'+p.id).nextAll('.post').before('<div id="comment_'+c.id+'" class="comment"><div class="post_user" onclick="showProfile('+u.id+')"><span class="post_avatar"><img src="'+u.image+'" width="32" /></span> '+u.firstname+' '+u.name+'</div><div class="post_date">'+c.time_ago+'</div><div class="post_text">'+c.text+'</div><span class="post_toggle"></span><div class="post_actions"><span class="post_like" title="Likes"><img src="assets/like.png" onclick="like('+c.id+')" />'+c.likes+'</span> <span class="post_dislike" title="Dislikes"><img src="assets/dislike.png" onclick="dislike('+c.id+')" />'+c.dislikes+'</span></div></div>');
    } else {
      $('#Profil .profile_posts').append('<div id="comment_'+c.id+'" class="comment"><div class="post_user" onclick="showProfile('+u.id+')"><span class="post_avatar"><img src="'+u.image+'" width="32" /></span> '+u.firstname+' '+u.name+'</div><div class="post_date">'+c.time_ago+'</div><div class="post_text">'+c.text+'</div><span class="post_toggle"></span><div class="post_actions"><span class="post_like" title="Likes"><img src="assets/like.png" onclick="like('+c.id+')" />'+c.likes+'</span> <span class="post_dislike" title="Dislikes"><img src="assets/dislike.png" onclick="dislike('+c.id+')" />'+c.dislikes+'</span></div></div>');
    }
  } else {
    $('#post_'+p.id).after('<div id="comment_'+c.id+'" class="comment"><div class="post_user" onclick="showProfile('+u.id+')"><span class="post_avatar"><img src="'+u.image+'" width="32" /></span> '+u.firstname+' '+u.name+'</div><div class="post_date">'+c.time_ago+'</div><div class="post_text">'+c.text+'</div><span class="post_toggle"></span><div class="post_actions"><span class="post_like" title="Likes"><img src="assets/like.png" onclick="like('+c.id+')" />'+c.likes+'</span> <span class="post_dislike" title="Dislikes"><img src="assets/dislike.png" onclick="dislike('+c.id+')" />'+c.dislikes+'</span></div></div>');
  }
  $('#comment_'+c.id).data('user_id', u.id);
  if(c.text.length > 200) {
    $('#comment_'+c.id+' .post_text').data('text', p.text).html(p.text.substring(0,200)+"...");
    $('#comment_'+c.id+' .post_toggle').html("Mehr anzeigen").click(function() {
      var pt = $(this).siblings('.post_text');
      var t = pt.data('text');
      var s = pt.text();
      pt.data('text', s);
      pt.html(t);
      $(this).text($(this).text() == "Mehr anzeigen" ? "Weniger anzeigen" : "Mehr anzeigen");
    });
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

var arrayHas = function(arr, val) {
  for(var i = 0; i < arr.length; i++) {
    if(arr[i] == val) return true;
  }
  return false;
}

var arrayFind = function(arr, val) {
  for(var i = 0; i < arr.length; i++) {
    if(arr[i] == val) return arr[i];
  }
  return false;
}

var makeTextareaGrowable = function(txt) {
  txt.bind('keyup', function() {
    var lines = parseInt($(this).val().length/parseInt($(this).attr("cols")));
    $(this).attr("rows", lines+2);
  });
}