
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
      var searchTag = $(this).val();
      if(searchTag.length > 2) {
        $.ajax({
          url: 'search/'+searchTag+'.json',
          dataType: 'json',
          success: function(result) {
            $('.friendresult').empty();
            for(var i = 0; i < result.length; i++) {
              $('.friendresult').append('<div class="user" id="searchresult_'+result[i].id+'"><img src="'+result[i].image+'" height="24px" />'+result[i].firstname+' '+result[i].name+'</div>');
              $('#searchresult_'+result[i].id).click(function() {
                if(!$(this).data('drag')) {
                  var id = $(this).attr("id").split("_")[1];
                  showProfile(id);
                }
              }).draggable({
                containment: '#main',
                revert: function(drop) {
                  if(drop !== false) {
                    if(drop.is('#navigation a[name^="tree_"]')) {
                      $(this).fadeOut(200);
                    }
                  }
                  return true;
                },
                start: function(event, ui) {
                  $(this).data('drag', true).css({
                    'zIndex': '10',
                    'backgroundColor': 'rgba(255,255,255,0.4)',
                    'border': '1px dashed #555'
                  });
                  $('#navigation a[name^="tree_"]').droppable({
                    activate: function(event, ui) {
                      $(this).css({
                        'border': '1px dashed #555',
                        'marginTop': '-1px'
                      });
                    },
                    deactivate: function(event, ui) {
                      $(this).css({
                        'border': 'none',
                        'marginTop': '0px'
                      });
                    },
                    over: function(event, ui) {
                      if(!$(this).hasClass('active')) {
                        $(this).css({
                          'backgroundColor': '#EFEFEF'
                        });
                      }
                    },
                    out: function(event, ui) {
                      if(!$(this).hasClass('active')) {
                        $(this).css({
                          'backgroundColor': '#FFFFFF'
                        });
                      }
                    },
                    drop: function(event, ui) {
                      var treeUI = $(this);
                      if(!$(this).hasClass('active')) {
                        $(this).css({
                          'backgroundColor': '#FFFFFF'
                        });
                      }
                      var user = $('#'+ui.draggable.context.id);
                      var userid = user.attr("id").split("_")[1];
                      var treeid = $(this).attr("name").split("_")[1];
                      $.ajax({
                        url: 'trees/'+treeid+'.json',
                        dataType: 'json',
                        success: function(tree) {
                          var userids = [];
                          for(var u in tree.users) {
                            userids.push(tree.users[u].id);
                          }
                          if(arrayHas(userids, userid)) {
                            makeToast(user.text()+" ist bereits in diesem Tree.")
                          } else {
                            userids.push(userid);
                            $.ajax({
                              url: 'trees/'+treeid+'.json',
                              type: 'PUT',
                              data: {
                                'tree[user_ids]': userids
                              },
                              success: function(response) {
                                makeToast(user.text()+" ist jetzt in "+tree.title);
                              },
                              error: function(e) {
                                console.log(e);
                              }
                            });
                          }
                        }
                      });
                    }
                  });
                },
                stop: function(event, ui) {
                  $(this).fadeIn();
                  $(this).data('drag', false).css({
                    'zIndex': '1',
                    'backgroundColor': '#FFFFFF',
                    'border': 'none'
                  });
                }
              });
            }
          }
        });
      } else {
        $('.friendresult').empty();
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
    
    // Post-Datum-Aktualisierung starten
    refreshPostTimeAgo();
  }
});

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