class UsersController < ApplicationController
  require 'flickraw'

  before_filter :authenticate_user!, :except => 'index'


  FlickRaw.api_key= "42026bbf6f026bb43201488328dd61b0"
  FlickRaw.shared_secret= "043bd220b6b52509"

  # Public: Wird als Startseite benutzt
  #
  # Beispiele:
  #
  #  GET /users
  #  GET /users.json
  #
  # Gibt die Startseite zurück und eine Meldung, falls kein User eingeloggt ist
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

  # Public: Infos zu einem User
  #
  # id - Id des Users
  #
  # Beispiel:
  #
  #  GET /users/#id.json
  #
  # Gibt Usereigenschaften zurück
  def show
    @user = User.find params[:id]
    current_user.posts_by_user = params[:id]
    @user.gravatar_size = 64
    current_user.save
    User.current = current_user
    respond_to do |format|
        format.json {render json: @user.as_json(:methods => [:image, :shared_posts],
                          :except => [:access_secret, :access_token] )}
    end
  end

  # Public: Stellt Infos zu allen Flickr-Photosets eines Users bereitet
  #
  # id - Id des Users, standardmäßig der eingeloggte User
  #
  # Beispiele: 
  # 
  #  GET /images.json
  #
  # Gibt Photosets und darin enthalene Bilder eines Users zurück bzw.
  # einen Link um eine Flickr-Verbindung zu erstellen
  def images
    flickr = FlickRaw::Flickr.new

    u = params[:id].nil? ? current_user : User.find(params[:id])
    #pruefen, ob dieser User eine flickr-Connection besitzt
    if u.got_flickr_connection?
      @album = u.get_photos
    else
      #pruefen, ob dieser User der angemeldete User ist
      if u.id == current_user.id
        token = flickr.get_request_token(:oauth_callback => 'http://localhost:3000/flickrcallback')
        session[:token] = token
        # You'll need to store the token somewhere for when the user is returned to the callback method
        # I stick mine in memcache with their session key as the cache key
        @auth_url = Hash.new
        @auth_url[:url] = flickr.get_authorize_url(token['oauth_token'], :perms => 'write')
      else
        @error_msg = "Dieser User hat leider noch keine Bilder hier."
      end
    end
    
    respond_to do |format|
      if !@album.nil? 
        format.json { render json: @album }
      elsif !@auth_url.nil?
        format.json { render json: @auth_url }
      else
        format.json { render json: @error_msg, status: :unprocessable_entity }
      end
    end
  end

  # Public: Ein Foto zu Flickr hochladen
  #
  # photo - Photo, welches hochgeladen werden soll
  # title - Der Titel des Photos
  # description - Beschreibung des Photos
  #
  # Gibt die Id des hochgeladenen Fotos oder eine Fehlermeldung zurück
  def upload_photo
    flickr = FlickRaw::Flickr.new

    if current_user.got_flickr_connection?
      flickr.access_token = current_user.access_token
      flickr.access_secret = current_user.access_secret
      @response = flickr.upload_photo params[:photo], :title => params[:title], :description => params[:description]
    else
      @response = "Du hast leider noch keine Flickr-Verbindung hergestellt"
    end

    respond_to do |format|
      format.json { render json: @response }
    end
  end

  # Public: Kommentare zu einem Foto laden
  #
  # id - Id des Fotos
  #
  # Beispiele:
  #
  #  GET /photo_comments/12345.json
  #
  # Gibt die Kommentare für das Foto mit der übergebenen Id zurück
  def photo_comments
    flickr = FlickRaw::Flickr.new
    if params[:id].nil?
      respond_to do |format|
        format.json { render json: "Bitte gib eine Photo-Id an", status: :unprocessable_entity }
      end
    else
      @comments = Hash.new
      @comments[:comments] = flickr.photos.comments.getList :photo_id => params[:id]
      #überprüfen, ob überhaupt Kommentare vorhanden sind
      if @comments[:comments].to_hash.has_key?("comment")
        #Falls möglich den Autor des Kommentars mit dem entsprechenden
        #Treebook-User verknüpfen
        @comments[:comments].each do |c|
          u = User.where(:flickr_id => c.author)
          unless u.empty?
            c.to_hash[:treebook_id] = u.first.id
          end
        end
      else
        @comments[:comments] = []
      end
      respond_to do |format|
        format.json { render json: @comments[:comments] }
      end
    end
  end

  # Public: Einen Kommentar zu einem Foto verfassen
  #
  # photo_id - Id des Fotos
  # comment_text - Kommentar
  #
  # Beispiele:
  #
  #  POST /comment
  #
  # Gibt die Id des Kommentars oder eine Fehlermeldung zurück
  def comment
    flickr = FlickRaw::Flickr.new

    flickr.access_token = current_user.access_token
    flickr.access_secret = current_user.access_secret

    if params[:photo_id].nil? || params[:comment_text].nil?
      respond_to do |format|
        format.json { render json: "Bitte gib ein Foto und einen Kommentar an", status: :unprocessable_entity}
      end
      return
    else
      @comment = flickr.photos.comments.addComment(:photo_id => params[:photo_id],
                                                   :comment_text => params[:comment_text])
      respond_to do |format|
        format.json { render json: @comment }
      end
    end
  end

  # Public: Titel und Beschreibung eines Fotos aktualisieren
  #
  # title - Neuer Titel des Fotos
  # description - Neue Beschreibung des Fotos
  #
  # Beispiele:
  #
  #  POST /edit_photo/12345.json
  #
  # Gibt ein leere Antwort oder eine Fehlermeldung zurück
  def edit_photo

    flickr = FlickRaw::Flickr.new
    flickr.access_token = current_user.access_token
    flickr.access_secret = current_user.access_secret

    if params[:photo_id].nil? || params[:title].nil? || params[:description].nil?
      respond_to do |format|
        format.json { render json: "Bitte gib ein Foto, Titel und Kommentar an", status: :unprocessable_entity}
      end
      return
    else
      @comment = flickr.photos.setMeta(:photo_id => params[:photo_id],
                                       :title => params[:title],
                                       :description => params[:description])
      respond_to do |format|
        format.json { render json: @comment }
      end
    end
  end



  # Public: Nach der Authentifizierung schickt Flickr
  #         die Antwort an diese Action
  # 
  # oauth_token - OAuth-token von Flickr
  # oauth_verifier - OAuth-Verifizierung von Flickr
  #
  # Leitet zum images_path weiter
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

  # Public: Sucht alle User, die auf das Suchwort passen
  #
  # keyword - Suchstring
  #
  # Gibt alle Treffer zurück
  def search
    if params[:keyword].nil?
      respond_to do |format|
        format.json { render json: "Bitte gib erstmal etwas ein", status: :unprocessable_entity}
      end
    else
      keyword = params[:keyword].chomp
      keywords = keyword.split(' ', 2)
      if keywords.count == 1
        # wenn nur ein Wort übergeben wurde, 
        # nach Vor- oder Nachname suchen
        @matches = User.find(:all, :conditions => ["firstname LIKE ? OR name LIKE ? ", "#{keywords.first}%", "#{keywords.first}%"])
      else
        @matches = User.find(:all, :conditions => ["firstname LIKE ? AND name LIKE ? ", "#{keywords.first}%", "#{keywords[1]}%"])
      end
      respond_to do |format|
        format.json { render json: @matches.to_json(:only => [:firstname, :name, :id], :methods => [:image])}
      end
    end
    
  end

end
