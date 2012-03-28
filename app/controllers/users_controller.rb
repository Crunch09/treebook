class UsersController < ApplicationController
	require 'flickraw'

	before_filter :authenticate_user!, :except => 'index'


	FlickRaw.api_key= "42026bbf6f026bb43201488328dd61b0"
	FlickRaw.shared_secret= "043bd220b6b52509"

	#GET /users
	#GET /users.json
	def index
		@users = User.all
		unless current_user.nil?
			gon.user_id = current_user.id
		end

		respond_to do |format|
			format.html { redirect_to new_user_session_path if current_user.nil? }
			format.json { render json: @users }
		end
	end

	#GET /users/#id
	#GET /users/#id.json
	def show
		@user = User.find params[:id]
		current_user.posts_by_user = params[:id]
		current_user.save
		User.current = current_user
		respond_to do |format|
				format.json {render json: @user.as_json(:methods => [:image, :shared_posts],
													:except => [:access_secret, :access_token] )}
		end
	end

	#GET /images
	#GET /images.json
	def images
		flickr = FlickRaw::Flickr.new

		if params[:id].nil?
			#eigene Bilder anzeigen
			unless current_user.got_flickr_connection?
				token = flickr.get_request_token(:oauth_callback => 'http://localhost:3000/flickrcallback')
		  		session[:token] = token
		  		# You'll need to store the token somewhere for when the user is returned to the callback method
		  		# I stick mine in memcache with their session key as the cache key
		  		@auth_url = flickr.get_authorize_url(token['oauth_token'], :perms => 'write')
	  		else
		  		flickr.access_token = current_user.access_token
		  		flickr.access_secret = current_user.access_secret
		  		@photosets = flickr.photosets.getList
	  		end
	  	else
	  		#pruefen ob dieser User eine Flickr-Id besitzt
	  		u = User.find params[:id]
	  		if u.flickr_id.nil?
	  			redirect_to root_url
	  			return
	  		else
	  			flickr.access_token = u.access_token
		  		flickr.access_secret = u.access_secret
		  		@photosets = flickr.photosets.getList
		  	end
		end
		

	  	respond_to do |format|
			format.html 
			format.json { render json: @photosets }
	  	end
	end

	#ein Photoset anzeigen
	def gallery
		flickr = FlickRaw::Flickr.new
		@photos = flickr.photosets.getPhotos(:photoset_id => params[:id]).photo
		respond_to do |format|
			format.html
			format.json { render json: @photos}
		end
	end

	#ein foto anzeigen
	def photo
		flickr = FlickRaw::Flickr.new
		flickr.access_token = current_user.access_token
	  	flickr.access_secret = current_user.access_secret
		@photo = flickr.photos.getInfo(:photo_id => params[:id])
		# TODO das sollte verschoben werden
		flickr.photos.comments.addComment(:photo_id => params[:id], :comment_text => "Ein weiterer Test")
		respond_to do |format|
			format.html
			format.json { render json: @photo}
		end
	end

	# Nach der Authentifizierung schickt Flickr die Antwort an diese Action
	def flickrcallback

	      flickr = FlickRaw::Flickr.new

		  oauth_token = params[:oauth_token]
		  oauth_verifier = params[:oauth_verifier]

		  raw_token = flickr.get_access_token(session[:token]['oauth_token'], session[:token]['oauth_token_secret'], oauth_verifier)
		  # raw_token is a hash like this {"user_nsid"=>"92023420%40N00", "oauth_token_secret"=>"XXXXXX", "username"=>"boncey", "fullname"=>"Darren%20Greaves", "oauth_token"=>"XXXXXX"}
		  # Use URI.unescape on the nsid and name parameters

		  current_user.access_token = raw_token["oauth_token"]
		  current_user.access_secret = raw_token["oauth_token_secret"]

		  flickr.access_token = current_user.access_token
	  	  flickr.access_secret = current_user.access_secret

	  	  login = flickr.test.login
	  	  current_user.flickr_id = login.id
	  	  current_user.save

		  flash[:notice] = "Deine Fotos sind jetzt mit Treebook verbunden!"
		  redirect_to images_path
	end

	def search
		if params[:keyword].nil?
			respond_to do |format|
				format.json { render json: "Bitte gib erstmal etwas ein", status: :unprocessable_entity}
			end
		else
			keyword = params[:keyword].chomp
			keywords = keyword.split(' ', 2)
			if keywords.count == 1
				@matches = User.find(:all, :conditions => ["firstname LIKE ? OR name LIKE ? ", "#{keywords.first}%", "#{keywords.first}%"])
			else
				@matches = User.find(:all, :conditions => ["firstname LIKE ? AND name LIKE ? ", "#{keywords.first}%", "#{keywords[1]}%"])
			end
			respond_to do |format|
				format.json { render json: @matches.to_json(:only => [:firstname, :name, :id])}
			end
		end
		
	end

end
