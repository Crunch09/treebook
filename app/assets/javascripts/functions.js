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
      $('#actions').html('');
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
          $('#actions').html('<span>'+tree.users.length+' Person'+(tree.users.length == 1 ? '' : 'en')+'</span><span>Bearbeiten</span><span>Löschen</span>').show();
          $('#actions span:eq(0)').click(function() {
            // Personen in diesem Tree auflisten
            $('body').append('<div id="tree_users_list"></div>');
            for(var i = 0; i < tree.users.length; i++) {
              var u = tree.users[i];
              $('#tree_users_list').append('<div class="user" name="'+u.id+'"><img src="'+u.image+'" /> '+u.firstname+' '+u.name+'</div>');
              $('#tree_users_list .user:last').click(function() {
                showProfile($(this).attr("name"));
                $('#tree_users_list').dialog("close");
              });
            }
            $('#tree_users_list').dialog({
              modal: true,
              buttons: {
                "Schließen": function() {
                  $(this).dialog("close");
                }
              },
              close: function() {
                $(this).remove();
              }
            })
          });
          $('#actions span:eq(1)').click(function() {
            // Tree umbenennen
            var newName = prompt("Geben Sie den Namen des Trees ein.", tree.title);
            if(newName != null && newName != "" && newName != tree.title) {
              $.ajax({
                url: 'trees/'+tree.id+'.json',
                type: 'PUT',
                data: {
                  'tree[title]': newName
                },
                success: function(response) {
                  var navTree = $('#navigation a[name="tree_'+tree.id+'_'+tree.title+'"]');
                  var img = navTree.find('img');
                  $('#navigation a[name="tree_'+tree.id+'_'+tree.title+'"]').html(" "+newName).attr("name", "tree_"+tree.id+"_"+newName);
                  img.prependTo(navTree);
                  navTree.click();
                },
                error: function(e) {
                  console.log(e);
                }
              });
            }
          });
          $('#actions span:eq(2)').click(function() {
            // Tree löschen
            var conf = confirm("Möchten Sie diesen Tree wirklich löschen? Dadurch gehen Ihnen auch die mit diesem Tree verknüpften Kontakte verloren!");
            if(conf) {
              $.ajax({
                url: 'trees/'+tree.id+'.json',
                type: 'DELETE',
                success: function(response) {
                  var navTree = $('#navigation a[name="tree_'+tree.id+'_'+tree.title+'"]');
                  navTree.slideUp(400, function() {
                    $(this).parent('li').remove();
                  });
                  show('Startseite');
                },
                error: function(e) {
                  console.log(e);
                }
              });
            }
          });
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
                        "<div class='profile_menu'>"+
                        "<ul>"+
                        "<li>Beiträge</li>"+
                        "<li>Über mich</li>"+
                        "<li>Fotos</li>"+
                        "<span style='clear: left;'></span>"+
                        "</ul>"+
                        "</div>"+
                        "<div class='profile_posts'></div>"+
                        "<div class='profile_about'></div>"+
                        "<div class='profile_photos'>"+
                        " <div id='controls'></div>"+
                        " <div id='loading'></div>"+
                        " <div id='slideshow'></div>"+
                        " <div id='caption'></div>"+
                        " <div id='thumbs'></div>"+
                        "</div>"+
                        "<br style='clear: left;' />");
      
      /**
       * Gravatar-Login-Link einblenden, wenn das eigene Profil aufgerufen wird und das Bild mit der Maus überfahren wird
       */
      if(u.id == gon.user_id) {
        $('.profile_image img').hover(function() {
          if($('.editGravatar').length == 0) {
            $(this).after('<span class="editGravatar ui-state-default ui-corner-all"><a href="https://de.gravatar.com/site/login/" target="_blank"><span class="ui-icon ui-icon-pencil"></span></a></span>');
            $('.editGravatar').hover(
              function() { $(this).addClass('ui-state-hover'); }, 
              function() { $(this).removeClass('ui-state-hover'); }
            );
          }
          $('.editGravatar').position({
            of: $('.profile_image img'),
            my: 'right top',
            at: 'right top',
            offset: '-1 1',
            collision: 'flip flip'
          });
        }, function() {
          return;
        });
      }
      
      /**
       * Profil-Menü initialisieren
       */
      $('.profile_menu li:contains("Beiträge")').click(function() {
        $('.profile_about, .profile_photos').hide();
        $('.profile_posts').show();
        $('.profile_menu li').removeClass('profile_menu_active');
        $(this).addClass('profile_menu_active');
      });
      $('.profile_menu li:contains("Über mich")').click(function() {
        $('.profile_posts, .profile_photos').hide();
        $('.profile_about').show();
        $('.profile_menu li').removeClass('profile_menu_active');
        $(this).addClass('profile_menu_active');
      });
      $('.profile_menu li:contains("Fotos")').click(function() {
        $('.profile_posts, .profile_about').hide();
        $('.profile_photos').show();
        $('.profile_menu li').removeClass('profile_menu_active');
        $(this).addClass('profile_menu_active');
      });
      
      /* Beiträge einfügen */
      if(u.shared_posts.length == 0) {
        $('.profile_posts').html("<br />"+u.firstname+" hat noch keine Beiträge verfasst.");
      }
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
      
      /* Fotos einfügen */
      if(u.id == gon.user_id) {
        $.ajax({
          url: 'images.json',
          dataType: 'json',
          success: function(imgs) {
            if(imgs.url) {
              $.ajax({
                url: 'images',
                success: function(f) {
                  $('.profile_photos').append('<br /><span><a href="'+f.url+'">Verknüpfe jetzt deinen Treebook-Account mit <img src="assets/social/flickr16px.png" /> flickr&reg;</a></span>');
                  $('.profile_photos span, .profile_photos span img').css('verticalAlign', 'middle');
                }
              });
            } else {
              if(imgs.photosets) {
                for(var i = 0; i < imgs.photosets.length; i++) {
                  var set = imgs.photosets[i];
                  $('.profile_photos').append('<div class="profile_photoset"><span class="title">'+set.title+'</span></div>');
                  $('.profile_photos .profile_photoset:last').css({
                    'background': 'url("'+set.fotos[0].url+'")'
                  }).data('set', set).hover(function() {
                    var set = $(this).data('set');
                    if($(this).find('.title').data('height') == undefined) {
                      $(this).find('.title').data({
                        'height': $(this).find('.title').height()
                      });
                    }
                    $(this).find('.title').append('<div class="thumbs"></div>');
                    for(var j = 0; j < set.fotos.length; j++) {
                      if(j < 4) {
                        $(this).find('.thumbs').append('<div class="photo_thumb"></div>');
                        $(this).find('.thumbs > .photo_thumb:last').css({
                          'background': 'url("'+set.fotos[j].url+'")'
                        });
                      } else {
                        break;
                      }
                    }
                    $(this).find('.thumbs').append('<span style="clear: left;"></span>');
                    $(this).find('.title').animate({
                      'height': '150px'
                    }, 400);
                  }, function() {
                    $(this).find('.title').animate({
                      'height': $(this).find('.title').data('height')
                    }, 400);
                    $(this).find('.thumbs').slideUp(400, function() {
                      $(this).remove();
                    });
                  });
                }
              }
            }
          }
        });
      } else {
        $.ajax({
          url: 'images/'+u.id+'.json',
          dataType: 'json',
          success: function(imgs) {
            console.log("images");
            console.log(imgs);
          },
          error: function(e) {
            $('.profile_photos').append('<br />'+e.responseText.replace("Dieser User", u.firstname));
          }
        });
      }
      
      show("Profil");
      $('.profile_menu li:contains("Beiträge")').click();
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
  if(u.id == gon.user_id) {
    /**
     * Optionen zum Bearbeiten und Löschen des Beitrags anzeigen, wenn der aktuelle Benutzer der Autor des Beitrags ist.
     */
    $('#profilePost_'+p.id).append('<div class="post_admin ui-state-default ui-corner-all"><span class="ui-icon ui-icon-triangle-1-s"></span></div>')
    $('#profilePost_'+p.id+' .post_admin').hover(
      function() { $(this).addClass('ui-state-hover'); }, 
      function() { $(this).removeClass('ui-state-hover'); }
	).click(function() {
      if($('.post_admin_actions').length == 0) {
        $(this).after('<div class="post_admin_actions"><ul><li>bearbeiten</li><li>löschen</li></ul></div>');
        $('.post_admin_actions').slideDown(400).position({
          of: $('#profilePost_'+p.id+' .post_admin'),
          my: 'right top',
          at: 'right bottom',
          offset: '0 2',
          collision: 'flip flip'
        }).data({
          'post_id': p.id
        });
        $('.post_admin_actions li:contains("bearbeiten")').click(function() {
          $('#profilePost_'+p.id+' .post_admin').click();
          var id = $('.post_admin_actions').data('post_id');
          $('#profilePost_'+id+' .post_text').wrapInner('<textarea name="post_text" />');
          $('#profilePost_'+id+' .post_text').after('<input type="button" name="save_post_text" value="Speichern" />');
          $('#profilePost_'+id+' input[name="save_post_text"]').button().click(function() {
            $.ajax({
              url: 'posts/'+id+'.json',
              type: 'PUT',
              dataType: 'json',
              data: {
                'post[text]': $('#profilePost_'+id+' textarea[name="post_text"]').val()
              },
              success: function(response) {
                $('#profilePost_'+id+' .post_text, #post_'+id+' .post_text').text($('#profilePost_'+id+' textarea[name="post_text"]').val());
                $('#profilePost_'+id+' input[name="save_post_text"]').remove();
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
                $('#profilePost_'+id+', #post_'+id).add($('#profilePost_'+id).nextUntil('.post')).add($('#post_'+id).nextUntil('.post')).slideUp(400, function() {
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
  if(u.id == gon.user_id) {
    /**
     * Optionen zum Bearbeiten und Löschen des Beitrags anzeigen, wenn der aktuelle Benutzer der Autor des Beitrags ist.
     */
    $('#profilePost_'+c.id).append('<div class="post_admin ui-state-default ui-corner-all"><span class="ui-icon ui-icon-triangle-1-s"></span></div>')
    $('#profilePost_'+c.id+' .post_admin').hover(
      function() { $(this).addClass('ui-state-hover'); }, 
      function() { $(this).removeClass('ui-state-hover'); }
	).click(function() {
      if($('.post_admin_actions').length == 0) {
        $(this).after('<div class="post_admin_actions"><ul><li>bearbeiten</li><li>löschen</li></ul></div>');
        $('.post_admin_actions').slideDown(400).position({
          of: $('#profilePost_'+c.id+' .post_admin'),
          my: 'right top',
          at: 'right bottom',
          offset: '0 2',
          collision: 'flip flip'
        }).data({
          'post_id': c.id
        });
        $('.post_admin_actions li:contains("bearbeiten")').click(function() {
          $('#profilePost_'+c.id+' .post_admin').click();
          var id = $('.post_admin_actions').data('post_id');
          $('#profilePost_'+id+' .post_text').wrapInner('<textarea cols="80" name="post_text" />');
          makeTextareaGrowable($('#post_'+id+' textarea[name="post_text"]'));
          $('#profilePost_'+id+' .post_text').after('<input type="button" name="save_post_text" value="Speichern" />');
          $('#profilePost_'+id+' input[name="save_post_text"]').button().click(function() {
            $.ajax({
              url: 'posts/'+id+'.json',
              type: 'PUT',
              dataType: 'json',
              data: {
                'post[text]': $('#post_'+id+' textarea[name="post_text"]').val()
              },
              success: function(response) {
                $('#profilePost_'+id+' .post_text, #post_'+id+' .post_text').text($('#post_'+id+' textarea[name="post_text"]').val());
                $('#profilePost_'+id+' input[name="save_post_text"]').remove();
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
                $('#profilePost_'+id+', #post_'+id).slideUp(400, function() {
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