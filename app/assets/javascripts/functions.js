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
 * Zeigt einen modalen Ladebildschirm
 */
var showLoading = function() {
  $('body').append('<div id="modal_loading"><div><img src="assets/loading_big.gif" /> Bitte warte einen Augenblick. Gleich geht es weiter!</div></div>');
  $('#modal_loading').css({
    'position': 'fixed',
    'top': 0,
    'left': 0,
    'width': $(window).width(),
    'height': $(window).height(),
    'backgroundColor': 'rgba(0,0,0,0.6)',
    'zIndex': '100000',
    'textAlign': 'center'
  });
  $('#modal_loading > div').css({
    'position': 'relative',
    'height': '32px',
    'width': '500px',
    'padding': '4px',
    'borderRadius': '4px',
    'verticalAlign': 'middle',
    'lineHeight': '32px',
    'background': '#FFF',
    'top': $(window).height()/2-20,
    'left': ($(window).width()/2)-250,
    'boxShadow': '0px 0px 16px #000'
  });
  $('#modal_loading > div > img').css({
    'verticalAlign': 'middle'
  });
}

/**
 * Blendet den modalen Ladebildschirm wieder aus
 */
var hideLoading = function() {
  $('#modal_loading').fadeOut('fast', function() {
    $(this).remove();
  });
}

/**
 * Zeigt den durch str verknüpften Inhalt auf der Seite an.
 */
