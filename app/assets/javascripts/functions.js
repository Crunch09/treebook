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

var initMusicPlayer = function() {
  var playlist = [
    {
		  mp3: 'http://amazonm-931.vo.llnwd.net/s/d12/101600/101600884/217659931_S64.mp3?marketplace=4&e=1329304180&h=43dcf364783e98df8c77fda7f4dc0a72',// /assets/intro_music.mp3',
		  //oga: '/assets/intro_music.ogg',
      buy: 'http://www.amazon.de/Threshold-8-Bit/dp/B003XTWCXS/ref=sr_1_1?ie=UTF8&qid=1329298546&sr=8-1',
      rating: 5.0,
      title: 'Threshold (8-bit)',
      duration: '0:30',
      artist: 'Brian LeBarton',
      cover: '/assets/threshold_8bit_cover.jpg'
    }
	];
	
	$('#player').ttwMusicPlayer(playlist,
	  {
      tracksToShow: 1,
      autoPlay: true,
      ratingCallback:function(index, playlistItem, rating){
              //some logic to process the rating, perhaps through an ajax call
      },
      jPlayer:{
        solution: "flash,html",
        swfPath: "/assets",
        loop: true
      } //override default jPlayer options here. This accepts the same structure as the standalone jPlayer
	  }
	);
}
