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

var initMusicPlayer() {
  var playlist = {
		mp3:'/assets/media/intro_music.mp3',
		oga:'/assets/media/intro_music.ogg',
        rating:4.5,
        title:'Threshold (8-bit)',
        duration:'1:50',
        artist:'Brian LeBarton'
	};
	
	$('#player').ttwMusicPlayer(myPlaylist,
	  {
      tracksToShow:1,
      autoPlay:true,
      ratingCallback:function(index, playlistItem, rating){
              //some logic to process the rating, perhaps through an ajax call
      },
      jPlayer:{} //override default jPlayer options here. This accepts the same structure as the standalone jPlayer
	  }
	);
}
