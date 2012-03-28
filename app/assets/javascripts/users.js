/**
 * Steuert das automatische Aktualisieren der Zeiten der Posts (vor X Minuten etc.)
 */
var autoRefreshRate = 10000;

/**
 * Erzeugt einen Faye-Client für die Push-Benachrichtigung bei neuen Posts und Kommentaren
 */
var client = new Faye.Client('http://localhost:9292/faye', {
    timeout: 60
});

/**
 * Dient als Sammlung aller Channels, die für Push-Benachrichtigungen benötigt werden.
 * Die Größe entspricht der Anzahl der Personen, die der Benutzer in seine Trees mit aufgenommen hat.
 */
var receiver = new Array();

/**
 * Wird ausgeführt, sobald die Seite fertig geladen ist. (Entspricht window.onload)
 */
$(function() {
  /**
   * Buttons initialisieren
   */
  $('input[type="button"], input[type="submit"]').button();
  
  /**
   * Auf Fehlernachrichten prüfen und gegebenenfalls anzeigen
   */
  if($('.alert').text() != "") {
    makeToast($('.alert').text());
  }
  
  /**
   * Auf Hinweisnachrichten prüfen und gegebenenfalls anzeigen
   */
  if($('.notice').text() != "") {
    makeToast($('.notice').text());
  }
  
  /**
   * Prüfen, ob der Login-Layer vorhanden ist (User ist nicht eingeloggt)
   */
  if($('#login_layer').length > 0) {
    // Layer-Toggle initialisieren (slideUp/slideDown)
    $('#login_layer > b').toggle(function() {
      // Layer-Position neu setzen
      $('#login_layer > div').slideDown(200).position({
        of: $('#login_layer > b'),
        my: 'right top',
        at: 'right bottom',
        offset: '0 -1'
      });
      
      // Registrierungsformular ausblenden, sofern es sichtbar ist
      if($('#signup_layer > div:visible').length > 0)
        $('#signup_layer > b').click();
      // Login-Top-Bar-Button einfärben
      $(this).css({
        'borderLeft': '1px solid #666',
        'borderRight': '1px solid #666',
        'textShadow': '#000 0px 0px 6px',
        'backgroundColor': '#FFF',
        'backgroundImage': $('#top_bar').css('backgroundImage')
      });
    }, function() {
      // Layer wieder einfahren
      $(this).next('div').slideUp(200);
      // Login-Top-Bar-Button zurücksetzen
      $(this).css({
        'borderLeft': '1px solid transparent',
        'borderRight': '1px solid transparent',
        'textShadow': 'none',
        'background': 'transparent'
      });
    });
  }
  
  /**
   * Gleiches Spiel, wie beim Login-Layer, nur jetzt für den Registrierungs-Layer
   */
  if($('#signup_layer').length > 0) {
    $('#signup_layer > b').toggle(function() {
      $('#signup_layer > div').slideDown(200).position({
        of: $('#signup_layer > b'),
        my: 'right top',
        at: 'right bottom',
        offset: '0 -1'
      });
      
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
  
  /**
   * Prüfen, ob das User-Menü vorhanden ist (User ist eingeloggt)
   */
  if($('#user_menu').length > 0) {
    /**
     * User-Menü initialisieren (fast genauso, wie Login-/Registrierungs-Layer)
     */
    $('#user_menu > b').toggle(function() {
      $('#user_menu_layer').slideDown(200).position({
        of: $('#user_menu > b'),
        my: 'right top',
        at: 'right bottom',
        offset: '0 -1'
      });
      
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
    
    /**
     * Rechte Spalte (Suche) initialisieren
     */
    setInputDefault($('#friendfinder input[name="friendsearch"]'), "Suche");
    $('#friendfinder input[name="friendsearch"]').bind('keyup', function() {
      if($(this).val().length > 2) {
        $.ajax({
          
        });
      } else {
        cleanSearchResult();
      }
    });
    
    /**
     * Startseite aktivieren (Main-Stream)
     */
    show('Startseite');
    
    /**
     * Status-Update initialisieren
     */
    setInputDefault($('#content textarea[name="status_update"]'), "Teile deine Gedanken!");
    makeTextareaGrowable($('#content textarea[name="status_update"]'));
    /**
     * Beim erstmaligen Fokusieren des Textfeldes die Tree-Auswahl und den Teilen-Button einblenden
     */
    $('#content textarea[name="status_update"]').bind('focus', function() {
      if($(this).nextAll('input[name="send_post"]').length == 0) {
        /**
         * Vorausgewählten Tree setzen: Wenn im Main-Stream, dann "Alle", wenn in einem Tree-Stream, dann den entsprechenden Tree
         */
        var preChosenTree = $('#navigation a[name^="tree_"].active').length > 0 ? [$('#navigation a[name^="tree_"].active').attr("name").split("_")[1], $('#navigation a[name^="tree_"].active').attr("name").split("_")[2]]  : ["all", "Alle"];
        $(this).after('<input type="button" name="send_post" value="Teilen" /><input type="text" name="treetag" value="|'+preChosenTree[0]+'" class="treetag"/><ul class="status_trees"><li>'+preChosenTree[1]+'</li></ul>');
        
        /**
         * Trees in einem Array zusammenfassen
         */
        var jsonTrees = new Array();
        $('#navigation a[name^="tree_"]').each(function() {
          var tree_data = $(this).attr("name").split("_");
          jsonTrees.push({ "id": tree_data[1], "label": tree_data[2], "value": tree_data[2] });
        });
        
        /**
         * Sofern im Main-Stream, die Tree-Auswahl initialisieren
         */
        if(preChosenTree[0] == "all") {
          $('.status_trees').after('<input type="text" name="status_trees_input" />');
          // Autocomplete initialisieren
          $('input[name="status_trees_input"]').autocomplete({
            autoFocus: true,
            minLength: 0,
            source: jsonTrees,
            create: function(event, ui) {
              // Beim Erstellen den vorausgewählten Tree aus den Auswahlmöglichkeiten nehmen
              var selected = $('input[name="treetag"]').val().substr(1).split("|");
              var newSource = new Array();
              for(var i = 0; i < jsonTrees.length; i++) {
                if(!arrayHas(selected, jsonTrees[i].id)) {
                  newSource.push(jsonTrees[i]);
                }
              }
              if(newSource.length > 0) {
                $(this).show().autocomplete("option", "source", newSource);
              } else {
                $(this).hide();
              }
            },
            select: function(event, ui) {
              // Bei Auswahl eines Trees, diesen an die Liste anhängen
              $('.status_trees').append('<li>'+ui.item.label+'</li>');
              if(ui.item.id != "all") {
                // Falls es sich um einen bestimmten Tree handelt, "Alle" entfernen
                $('input[name="treetag"]').val($('input[name="treetag"]').val().split("|all").join(""));
                $('.status_trees li:contains("Alle")').remove();
              } else {
                // Falls es sich um "Alle" handelt, alle vorausgewählten entfernen
                $('input[name="treetag"]').val("");
                $('.status_trees li:not(:contains("Alle"))').remove();
              }
              $('input[name="treetag"]').val($('input[name="treetag"]').val()+"|"+ui.item.id);
              $('input[name="status_trees_input"]').val("");
            },
            close: function(event, ui) {
              // Beim Schließen (nachdem ein Tree ausgewählt wurde), die Auswahlmöglichkeiten aktualisieren
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
            // Keydown simulieren, wenn das Feld fokusiert wird, um die Auswahl-Liste direkt anzuzeigen
            var e = jQuery.Event("keydown", { keyCode: 40 });
            $(this).trigger(e);
          });
        } else {
          /**
           * Bei der Tree-Stream-Ansicht können die ausgewählten Trees nicht geändert werden
           */
          $('.status_trees').after('<div style="height: 30px;"></div>');
        }
        
        /**
         * Teilen-Button initialisieren
         */
        $(this).nextAll('input[name="send_post"]').button().click(function() {
          // ausgewählte Trees auslesen
          var chosenTrees = $('input[name="treetag"]').val().substr(1).split("|");
          // sofern "Alle" ausgewählt ist, die ID's aller Trees sammeln
          if(arrayHas(chosenTrees, "all")) {
            chosenTrees = new Array();
            for(var i = 0; i < jsonTrees.length; i++) {
              if(jsonTrees[i].id != "all") {
                chosenTrees.push(jsonTrees[i].id);
              }
            }
          }
          // AJAX-POST absetzen, um den Post an den Server zu senden
          $.ajax({
            url: 'posts',
            type: 'POST',
            dataType: 'json',
            data: {
              'post[user_id]': gon.user_id,
              'post[text]': $('textarea[name="status_update"]').val(),
              'post[likes]': 0,
              'post[dislikes]': 0,
              'post[post_id]': '',
              'post[tree_ids]': chosenTrees
            },
            success: function(newPost) {
              // Bei Erfolg, Status-Update zurücksetzen
              $('textarea[name="status_update"]').val("").trigger("blur").siblings("*").remove();
              // den Post direkt anzeigen
              addPost(newPost);
              // und Abonennten über den neuen Post informieren
              client.publish('/posts/'+gon.user_id, { post_id: newPost.id });
              $('#Stream .post:first').css('backgroundColor', '#DDD').animate({
                'backgroundColor': '#FFF'
              }, 1500);
            }
          });
        });
      } else {
        // Autocomplete und Teilen-Button sind bereits da, es werden nur die vorhandenen Trees neu geladen
        var jsonTrees = new Array();
        $('#navigation a[name^="tree_"]').each(function() {
          var tree_data = $(this).attr("name").split("_");
          jsonTrees.push({ "id": tree_data[1], "label": tree_data[2], "value": tree_data[2] });
        });
        
        $('input[name="status_trees_input"]').autocomplete("option", "source", jsonTrees);
      }
    });
    
    /**
     * FAYE Receiver initialisieren
     *
     * Erstmal alle vorhandenen Trees laden
     */
    $.ajax({
      url: 'trees.json',
      dataType: 'json',
      success: function(trees) {
        for(var i = 0; i < trees.length; i++) {
          for(var j = 0; j < trees[i].users.length; j++) {
            // für jeden User einen Listener auf seinen Channel erstellen
            receiver[trees[i].users[j].id] = client.subscribe('/posts/'+trees[i].users[j].id, function(message) {
              // Wenn der entsprechende User einen Post oder einen Kommentar abschickt, so wird hier die Info darüber ankommen
              if(message.post_id != undefined && message.response_id != undefined) {
                /**
                 * Hier handelt es sich um einen neuen Kommentar
                 *
                 * Prüfen, ob ich den dazugehörigen Post und den Kommentar lesen darf
                 */
                $.ajax({
                  url: 'posts/'+message.response_id+'.json',
                  dataType: 'json',
                  success: function(response) {
                    // Ja, den Post darf ich lesen
                    $.ajax({
                      url: 'posts/'+message.post_id+'.json',
                      dataType: 'json',
                      success: function(post) {
                        /**
                         * Ja, den Kommentar darf ich lesen, also zeige ich ihn an
                         */
                        addComment(post, response, 'after');
                        if($(window).scrollTop() > $('#post_'+message.response_id).offset().top) {
                          /**
                           * Falls ich gerade irgendwo weiter unten lese, wird nur ganz oben eine Benachrichtigung angezeigt.
                           * Dies verhindert ein ungewolltes "herunterschieben" der Seite während dem Lesen.
                           */
                          $('#post_'+message.response_id).hide();
                          showNewPostsAvailable();
                        }
                        // Anzahl der Kommentare im betreffenden Post aktualisieren
                        updateCommentsAmount(message.post_id, post.comments.length);
                      }
                    });
                  }
                });
              }
              if(message.post_id != undefined && message.response_id == undefined) {
                /**
                 * Hier handelt es sich um einen neuen Post
                 *
                 * Prüfen, ob ich den Post lesen darf
                 */
                $.ajax({
                  url: 'posts/'+message.post_id+'.json',
                  dataType: 'json',
                  success: function(post) {
                    /**
                     * Ja, den Post darf ich lesen, also zeige ich ihn an
                     */
                    addPost(post);
                    if($(window).scrollTop() > $('#post_'+message.post_id).offset().top) {
                      /**
                       * Wieder die Prüfung, ob ich irgendwo weiter unten lese
                       */
                      $('#post_'+message.post_id).hide();
                      showNewPostsAvailable();
                    }
                  }
                });
              }
            });
          }
        }
      }
    });
    
    /**
     * Main-Stream initialisieren
     */
    
    var posts = new Array();
    
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
    
    // Post-Datum-Aktualisierung starten
    refreshPostTimeAgo();
  }
});

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
          }
        });
      }
    });
    refreshPostTimeAgo();
  }, autoRefreshRate);
}