var show = function(str) {
  $('textarea[name="status_update"]').val("").trigger("blur").siblings("*").remove();
  if($('#'+str).length > 0) {
    $('#content > div').hide();
    $('#'+str).show();
    $('#navigation').find('a').removeClass('active');
    $('#navigation').find('a[name="'+str+'"]').addClass('active');
    if(str == "Startseite") {
      $('#Stream').prev('h3').text("Stream");
      $('#actions').html('');
      loadPosts();
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
              $('#tree_users_list').append('<div class="user" name="'+u.id+'"><span class="remove" style="float: right; z-index: 1000;" title="Aus \''+tree.title+'\' entfernen"><i class="icon-remove"></i></span><img src="'+u.image+'" width="32" /> '+u.firstname+' '+u.name+'</div>');
              $('#tree_users_list .user:last').data({
                'tree': tree,
                'user': u
              }).click(function(e) {
                switch(e.target.className) {
                  case "user":
                    showProfile($(this).attr("name"));
                    $('#tree_users_list').dialog("close");
                    break;
                }
              });
              
              $('#tree_users_list .user:last .remove').data({
                'tree': tree,
                'user': u
              }).click(function() {
                var item = $(this).parents('.user');
                var rm_user = $(this).data('user');
                var t = $(this).data('tree');
                var conf = confirm("Möchten Sie "+rm_user.firstname+" "+rm_user.name+" wirklich aus diesem Tree entfernen?");
                if(conf) {
                  var user_ids = new Array();
                  for(var i = 0; i < $(this).parents('#tree_users_list').find('.user').length; i++) {
                    var u = $(this).parents('#tree_users_list').find('.user:eq('+i+')').data('user');
                    if(u.id != rm_user.id) {
                      user_ids.push(u.id);
                    }
                  }
                  $.ajax({
                    url: 'trees/'+t.id+'.json',
                    type: 'PUT',
                    dataType: 'json',
                    data: {
                      'tree[user_ids]': user_ids
                    },
                    success: function(r) {
                      item.slideUp(400, function() {
                        $(this).remove();
                        receiver[rm_user.id].cancel();
                        $('#actions span:first').text(user_ids.length+' '+(user_ids.length == 1 ? "Person" : "Personen"));
                      });
                    },
                    error: function(e) {
                      console.log(e);
                    }
                  });
                }
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
  if(str != 'Profil') {
    $('div[id^="profilePost_"]').remove();
    $('#Profil').empty();
  }
}

/**
 * Zeigt das Benutzerprofil des Benutzer mit der ID user_id
 */
var showProfile = function(user_id) {
  var args = arguments;
  // Profil-Beiträge wieder in den Stream einfügen
  loadPosts();
  $.ajax({
    url: 'users/'+user_id+'.json',
    dataType: 'json',
    success: function(u) {
      $('#Profil').html("<h3>"+u.firstname+" "+u.name+"</h3>"+
                        "<div class='profile_image'><img src='"+u.image+"' width='64' /></div>"+
                        "<div class='profile_menu'>"+
                        "<ul>"+
                        "<li><a href='#u:"+u.id+"'><i class='icon-list'></i> Beiträge</a></li>"+
                        "<li><a href='#u:"+u.id+"_1'><i class='icon-user'></i> Über mich</a></li>"+
                        "<li><a href='#u:"+u.id+"_2'><i class='icon-picture'></i> Fotos</a></li>"+
                        "<span style='clear: left;'></span>"+
                        "</ul>"+
                        "</div>"+
                        "<div class='profile_posts'></div>"+
                        "<div class='profile_about'></div>"+
                        "<div class='profile_photos'>"+
                        " <div class='photos_loading'><img src='assets/loading_big.gif' /></div>"+
                        " <div class='gallery'>"+
                        "  <div class='thumbs'></div>"+
                        "  <div class='pic'></div>"+
                        "  <div class='description'></div>"+
                        "  <div class='comments'></div>"+
                        " </div>"+
                        "</div>"+
                        "<br style='clear: left;' />");
      
      /**
       * Gravatar-Login-Link einblenden, wenn das eigene Profil aufgerufen wird und das Bild mit der Maus überfahren wird
       */
      if(u.id == gon.user_id) {
        $('.profile_image img').hover(function() {
          if($('.editGravatar').length == 0) {
            $(this).after('<span class="editGravatar"><a href="https://de.gravatar.com/site/login/" target="_blank"><i class="icon-edit"></i></a></span>');          }
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
        if($('#post_'+p.id).length > 0) {
          if($('#post_'+p.id).prev('div[id^="post_"]').length > 0) {
            $('#post_'+p.id).data('after', $('#post_'+p.id).prev('div[id^="post_"]'));
          } else {
            $('#post_'+p.id).data('prepend', $('#Stream'));
          }
        }
        var comments = $('#post_'+p.id).nextAll('.post').length > 0 ? $('#post_'+p.id).nextUntil('.post') : $('#post_'+p.id).nextAll('.comment');
        $('#post_'+p.id).prependTo('.profile_posts');
        comments.insertAfter($('#post_'+p.id));
      }
      
      if(u.id == gon.user_id) {
        /* Privatsphären-Einstellung einfügen */
        $('.profile_about').append('<div class="profile_actions"><label for="privacy_setting">Privatsphäre</label></div>');
        $('.profile_actions').append('<select name="privacy_setting"><option value="0">für alle registrierten Nutzer sichtbar</option><option value="1">nur für Kontake sichtbar</option></select>');
        switch(u.privacy_setting) {
          case 1:
            $('select[name="privacy_setting"] option[value="1"]').attr("selected", "selected");
            break;
          default:
            $('select[name="privacy_setting"] option[value="0"]').attr("selected", "selected");
            break;
        }
        $('select[name="privacy_setting"]').bind('change', function() {
          $.ajax({
            url: 'users',
            type: 'PUT',
            data: {
              'user[privacy_setting]': $('select[name="privacy_setting"]').val()
            },
            dataType: 'json',
            success: function(r) {
              makeToast("Privatsphären-Einstellungen wurden erfolgreich übernommen.");
            },
            error: function(e) {
              makeToast("Ein Fehler ist aufgetreten. Bitte versuche es später erneut.");
            }
          });
        });
      }
      
      /* Profil-Informationen einfügen */
      $('.profile_about').append('<div class="profile_info"></div>');
      if(u.about_me) {
        var c = 0;
        for(var i in u.about_me) {
          if(u.about_me[i] != null && u.about_me[i].trim() != "") {
            c++;
            var label = "";
            switch(i) {
              case "books":
                label = "Bücher";
                break;
              case "food":
                label = "Essen";
                break;
              case "github":
                label = "Github";
                break;
              case "likes":
                label = "Ich mag";
                break;
              case "movies":
                label = "Filme";
                break;
              case "music":
                label = "Musik";
                break;
              case "twitter":
                label = "Twitter";
                break;
            }
            $('.profile_info').append('<label for="'+i+'">'+label+'</label><span name="'+i+'">'+u.about_me[i]+'</span>');
          }
        }
        if(c == 0) {
          $('.profile_info').append('<br /><span class="profile_message">'+u.firstname+' hat noch keine Informationen über sich eingegeben.</span>');
        }
      } else {
        $('.profile_info').append('<br /><span class="profile_message">'+u.firstname+' hat noch keine Informationen über sich eingegeben oder teilt diese nur mit seinen Kontakten.</span>');
      }
      
      if(u.id == gon.user_id) {
        $('.profile_actions').append('<label for="profile_edit">Profil-Informationen</label><button name="profile_edit"><i class="icon-edit"></i> bearbeiten</button>');
        $('.profile_actions button').button().click(function() {
          $('.profile_info .profile_message').hide();
          $(this).hide();
          $(this).after('<button name="profile_save"><i class="icon-ok"></i> speichern</button>');
          $('.profile_actions button[name="profile_save"]').button().click(function() {
            showLoading();
            $.ajax({
              url: 'users.json',
              type: 'PUT',
              dataType: 'json',
              data: {
                'user[books]': $('.profile_info span[name="books"] textarea').val(),
                'user[food]': $('.profile_info span[name="food"] textarea').val(),
                'user[github]': $('.profile_info span[name="github"] textarea').val(),
                'user[likes]': $('.profile_info span[name="likes"] textarea').val(),
                'user[movies]': $('.profile_info span[name="movies"] textarea').val(),
                'user[music]': $('.profile_info span[name="music"] textarea').val(),
                'user[twitter]': $('.profile_info span[name="twitter"] textarea').val()
              },
              success: function(r) {
                $('.profile_actions button[name="profile_save"]').remove();
                $('.profile_actions button').show();
                for(var i in u.about_me) {
                  if($('.profile_info span[name="'+i+'"] textarea').val().trim() != "") {
                    $('.profile_info span[name="'+i+'"]').text($('.profile_info span[name="'+i+'"] textarea').val());
                  } else {
                    $('.profile_info span[name="'+i+'"], label[for="'+i+'"]').remove();
                  }
                }
                if($('.profile_info span[name]:not(:empty)').length == 0) {
                  $('.profile_info .profile_message').show();
                }
                hideLoading();
              },
              error: function(e) {
                console.log(e.responseText);
              }
            });
          });
          for(var i in u.about_me) {
            if($('span[name="'+i+'"]').length > 0) {
              $('span[name="'+i+'"]').wrapInner('<textarea></textarea>');
            } else {
              var label = "";
              switch(i) {
                case "books":
                  label = "Bücher";
                  break;
                case "food":
                  label = "Essen";
                  break;
                case "github":
                  label = "Github";
                  break;
                case "likes":
                  label = "Ich mag";
                  break;
                case "movies":
                  label = "Filme";
                  break;
                case "music":
                  label = "Musik";
                  break;
                case "twitter":
                  label = "Twitter";
                  break;
              }
              $('.profile_info').append('<label for="'+i+'">'+label+'</label><span name="'+i+'"><textarea>'+(u.about_me[i] == null ? "" : u.about_me[i])+'</textarea></span>');
            }
          }
        });
      }
      
      
      
      /* Fotos einfügen */
      window.setTimeout(function() {
        var imgUrl = u.id == gon.user_id ? 'images.json' : 'images/'+u.id+'.json';
        // Fotos laden
        $.ajax({
          url: imgUrl,
          dataType: 'json',
          complete: function() {
            // Lade-Icon im Profil ausblenden
            $('.profile_photos .photos_loading').remove();
          },
          error: function(e) {
            // User hat noch keine Bilder
            $('.profile_photos').html('<br />'+e.responseText.replace("Dieser User", u.firstname));
          },
          success: function(imgs) {
            if(imgs.url) {
              // User muss noch seinen flickr-Account mit treebook verknüpfen
              $.ajax({
                url: 'images',
                success: function(f) {
                  if(u.id == gon.user_id) {
                    $('.profile_photos').append('<br /><span><a href="'+f.url+'">Verknüpfe jetzt deinen Treebook-Account mit <img src="assets/social/flickr16px.png" /> flickr&reg;</a></span>');
                    $('.profile_photos span, .profile_photos span img').css('verticalAlign', 'middle');
                  }
                },
                error: function(e) {
                  $('.profile_photos').html('<br />'+e.responseText.replace("Dieser User", u.firstname));
                }
              });
            } else {
              if(imgs.photosets) {
                // Es sind Alben vorhanden, die angezeigt werden können
                for(var i = 0; i < imgs.photosets.length; i++) {
                  var set = imgs.photosets[i];
                  $('.profile_photos').append('<div class="profile_photoset"><span class="title">'+set.title+'</span></div>');
                  $('.profile_photos .profile_photoset:last').find('.title').data({
                    'height': $('.profile_photos .profile_photoset:last').find('.title').height()
                  });
                  var primary = set.fotos[0].url;
                  for(var j = 0; j < set.fotos.length; j++) {
                    if(set.fotos[j].isprimary == 1) {
                      primary = set.fotos[j].url;
                      break;
                    }
                  }
                  $('.profile_photos .profile_photoset:last').css({
                    'background': 'url("'+primary+'")'
                  }).data('set', set).hover(function() {
                    var set = $(this).data('set');
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
                    $(this).find('.thumbs').slideDown(400);
                  }, function() {
                    $(this).find('.title').animate({
                      'height': $(this).find('.title').data('height')
                    }, 400);
                    $(this).find('.thumbs').slideUp(400, function() {
                      $(this).remove();
                    });
                  }).click(function() {
                    var set = $(this).data('set');
                    $('.profile_photoset').fadeOut();
                    var g = $('.profile_photos .gallery');
                    for(var i = 0; i < set.fotos.length; i++) {
                      g.find('.thumbs').append('<div class="thumb"><a rel="photo_group" href="'+set.fotos[i].url+'" title="'+set.fotos[i].title+'"><img alt="'+set.fotos[i].title+'" src="'+set.fotos[i].url+'" /></a><span class="title"></span></div>');
                      var title = set.fotos[i].title.length > 12 ? set.fotos[i].title.substring(0,12)+"..." : set.fotos[i].title;
                      g.find('.thumb:last').css({
                        'background': 'url("'+set.fotos[i].url+'")'
                      }).data({
                        'description': set.fotos[i].description,
                        'title': set.fotos[i].title,
                        'id': set.fotos[i].id
                      }).find('.title').text(title);
                      g.find('.thumb:last').click(function(e) {
                        var link = $(this).find('a');
                        if(e.target === link[0]) return false;
                        link.trigger('click');
                        return false;
                      });
                    }
                    if(u.id == gon.user_id) {
                      // Foto hinzufügen
                      g.find('.thumbs').append('<div class="upload_photo" title="Fotos diesem Album hinzufügen"><i class="icon-plus"></i></div>');
                      g.find('.thumbs .upload_photo').data({
                        'photoSetId': set.id
                      });
                      g.find('.thumbs .upload_photo').click(function() {
                        $(this).append('<div class="upload_photo_form"></div>');
                        $('.upload_photo_form').load('upload_form form', function() {
                          // Change-Listener auf File-Input setzen
                          $('.upload_photo_form').find('input[name="photo"]').bind('change', function() {
                            var form = $(this).parents('.upload_photo_form').find('form');
                            console.log(this.files);
                            form.find('.selected_file').remove();
                            for(var i = 0; i < this.files.length; i++) {
                              var f = this.files[i];
                              form.append('<div class="selected_file"><b>'+f.name+' ('+(Math.round(f.size/1024/1024*100)/100)+' MB)</b><br /><input type="text" name="title" value="Bild-Titel" /><br /><textarea name="description">Bild-Beschreibung</textarea></div>')
                            }
                          });
                          $('.upload_photo_form form').attr("target", "hiddenUploadFrame");
                          $('.upload_photo_form').append('<iframe name="hiddenUploadFrame" width="1px" height="1px" style="border: 0px; visibility: hidden;"></iframe>');
                          $('.upload_photo_form iframe[name="hiddenUploadFrame"]').load(function() {
                            if($(this).contents().text() != "") {
                              var photoId = parseInt($(this).contents().text());
                              var photoSetId = $('.upload_photo:visible').data('photoSetId');
                              $.ajax({
                                url: 'photosets/add',
                                type: 'POST',
                                data: {
                                  'photoset_id': photoSetId,
                                  'photo_id': photoId
                                },
                                success: function(r) {
                                  $.ajax({
                                    url: 'photo/'+photoId+'.json',
                                    success: function(img) {
                                      console.log(img);
                                      g.find('.thumbs .upload_photo').before('<div class="thumb"><a rel="photo_group" href="'+img.url+'" title="'+img.title+'"><img alt="'+img.title+'" src="'+img.url+'" /></a><span class="title"></span></div>');
                                      var title = img.title.length > 12 ? img.title.substring(0,12)+"..." : img.title;
                                      g.find('.thumb:last').css({
                                        'background': 'url("'+img.url+'")'
                                      }).data({
                                        'description': img.description,
                                        'title': img.title,
                                        'id': img.id
                                      }).find('.title').text(title);
                                      g.find('.thumb:last').click(function(e) {
                                        var link = $(this).find('a');
                                        if(e.target === link[0]) return false;
                                        link.trigger('click');
                                        return false;
                                      });
                                      initFancyBox(g.find('a[rel="photo_group"]'), u);
                                    },
                                    complete: function() {
                                      hideLoading();
                                      $('.upload_photo_form').dialog("close");
                                    }
                                  });
                                },
                                error: function(e) {
                                  console.log(e.responseText);
                                }
                              });
                            }
                          });
                          $('.upload_photo_form').dialog({
                            modal: true,
                            width: 400,
                            buttons: {
                              "Hochladen": function() {
                                showLoading();
                                $(this).find('form').submit();
                              }
                            },
                            close: function() {
                              $(this).empty();
                            }
                          });
                        });
                      });
                    }
                    
                    initFancyBox(g.find('a[rel="photo_group"]'), u);
                    
                    g.prepend('<button name="back_to_photosets"><i class="icon-arrow-left"></i> Zurück</button>');
                    g.find('button[name="back_to_photosets"]').button().click(function() {
                      $('.profile_photos .gallery').fadeOut(function() {
                        $('.profile_photoset').fadeIn();
                        $(this).find('.thumbs, .pic, .description, .comments').empty();
                      });
                      $(this).fadeOut(function() {
                        $(this).remove();
                      });
                    });
                    g.delay(400).fadeIn();
                  });
                }
              }
            }
          }
        });
      }, 1000);
      
      show("Profil");
      
      if(args[1] != undefined) {
        $('.profile_menu li:contains("'+args[1]+'")').click();
        $('#navigation a[name="'+args[1]+'"]').addClass('active');
      } else {
        $('.profile_menu li:contains("Beiträge")').click();
      }
    }
  });
}

var initFancyBox = function(coll, u) {
  // Fancybox initialisieren
  coll.fancybox({
    'cyclic': true,
    'titlePosition': 'inside',
    'titleFormat': function(title, currentArray, currentIndex, currentOpts) {
      var editBtn = gon.user_id == u.id ? '<button name="edit_photo" title="Details bearbeiten"><i class="icon-edit"></i></button>' : "";
      var link = currentArray[currentIndex];
      var description = $(link).parents('.thumb').data('description') == "" ? "Keine Beschreibung vorhanden." : $(link).parents('.thumb').data('description');
      return '<span id="fancybox-title-inside"><input type="hidden" name="photo_id" value="'+$(currentArray[currentIndex]).parents('.thumb').data('id')+'" />'+editBtn+'<b name="title">'+title+'</b><br /><span name="description">'+description+'</span></span>';
    },
    'onComplete': function(currentArray, currentIndex) {
      var photo_id = $(currentArray[currentIndex]).parents('.thumb').data('id');
      
      // Bild Titel und Beschreibung bearbeiten
      $('#fancybox-title-inside button').button().css({
        'float': 'right'
      }).click(function() {
        var title = $('#fancybox-title-inside b').text();
        var descr = $('#fancybox-title-inside span').text();
        $('#fancybox-title-inside b[name="title"]').replaceWith('<input type="text" value="'+title+'" name="title" />');
        $('#fancybox-title-inside span[name="description"]').replaceWith('<textarea style="width: 75%;" rows="4" name="description">'+descr+'</textarea>');
        $(this).hide();
        $(this).after('<button name="save_photo_details"><i class="icon-ok"></i></button>');
        $(this).next('button[name="save_photo_details"]').button().css({
          'float': 'right'
        }).click(function() {
          var photoTitle = $('#fancybox-title-inside input[name="title"]').val();
          var photoDescr = $('#fancybox-title-inside textarea[name="description"]').val();
          
          if(photoTitle == "") {
            photoTitle = "Ohne Titel";
          }
          if(photoDescr == "") {
            photoDescr = "Keine Beschreibung vorhanden.";
          }
          $.ajax({
            url: 'edit_photo.json',
            type: 'POST',
            data: {
              'photo_id': $('#fancybox-title-inside input[name="photo_id"]').val(),
              'title': photoTitle,
              'description': photoDescr
            },
            dataType: 'json',
            success: function(r) {
              $('button[name="save_photo_details"]').remove();
              $('button[name="edit_photo"]').show();
              $('#fancybox-title-inside input[name="title"]').replaceWith('<b name="title">'+photoTitle+'</b>');
              $('#fancybox-title-inside textarea[name="description"]').replaceWith('<span name="description">'+photoDescr+'</span>');
              var shortTitle = photoTitle.length > 12 ? photoTitle.substring(0,12)+"..." : photoTitle;
              $(currentArray[currentIndex]).parents('.thumb').data({
                'title': photoTitle,
                'description': photoDescr
              }).find('.title').text(shortTitle);
            }
          });
        });
        $.fancybox.resize();
      });
      
      var cBox = $('<div class="fancybox-comments"><h3>Kommentare</h3><input type="hidden" name="photo_id" value="'+photo_id+'" /><textarea name="photo_comment"></textarea><span class="loading"><img src="assets/loading_big.gif" /></span></div>');
      cBox.appendTo('body');
      makeTextareaGrowable(cBox.find('textarea'));
      setInputDefault(cBox.find('textarea'), "Schreibe einen Kommentar zu diesem Bild.");
      
      cBox.find('textarea').bind('focus', function() {
        if($(this).nextAll('button[name="send_photo_comment"]').length == 0) {
          $(this).after('<button name="send_photo_comment"><i class="icon-ok"></i> Abschicken</button> <button name="cancel_photo_comment"><i class="icon-remove"></i> Abbrechen</button>');
          $(this).nextAll('button[name="send_photo_comment"]').click(function() {
            var c = $('textarea[name="photo_comment"]').val();
            if(c != "Schreibe einen Kommentar zu diesem Bild.") {
              $.ajax({
                url: 'comment.json',
                type: 'POST',
                data: {
                  'photo_id': $('.fancybox-comments input[name="photo_id"]').val(),
                  'comment_text': c
                },
                dataType: 'json',
                success: function(response) {
                  console.log(response);
                  $('button[name="cancel_photo_comment"]').click();
                  $('.fancybox-comments .no-comments').remove();
                  $('.fancybox-comments textarea').after('<div class="photo_comment"><img src="'+gon.gravatar+'" /><b>'+gon.firstname+' '+gon.lastname+'</b><br /><small>vor weniger als einer Minute</small><p>'+c+'</p></div>');
                }
              });
            }
          });
          $(this).nextAll('button[name="cancel_photo_comment"]').click(function() {
            $(this).add($('button[name="send_photo_comment"]')).remove();
            $('textarea[name="photo_comment"]').val("").trigger('blur');
          });
          $(this).nextAll('button').button();
        }
      });
      
      cBox.css({
        'width': $('#fancybox-wrap').position().left-20,
        'height': $(window).height()-parseInt(cBox.css('paddingTop'))-parseInt(cBox.css('paddingBottom'))
      }).fadeIn('fast');
      
      $.ajax({
        url: 'photo_comments/'+photo_id+'.json',
        dataType: 'json',
        complete: function() {
          $('.fancybox-comments .loading').remove();
        },
        success: function(cmts) {
          if(cmts.length > 0) {
            for(var i = cmts.length-1; i >= 0; i--) {
              if(cmts[i].treebook_id > 0) {
                var user = checkUserCache(cmts[i].treebook_id);
                $('.fancybox-comments').append('<div class="photo_comment"><img src="'+user.image+'" /><b>'+user.firstname+' '+user.name+'</b><br /><small>'+cmts[i].time_ago+'</small><p>'+cmts[i]._content+'</p></div>');
              } else {
                continue;
              }
            }
          } else {
            $('.fancybox-comments').append('<div class="no_photo_comments"><h4>Noch keine Kommentare vorhanden.</h4></div>');
          }
          $('body').css({
            'overflow': 'hidden'
          });
        }
      });
    },
    'onCleanup': function() {
      $('.fancybox-comments').fadeOut('fast', function() { $(this).remove(); });
      $('body').css({
        'overflow': 'auto'
      });
    }
  });
}

var showNotifications = function(arr) {
  if(arr.length > 0) {
    $('#top_notifications > span').text(arr.length);
    $('#top_notifications > i').replaceWith('<i class="icon-envelope"></i>');
    $('#top_notifications').attr("title", arr.length+" neue Benachrichtigung"+(arr.length != 1 ? "en" : ""));
    $('#notification_menu_layer ul > li').remove();
    for(var i in arr) {
      $('#notification_menu_layer ul').append('<li><a>'+arr[i].message+'</a></li>');
    }
  }
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