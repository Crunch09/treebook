/**
 * Steuert das automatische Aktualisieren der Zeiten der Posts (vor X Minuten etc.)
 */
var autoRefreshRate = 10000;

/**
 * Aktualisiert das Datum aller Posts und Kommentare im Intervall autoRefreshRate
 */
var refreshPostTimeAgo = function() {
  window.setTimeout(function() {
    $('.post:visible, .comment:visible').each(function() {
      var post = $(this);
      if(post.attr("id") != undefined) {
        $.ajax({
          url: 'posts/'+post.attr("id").split("_")[1]+'.json',
          dataType: 'json',
          success: function(p) {
            post.find('.post_date').html(p.time_ago);
          },
          error: function(e) {
            if(e.status == 404) {
                post.removeAttr("id");
            }
          }
        });
      }
    });
    refreshPostTimeAgo();
  }, autoRefreshRate);
}

var postsLoading = false;

var loadPosts = function() {
  if($('.post').length == 0 && !postsLoading) {
    postsLoading = true;
    // Alle verfügbaren Posts laden
    $.ajax({
      url: 'posts.json',
      dataType: 'json',
      success: function(resp) {
        // und nach und nach inklusive den letzten 3 Kommentaren anzeigen
        for(var i = 0; i < resp.length; i++) {
          var p = resp[i];
          addPost(p);
          for(var j = 0; j < 3; j++) {
            if(j < p.comments.length)
              addComment(p, j);
          }
          if(p.comments.length > 3) {
            // bei mehr als 3 Kommentaren, einen Link zum Anzeigen der vorherigen Kommentare anzeigen
            addShowAllCommentsLink(p);
          }
        }
      }
    });
  } else {
    $('.post, .comment').show();
    $('#Profil .profile_posts .post').each(function() {
      var coll;
      if($(this).nextAll('.post').length > 0) {
        coll = $(this).add($(this).nextUntil('.post'));
      } else {
        coll = $(this).add($(this).nextAll('.comment'));
      }
      if($(this).data('after') != undefined) {
        coll.insertAfter($(this).data('after'));
      } else {
        coll.prependTo($(this).data('prepend'));
      }
    });
    $('.post').show();
  }
}

/**
 * Fügt einen Post an den Anfang des Streams hinzu
 */