/**
 * Dient als Cache, damit die grundlegenden User-Infos nicht für jeden neuen Post/Kommentar neu geladen werden
 */
var users = new Array();

var checkUserCache = function(id) {
  if(users[id] == undefined) {
    $.ajax({
      async: false,
      url: 'users/'+id+'.json',
      dataType: 'json',
      success: function(u) {
        users[u.id] = u;
      }
    });
  }
  return users[id];
}

/**
 * Fügt einen Post an den Anfang des Streams hinzu
 */
var addPost = function(p) {
  // User-Cache prüfen
  var u = checkUserCache(p.user_id);
  // HTML hinzufügen
  $('#Stream').prepend('<div id="post_'+p.id+'" class="post"><div class="post_user" onclick="showProfile('+u.id+')"><span class="post_avatar"><img src="'+u.image+'" width="32" /></span> '+u.firstname+' '+u.name+'</div><div class="post_date">'+p.time_ago+'</div><div class="post_text">'+p.text+'</div><span class="post_toggle"></span><div class="post_actions"><span class="post_like" title="Likes"><img src="assets/like.png" onclick="like('+p.id+')" /><span class="post_like_amnt">'+p.likes+'</span></span> <span class="post_dislike" title="Dislikes"><img src="assets/dislike.png" onclick="dislike('+p.id+')" /><span class="post_dislike_amnt">'+p.dislikes+'</span></span> - <span class="post_comment">'+p.comments.length+' Kommentar'+(p.comments.length != 1 ? 'e' : '')+'</span> <span class="do_comment" onclick="comment('+p.id+')">Kommentieren</span></div></div>');
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
    $('#post_'+p.id).append('<div class="post_admin ui-state-default ui-corner-all"><span class="ui-icon ui-icon-triangle-1-s"></span></div>')
    $('#post_'+p.id+' .post_admin').hover(
      function() { $(this).addClass('ui-state-hover'); }, 
      function() { $(this).removeClass('ui-state-hover'); }
	).click(function() {
      if($('.post_admin_actions').length == 0) {
        $(this).after('<div class="post_admin_actions"><ul><li>bearbeiten</li><li>löschen</li></ul></div>');
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
          var id = $('.post_admin_actions').data('post_id');
          $('#post_'+id+' .post_text')
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
          console.log("YES");
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
  insertAfter.after('<div id="post_'+c.id+'" class="comment"><div class="post_user" onclick="showProfile('+u.id+')"><span class="post_avatar"><img src="'+u.image+'" width="32" /></span> '+u.firstname+' '+u.name+'</div><div class="post_date">'+c.time_ago+'</div><div class="post_text">'+c.text+'</div><span class="post_toggle"></span><div class="post_actions"><span class="post_like" title="Likes"><img src="assets/like.png" onclick="like('+c.id+')" /><span class="post_like_amnt">'+c.likes+'</span></span> <span class="post_dislike" title="Dislikes"><img src="assets/dislike.png" onclick="dislike('+c.id+')" /><span class="post_dislike_amnt">'+c.dislikes+'</span></span></div></div>');
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
  $('#post_'+id).append("<div class='write_comment'><textarea cols='50' name='comment_text'></textarea><br /><input type='button' onclick='sendComment("+id+")' value='Abschicken' /><input type='button' name='cancel_comment' value='Abbrechen' /></div>");
  $('#post_'+id+' .write_comment input[name="cancel_comment"]').click(function() {
    $('.write_comment').remove();
  });
  makeTextareaGrowable($('#post_'+id+' .write_comment textarea[name="comment_text"]'));
  $('#post_'+id+' .write_comment input[type="button"]').button();
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
  $('#post_'+id+' .post_comment').html(amnt+' Kommentar'+(amnt != 1 ? 'e' : ''));
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