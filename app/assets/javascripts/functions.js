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
                        "<li><i class='icon-list'></i> Beiträge</li>"+
                        "<li><i class='icon-user'></i> Über mich</li>"+
                        "<li><i class='icon-picture'></i> Fotos</li>"+
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
            $('.profile_photos').append('<br />'+e.responseText.replace("Dieser User", u.firstname));
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
                  $('.profile_photos').append('<br />'+e.responseText.replace("Dieser User", u.firstname));
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
                    g.find('a[rel="photo_group"]').fancybox({
                      'cyclic': true,
                      'titlePosition' 	: 'inside',
                      'titleFormat'		: function(title, currentArray, currentIndex, currentOpts) {
                        var editBtn = gon.user_id == u.id ? '<button name="edit_photo" title="Details bearbeiten"><i class="icon-edit"></i></button>' : "";
                        var link = currentArray[currentIndex];
                        var description = $(link).parents('.thumb').data('description') == "" ? "Keine Beschreibung vorhanden." : $(link).parents('.thumb').data('description');
                        return '<span id="fancybox-title-inside">'+editBtn+'<b name="title">'+title+'</b><br /><span name="description">'+description+'</span></span>';
                      },
                      'onComplete': function(currentArray, currentIndex) {
                        var photo_id = $(currentArray[currentIndex]).parents('.thumb').data('id');
                        
                        // Bild Titel und Beschreibung bearbeiten
                        $('#fancybox-title-inside button').button().css({
                          'float': 'right'
                        }).click(function() {
                          var title = $('#fancybox-title-inside b').text();
                          var descr = $('#fancybox-title-inside span').text();
                          $('#fancybox-title-inside b[name="title"]').replaceWith('<input type="text" value="'+title+'" name="'+$(this).attr("name")+'" />');
                          $('#fancybox-title-inside span[name="description"]').replaceWith('<textarea style="width: 75%;" rows="4" name="'+$(this).attr("name")+'">'+descr+'</textarea>');
                          $(this).hide();
                          $(this).after('<button name="save_photo_details"><i class="icon-ok"></i></button>');
                          $(this).next('button[name="save_photo_details"]').button().click(function() {
                            var title = $('#fancybox-title-inside input[name="title"]').val();
                            var descr = $('#fancybox-title-inside textarea[name="description"]').val();
                            
                            if(title == "") {
                              title = "Ohne Titel";
                            }
                            if(descr == "") {
                              descr = "Keine Beschreibung vorhanden.";
                            }
                            
                            $.ajax({
                              url: 'edit_photo',
                              type: 'POST',
                              data: {
                                'photo_id': $('#fancybox-title-inside input[name="photo_id"]').val(),
                                'title': title,
                                'description': descr
                              },
                              dataType: 'json',
                              success: function(r) {
                                console.log(r);
                                $('button[name="save_photo_details"]').remove();
                                $('button[name="edit_photo"]').show();
                                $('#fancybox-title-inside input[name="title"]').replaceWith('<b name="'+$(this).attr("name")+'">'+title+'</b>');
                                $('#fancybox-title-inside textarea[name="description"]').replaceWith('<span name="'+$(this).attr("name")+'">'+descr+'</span>');
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
                                    $('.fancybox-comments textarea').after('<div class="photo_comment"><img src="'+gon.image+'" /><b>'+gon.firstname+' '+gon.name+'</b><br /><small>vor weniger als einer Minute</small><p>'+c+'</p></div>');
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
                        /*
                        $('#fancybox-title-inside > b[contenteditable]').data('title', $('#fancybox-title-inside > b[contenteditable]').text());
                        $('#fancybox-title-inside > b[contenteditable]').bind('focus', function() {
                          $(this).after('<input type="button" name="savePhotoTitle" value="Speichern" />');
                          $(this).next('input[name="savePhotoTitle"]').click(function() {
                            var ed = $(this).prev('b[contenteditable]');
                            if(ed.text() != ed.data('title')) {
                              makeToast("Der Titel wurde gespeichert.");
                            }
                            ed.trigger('focusout');
                            $(this).remove();
                          });
                        });
                        */
                      },
                      'onCleanup': function() {
                        $('.fancybox-comments').fadeOut('fast', function() { $(this).remove(); });
                        $('body').css({
                          'overflow': 'auto'
                        });
                      }
                    });
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
    $('li:has(a[name="addTree"])').before('<li style="display: none"><input type="text" name="newTree" value="" size="25" /><button name="saveNewTree"><i class="icon-ok"></i></button><button name="discardNewTree"><i class="icon-remove"></i></button>');
    var nTree = $('input[name="newTree"]');
    setInputDefault(nTree, "Mein neuer Tree");
    nTreeBt = nTree.next('button[name="saveNewTree"]');
    nTreeBtDis = nTreeBt.next('button[name="discardNewTree"]');
    
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