var addPost = function(p) {
  // User-Cache prüfen
  var u = checkUserCache(p.user_id);
  // HTML hinzufügen
  $('#Stream').prepend('<div id="post_'+p.id+'" class="post"><a href="#u:'+u.id+'"><div class="post_user" onclick="showProfile('+u.id+')"><span class="post_avatar"><img src="'+u.image+'" width="32" /></span> '+u.firstname+' '+u.name+'</div></a><div class="post_date">'+p.time_ago+'</div><div class="post_text">'+p.text+'</div><span class="post_toggle"></span><div class="post_actions"><span class="post_like" title="Likes" onclick="like('+p.id+')"><i class="icon-thumbs-up"></i> <span class="post_like_amnt">'+p.likes+'</span></span> <span class="post_dislike" title="Dislikes" onclick="dislike('+p.id+')"><i class="icon-thumbs-down"></i> <span class="post_dislike_amnt">'+p.dislikes+'</span></span> <span class="post_comment" title="Kommentare"><i class="icon-comments"></i> '+p.comments.length+'</span> - <span class="do_comment" onclick="comment('+p.id+')"><i class="icon-comment"></i> Kommentieren</span></div></div>');
  // Post mit jQuery-Meta-Daten füttern
  $('#post_'+p.id).data({
    'user_id': u.id,
    'user_firstname': u.firstname,
    'user_name': u.name,
    'post_time_ago': p.time_ago,
    'post_text': p.text,
    'trees': p.trees
  });
  if(u.id == gon.user_id) {
    /**
     * Optionen zum Bearbeiten und Löschen des Beitrags anzeigen, wenn der aktuelle Benutzer der Autor des Beitrags ist.
     */
    $('#post_'+p.id).append('<div class="post_admin ui-state-default ui-corner-all"><span class="ui-icon ui-icon-triangle-1-s"></span></div>')
    $('#post_'+p.id+' .post_admin').hover(
      function() { $(this).addClass('ui-state-hover'); }, 
      function() { $(this).removeClass('ui-state-hover'); }
	).click(function() {
      if($('.post_admin_actions').length == 0) {
        $(this).after('<div class="post_admin_actions"><ul><li><i class="icon-edit"></i> bearbeiten</li><li><i class="icon-remove"></i> löschen</li></ul></div>');
        $('.post_admin_actions').slideDown(400).position({
          of: $('#post_'+p.id+' .post_admin'),
          my: 'right top',
          at: 'right bottom',
          offset: '0 2',
          collision: 'flip flip'
        }).data({
          'post_id': p.id
        });
        $('.post_admin_actions li:contains("bearbeiten")').click(function() {
          $('#post_'+p.id+' .post_admin').click();
          var id = $('.post_admin_actions').data('post_id');
          $('#post_'+id+' .post_text').wrapInner('<textarea name="post_text" />');
          $('#post_'+id+' .post_text').after('<button name="save_post_text"><i class="icon-ok"></i> Speichern</button>');
          $('#post_'+id+' button[name="save_post_text"]').button().click(function() {
            $.ajax({
              url: 'posts/'+id+'.json',
              type: 'PUT',
              dataType: 'json',
              data: {
                'post[text]': $('#post_'+id+' textarea[name="post_text"]').val()
              },
              success: function(response) {
                $('#post_'+id+' .post_text').text($('#post_'+id+' textarea[name="post_text"]').val());
                $('#post_'+id+' button[name="save_post_text"]').remove();
                makeToast("Dein Beitrag wurde bearbeitet.");
              }
            });
          });
        });
        $('.post_admin_actions li:contains("löschen")').click(function() {
          var id = $('.post_admin_actions').data('post_id');
          var conf = confirm("Möchten Sie diesen Beitrag wirklich löschen?");
          if(conf) {
            $.ajax({
              url: 'posts/'+id+'.json',
              type: 'DELETE',
              success: function(response) {
                makeToast("Dein Beitrag wurde gelöscht.");
                $('#post_'+id).add($('#post_'+id).nextUntil('.post')).slideUp(400, function() {
                  $(this).remove();
                });
              }
            });
          }
        });
      } else {
        if($(this).siblings('div:last').hasClass('post_admin_actions')) {
          $('.post_admin_actions').slideUp(400, function() { $(this).remove(); });
        } else {
          $('.post_admin_actions').remove();
          $(this).click();
        }
      }
    });
  }
  if(p.text.length > 200) {
    // Sofern der Post länger als 200 Zeichen ist, wird ein "Mehr/Weniger anzeigen"-Link generiert.
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

/**
 * Fügt einen Kommentar an das Ende der Kommentarkette des kommentierten Posts an
 */
var addComment = function(p, i, where) {
  // Prüfen ob Kommentar als Index oder Objekt angegeben wurde
  var c = (i.id == undefined ? p.comments[i] : i);
  // User-Cache prüfen
  var u = checkUserCache(c.user_id);
  var insertAfter;
  // Prüfen, wo genau der Kommentar angefügt werden soll
  if(where == 'after') {
    if($('#post_'+p.id).nextAll('.post').length > 0) {
      // hinter eventuell bereits vorhandene Kommentare
      insertAfter = $('#post_'+p.id).nextUntil('.post:visible').last();
      if(insertAfter.length == 0) {
        // oder direkt hinter den Post (erster Kommentar)
        insertAfter = $('#post_'+p.id);
      }
    } else {
      // ans Ende des Streams
      insertAfter = $('#Stream div[id^="post_"]:visible:last');
    }
  } else {
    insertAfter = $('#post_'+p.id);
  }
  // HTML erzeugen
  insertAfter.after('<div id="post_'+c.id+'" class="comment"><a href="#u:'+u.id+'"><div class="post_user" onclick="showProfile('+u.id+')"><span class="post_avatar"><img src="'+u.image+'" width="32" /></span> '+u.firstname+' '+u.name+'</div></a><div class="post_date">'+c.time_ago+'</div><div class="post_text">'+c.text+'</div><span class="post_toggle"></span><div class="post_actions"><span class="post_like" title="Likes" onclick="like('+c.id+')"><i class="icon-thumbs-up"></i> <span class="post_like_amnt">'+c.likes+'</span></span> <span class="post_dislike" title="Dislikes" onclick="dislike('+c.id+')"><i class="icon-thumbs-down"></i> <span class="post_dislike_amnt">'+c.dislikes+'</span></span></div></div>');
  // Kommentar mit jQuery-Meta-Daten füttern
  $('#post_'+c.id).data({
    'user_id': u.id,
    'user_firstname': u.firstname,
    'user_name': u.name,
    'post_time_ago': c.time_ago,
    'post_text': c.text,
    'trees': c.trees
  });
  if(u.id == gon.user_id) {
    /**
     * Optionen zum Bearbeiten und Löschen des Beitrags anzeigen, wenn der aktuelle Benutzer der Autor des Beitrags ist.
     */
    $('#post_'+c.id).append('<div class="post_admin ui-state-default ui-corner-all"><span class="ui-icon ui-icon-triangle-1-s"></span></div>')
    $('#post_'+c.id+' .post_admin').hover(
      function() { $(this).addClass('ui-state-hover'); }, 
      function() { $(this).removeClass('ui-state-hover'); }
	).click(function() {
      if($('.post_admin_actions').length == 0) {
        $(this).after('<div class="post_admin_actions"><ul><li><i class="icon-edit"></i> bearbeiten</li><li><i class="icon-remove"></i> löschen</li></ul></div>');
        $('.post_admin_actions').slideDown(400).position({
          of: $('#post_'+c.id+' .post_admin'),
          my: 'right top',
          at: 'right bottom',
          offset: '0 2',
          collision: 'flip flip'
        }).data({
          'post_id': c.id
        });
        $('.post_admin_actions li:contains("bearbeiten")').click(function() {
          $('#post_'+c.id+' .post_admin').click();
          var id = $('.post_admin_actions').data('post_id');
          $('#post_'+id+' .post_text').wrapInner('<textarea cols="80" name="post_text" />');
          makeTextareaGrowable($('#post_'+id+' textarea[name="post_text"]'));
          $('#post_'+id+' .post_text').after('<button name="save_post_text"><i class="icon-ok"></i> Speichern</button>');
          $('#post_'+id+' button[name="save_post_text"]').button().click(function() {
            $.ajax({
              url: 'posts/'+id+'.json',
              type: 'PUT',
              dataType: 'json',
              data: {
                'post[text]': $('#post_'+id+' textarea[name="post_text"]').val()
              },
              success: function(response) {
                $('#post_'+id+' .post_text').text($('#post_'+id+' textarea[name="post_text"]').val());
                $('#post_'+id+' button[name="save_post_text"]').remove();
                makeToast("Dein Kommentar wurde bearbeitet.");
              }
            });
          });
        });
        $('.post_admin_actions li:contains("löschen")').click(function() {
          var id = $('.post_admin_actions').data('post_id');
          var conf = confirm("Möchten Sie diesen Kommentar wirklich löschen?");
          if(conf) {
            $.ajax({
              url: 'posts/'+id+'.json',
              type: 'DELETE',
              success: function(response) {
                makeToast("Dein Beitrag wurde gelöscht.");
                $('#post_'+id).slideUp(400, function() {
                  var p = $(this).prevAll('.post:first');
                  console.log(p);
                  $(this).remove();
                  updateCommentsAmount(p.attr("id").split("_")[1], parseInt(p.find('.post_comment').text())-1);
                });
              }
            });
          }
        });
      } else {
        if($(this).siblings('div:last').hasClass('post_admin_actions')) {
          $('.post_admin_actions').slideUp(400, function() { $(this).remove(); });
        } else {
          $('.post_admin_actions').remove();
          $(this).click();
        }
      }
    });
  }
  if(c.text.length > 200) {
    // Wieder die Prüfung auf mehr als 200 Zeichen
    $('#post_'+c.id+' .post_text').data('text', p.text).html(p.text.substring(0,200)+"...");
    $('#post_'+c.id+' .post_toggle').html("Mehr anzeigen").click(function() {
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
 * Zeigt alle Kommentare zu einem Post an (nicht angezeigte werden explizit vom Server geladen)
 */
var showAllComments = function(p) {
  for(var i = 3; i < p.comments.length; i++) {
    addComment(p, i);
  }
}

/**
 * Fügt den "Zeige alle X vorherigen Kommentare"-Link hinter dem Post hinzu
 */
var addShowAllCommentsLink = function(p) {
  $('#post_'+p.id).after('<div class="showAllComments comment">Zeige alle '+(p.comments.length-3)+' vorherigen Kommentare</div>');
  $('#post_'+p.id).next('.showAllComments').click(function() {
    showAllComments(p);
    $(this).remove();
  });
}

/**
 * Generiert das Formular zum Verfassen eines Kommentars
 */
var comment = function(id) {
  $('.write_comment').remove();
  $('#post_'+id).append("<div class='write_comment'><textarea cols='50' name='comment_text'></textarea><br /><button onclick='sendComment("+id+")'><i class='icon-ok'></i> Abschicken</button><button name='cancel_comment'><i class='icon-remove'></i> Abbrechen</div>");
  $('#post_'+id+' .write_comment button[name="cancel_comment"]').click(function() {
    $('.write_comment').remove();
  });
  makeTextareaGrowable($('#post_'+id+' .write_comment textarea[name="comment_text"]'));
  $('#post_'+id+' .write_comment button').button();
}

/**
 * Sendet den erfassten Kommentar an den Server
 */
var sendComment = function(id) {
  var text = $('#post_'+id+' .write_comment textarea[name="comment_text"]').val();
  $.ajax({
    url: 'posts',
    type: 'POST',
    dataType: 'json',
    data: {
      'post[user_id]': gon.user_id,
      'post[text]': text,
      'post[likes]': 0,
      'post[dislikes]': 0,
      'post[post_id]': id,
      'post[tree_ids]': []
    },
    success: function(response) {
      $('#post_'+id+' .write_comment').slideUp(400, function() {
        $(this).remove();
        $.ajax({
          url: 'posts/'+id+'.json',
          dataType: 'json',
          success: function(p) {
            addComment(p, response, 'after');
            updateCommentsAmount(id, p.comments.length);
            client.publish('/posts/'+gon.user_id, { post_id: p.id, response_id: response.id });
	    if(p.user_id != gon.user_id) {
	      client.publish('/notifications/'+p.user_id, { type: 'comment', post_id: p.id, user_id: gon.user_id });
	    }
          }
        });
      });
    }
  });
}

/**
 * Aktualisiert die angezeigte Anzahl der Kommentare für den Post mit der ID id
 */
var updateCommentsAmount = function(id, amnt) {
  $('#post_'+id+' .post_comment').html('<i class="icon-comments"></i> '+amnt);
}

/**
 * Zeigt die Benachrichtigung am Anfang des Streams, dass neue Posts vorhanden sind (die via Faye-Listener geladen wurden)
 */
var showNewPostsAvailable = function() {
  if($('#showNewPosts').length == 0) {
    $('#Stream').before('<div id="showNewPosts"><span>0</span> neue Posts</div>');
    $('#showNewPosts').click(function() {
      $('#navigation .active').click();
      $(this).slideUp(400, function() { $(this).remove(); });
    });
  }
  var c = parseInt($('#showNewPosts > span').text())+1;
  var t = c == 1 ? "neuer Post" : "neue Posts";
  $('#showNewPosts').html("<span>"+c+"</span> "+t);
}

/**
 * Sendet ein "Like" für den Post mit der ID id an den Server
 */
var like = function(id) {
  $.ajax({
    url: 'vote',
    type: 'POST',
    dataType: 'json',
    data: {
      'vote[user_id]': gon.user_id,
      'vote[post_id]': id,
      'vote[upvote]': true
    },
    success: function(response) {
      if(response.id > 0) {
        $('#post_'+id+' .post_like_amnt').text(response.likes);
        $('#post_'+id+' .post_dislike_amnt').text(response.dislikes);
      }
    },
    error: function(response) {
      makeToast(response.responseText);
    }
  });
}

/**
 * Sendet ein "Dislike" für den Post mit der ID id an den Server
 */
var dislike = function(id) {
  $.ajax({
    url: 'vote',
    type: 'POST',
    dataType: 'json',
    data: {
      'vote[user_id]': gon.user_id,
      'vote[post_id]': id,
      'vote[upvote]': false
    },
    success: function(response) {
      if(response.id > 0) {
        $('#post_'+id+' .post_like_amnt').text(response.likes);
        $('#post_'+id+' .post_dislike_amnt').text(response.dislikes);
      }
    },
    error: function(response) {
      makeToast(response.responseText);
    }
  });
}