/**
 * Zeigt eine "Toast"-Benachrichtigung an.
 */
var makeToast = function(str) {
  $('body').append('<div id="toast">'+str+'</div>');
  $('#toast').fadeIn(500, function() {
    $(this).delay(2500).fadeOut(500, function() {
      $(this).remove();
    });
  });
}

/**
 * Zeigt den durch str verknüpften Inhalt auf der Seite an.
 */
var show = function(str) {
  if(str != 'Profil') {
    $('div[id^="profilePost_"]').remove();
    $('#Profil').empty();
  }
  $('textarea[name="status_update"]').val("").trigger("blur").siblings("*").remove();
  if($('#'+str).length > 0) {
    $('#content > div').hide();
    $('#'+str).show();
    $('#navigation').find('a').removeClass('active');
    $('#navigation').find('a[name="'+str+'"]').addClass('active');
    if(str == "Startseite") {
      $('#Stream div[id^="post_"]').show();
      $('#Stream').prev('h3').text("Stream");
    }
  } else {
    if(str.substring(0,5) == "tree:") {
      $.ajax({
        url: 'trees/'+str.substring(5)+'.json',
        dataType: 'json',
        success: function(tree) {
          show('Startseite');
          var users = new Array();
          for(var i = 0; i < tree.users.length; i++) {
            users.push(tree.users[i].id);
          }
          users.push(gon.user_id);
          $('#Stream div.post').each(function() {
            var showOwnInTree = false;
            if($(this).data('user_id') == gon.user_id) {
              for(var i = 0; i < $(this).data('trees').length; i++) {
                if($(this).data('trees')[i].id == tree.id) {
                  showOwnInTree = true;
                  break;
                }
              }
              if(!showOwnInTree) {
                $(this).hide();
                $(this).nextUntil('.post').hide();
              } else {
                $(this).show();
                $(this).nextUntil('.post').show();
              }
            } else {
              if(!arrayHas(users, $(this).data('user_id'))) {
                $(this).hide();
                $(this).nextUntil('.post').hide();
              } else {
                $(this).show();
                $(this).nextUntil('.post').show();
              }
            }
          });
          $('#navigation').find('a').removeClass('active');
          $('#navigation').find('a[name="tree_'+tree.id+'_'+tree.title+'"]').addClass('active');
          $('#Stream').prev('h3').text(tree.title);
        }
      });
    }
  }
}

/**
 * Zeigt das Benutzerprofil des Benutzer mit der ID user_id
 */
var showProfile = function(user_id) {
  $.ajax({
    url: 'users/'+user_id+'.json',
    dataType: 'json',
    success: function(u) {
      $('#Profil').html("<h3>"+u.firstname+" "+u.name+"</h3>"+
                        "<div class='profile_image'><img src='"+u.image+"' width='64' /></div>"+
                        "<div class='profile_posts'></div>");
      console.log(u);
      for(var i = 0; i < u.shared_posts.length; i++) {
        var p = u.shared_posts[i];
        addSharedPost(p);
        for(var j = 0; j < 3; j++) {
          if(j < p.comments.length)
            addSharedComment(p, j);
        }
        if(p.comments.length > 3) {
          addShowAllProfileCommentsLink(p);
        }
      }
      show("Profil");
    }
  });
}

/**
 * Fügt einen 
 */
var addSharedPost = function(p) {
  // User-Cache prüfen
  var u = checkUserCache(p.user_id);
  // HTML hinzufügen
  $('#Profil .profile_posts').prepend('<div id="profilePost_'+p.id+'" class="post"><div class="post_user" onclick="showProfile('+u.id+')"><span class="post_avatar"><img src="'+u.image+'" width="32" /></span> '+u.firstname+' '+u.name+'</div><div class="post_date">'+p.time_ago+'</div><div class="post_text">'+p.text+'</div><span class="post_toggle"></span><div class="post_actions"><span class="post_like" title="Likes"><img src="assets/like.png" onclick="like('+p.id+')" /><span class="post_like_amnt">'+p.likes+'</span></span> <span class="post_dislike" title="Dislikes"><img src="assets/dislike.png" onclick="dislike('+p.id+')" /><span class="post_dislike_amnt">'+p.dislikes+'</span></span> - <span class="post_comment">'+p.comments.length+' Kommentar'+(p.comments.length != 1 ? 'e' : '')+'</span> <span class="do_comment" onclick="comment('+p.id+')">Kommentieren</span></div></div>');
  // Post mit jQuery-Meta-Daten füttern
  $('#profilePost_'+p.id).data({
    'user_id': u.id,
    'user_firstname': u.firstname,
    'user_name': u.name,
    'post_time_ago': p.time_ago,
    'post_text': p.text,
    'trees': p.trees
  });
  if(p.text.length > 200) {
    // Sofern der Post länger als 200 Zeichen ist, wird ein "Mehr/Weniger anzeigen"-Link generiert.
    $('#profilePost_'+p.id+' .post_text').data('text', p.text).html(p.text.substring(0,200)+"...");
    $('#profilePost_'+p.id+' .post_toggle').html("Mehr anzeigen").click(function() {
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
  // Prüfen ob Kommentar als Index oder Objekt angegeben wurde
  var c = (i.id == undefined ? p.comments[i] : i);
  // User-Cache prüfen
  var u = checkUserCache(c.user_id);
  var insertAfter;
  // Prüfen, wo genau der Kommentar angefügt werden soll
  if(where == 'after') {
    if($('#profilePost_'+p.id).nextAll('.post').length > 0) {
      // hinter eventuell bereits vorhandene Kommentare
      insertAfter = $('#profilePost_'+p.id).nextUntil('.post:visible').last();
      if(insertAfter.length == 0) {
        // oder direkt hinter den Post (erster Kommentar)
        insertAfter = $('#profilePost_'+p.id);
      }
    } else {
      // ans Ende des Streams
      insertAfter = $('#Profil .profile_posts div[id^="post_"]:visible:last');
    }
  } else {
    insertAfter = $('#profilePost_'+p.id);
  }
  // HTML erzeugen
  insertAfter.after('<div id="profilePost_'+c.id+'" class="comment"><div class="post_user" onclick="showProfile('+u.id+')"><span class="post_avatar"><img src="'+u.image+'" width="32" /></span> '+u.firstname+' '+u.name+'</div><div class="post_date">'+c.time_ago+'</div><div class="post_text">'+c.text+'</div><span class="post_toggle"></span><div class="post_actions"><span class="post_like" title="Likes"><img src="assets/like.png" onclick="like('+c.id+')" /><span class="post_like_amnt">'+c.likes+'</span></span> <span class="post_dislike" title="Dislikes"><img src="assets/dislike.png" onclick="dislike('+c.id+')" /><span class="post_dislike_amnt">'+c.dislikes+'</span></span></div></div>');
  // Kommentar mit jQuery-Meta-Daten füttern
  $('#post_'+c.id).data({
    'user_id': u.id,
    'user_firstname': u.firstname,
    'user_name': u.name,
    'post_time_ago': c.time_ago,
    'post_text': c.text,
    'trees': c.trees
  });
  if(c.text.length > 200) {
    // Wieder die Prüfung auf mehr als 200 Zeichen
    $('#profilePost_'+c.id+' .post_text').data('text', p.text).html(p.text.substring(0,200)+"...");
    $('#profilePost_'+c.id+' .post_toggle').html("Mehr anzeigen").click(function() {
      var pt = $(this).siblings('.post_text');
      var t = pt.data('text');
      var s = pt.text();
      pt.data('text', s);
      pt.html(t);
      $(this).text($(this).text() == "Mehr anzeigen" ? "Weniger anzeigen" : "Mehr anzeigen");
    });
  }
}

/**
 * Fügt den "Zeige alle X vorherigen Kommentare"-Link hinter dem Post hinzu
 */
var addShowAllProfileCommentsLink = function(p) {
  $('#profilePost_'+p.id).after('<div class="showAllComments comment">Zeige alle '+(p.comments.length-3)+' vorherigen Kommentare</div>');
  $('#profilePost_'+p.id).next('.showAllComments').click(function() {
    showAllComments(p);
    $(this).remove();
  });
}

var setInputDefault = function(input, str) {
  input.data('origText', str);
  input.val(str);
  input.bind('focus', function() {
    if($(this).val() == $(this).data('origText')) {
      $(this).val("");
    }
  });
  input.bind('blur', function() {
    if($(this).val() == "") {
      $(this).val($(this).data('origText'));
    }
  });
}

var addTree = function() {
  if($('input[name="newTree"]').length == 0) {
    $('li:has(a[name="addTree"])').before('<li style="display: none"><input type="text" name="newTree" value="" size="25" /><input type="button" name="saveNewTree" value="OK" /><input type="button" name="discardNewTree" value="X" />');
    var nTree = $('input[name="newTree"]');
    setInputDefault(nTree, "Mein neuer Tree");
    nTreeBt = nTree.next('input[name="saveNewTree"]');
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
            li.append('<a href="#" name="tree_'+t.id+'_'+t.title+'" onclick="show(\'tree:'+t.id+'\')"><img alt="Tree_icon" src="/assets/tree_icon.png"> '+t.title+'</a>');
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