class UsersController < ApplicationController
  require 'flickraw'

  before_filter :authenticate_user!, :except => 'index'


  FlickRaw.api_key= "42026bbf6f026bb43201488328dd61b0"
  FlickRaw.shared_secret= "043bd220b6b52509"

  PRIVACY = {
        everyone: 0,
        restricted: 1
  }

  flickr = FlickRaw::Flickr.new

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
    if user_signed_in?
      gon.user_id = current_user.id
      gon.firstname = current_user.firstname
      gon.lastname = current_user.name
      gon.gravatar = current_user.image
    end

    respond_to do |format|
      format.html { redirect_to new_user_session_path unless user_signed_in? }
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
      if @user.privacy_setting == PRIVACY[:restricted] && @user != current_user && (@user.owned_tree_ids & current_user.tree_ids).count == 0
        format.json {render json: @user.as_json(:methods => [:image, :shared_posts],
                          :except => [:access_secret, :access_token, :likes, :movies, :food, :music, :books, :twitter, :github] )}
      else
        format.json {render json: @user.as_json(:methods => [:image, :shared_posts, :about_me],
                          :except => [:access_secret, :access_token, :likes, :movies, :food, :music, :books, :twitter, :github] )}
      end
    end
  end

  # Public: Aktualisiert den zur Zeit angemeldeten User
  #
  # user - Array mit den neuen Werten
  #
  # Beispiel:
  #
  #  PUT /users
  #
  # Gibt HTPP no-Content oder eine Fehlermeldung zurück
  def update
    respond_to do |format|
      if current_user.update_attributes(params[:user])
        format.json { head :no_content }
      else
        format.json { render json: current_user.errors, status: :unprocessable_entity }
      end
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
  # Gibt Photosets und darin enthaltene Bilder eines Users zurück bzw.
  # einen Link um eine Flickr-Verbindung zu erstellen
  def images
    

    u = params[:id].nil? ? current_user : User.find(params[:id])
    # pruefen ob der aktuelle User eine Berechtigung hat, diese Bilder zu sehen
    if u.privacy_setting == PRIVACY[:restricted] && u != current_user && (u.owned_tree_ids & current_user.tree_ids).count == 0
      @error_msg = "Dieser User hat seine Bilder nur fuer seine Trees freigegeben"
    else
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

  # Public: Ein Photoset erstellen
  #
  # title - Der Titel des Photosets
  # primary_photo_id - ID des Photos, dass eingefügt werden soll
  #
  # Beispiele:
  #
  #  POST /photosets/create
  #
  # Gibt die Id des erstellten Photosets zurück
  def create_photoset

    if current_user.got_flickr_connection? && !params[:title].nil? && !params[:primary_photo_id].nil?
      flickr.access_token = current_user.access_token
      flickr.access_secret = current_user.access_secret
      @response = flickr.photosets.create :title => params[:title], :primary_photo_id => params[:primary_photo_id]
    else
      @response = "Es ist ein Fehler aufgetreten"
    end

    respond_to do |format|
      format.json { render json: @response }
    end
  end

  # Public: Ein Photoset abrufen
  #
  # id - Id des Photosets
  #
  # Beispiele:
  #
  #  GET /photosets/123
  #
  # Gibt Infos zu dem angeforderten Photoset zurück
  def get_photoset
    if current_user.got_flickr_connection?
      flickr.access_token = current_user.access_token
      flickr.access_secret = current_user.access_secret
      album = Hash.new
      begin
        album[:photoset] = flickr.photosets.getInfo :photoset_id => params[:id]
        album[:photoset].to_hash[:fotos] = flickr.photosets.getPhotos(:photoset_id => params[:id], :privacy_filer => 1, :media => 'photos').photo
        album[:photoset].to_hash[:fotos].each do |f|
          f.to_hash[:url] = "http://farm#{f.farm}.staticflickr.com/#{f.server}/#{f.id}_#{f.secret}.jpg"
          f.to_hash[:description] = flickr.photos.getInfo(:photo_id => f.id).description
        end
        @response = album
      rescue FlickRaw::FailedResponse => e
        respond_to do |format|
          format.json { render json: "Leider ist ein Fehler aufgetreten, bitte versuch es noch einmal.", status: :unprocessable_entity }
        end
        return
      end
    else
      @response = Hash.new
      @response[:photoset] = "Leider hast du noch keine Flickr-Verbindung hergestellt"
    end

    respond_to do |format|
      format.json { render json: @response[:photoset] }
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

    if current_user.got_flickr_connection?
      flickr.access_token = current_user.access_token
      flickr.access_secret = current_user.access_secret
      begin
        @response = flickr.upload_photo params[:photo].tempfile.path, :title => params[:title], :description => params[:description]
      rescue FlickRaw::FailedResponse => e
        respond_to do |format|
          format.json { render json: "Leider ist ein Fehler aufgetreten, bitte versuch es noch einmal.", status: :unprocessable_entity }
        end
        return
      end
    else
      @response = "Du hast leider noch keine Flickr-Verbindung hergestellt"
    end

    respond_to do |format|
      format.json { render json: @response }
    end
  end

  # Public: Ein Foto laden
  #
  # id - Id des Fotos
  #
  # Beispiele:
  #
  #  GET photo/1.json
  #
  # Gibt Fotoinfos oder eine Fehlermeldung zurück
  def get_photo

    if current_user.got_flickr_connection?
      flickr.access_token = current_user.access_token
      flickr.access_secret = current_user.access_secret
      @photo = Hash.new
      begin
        @photo = flickr.photos.getInfo :photo_id => params[:id]
        @photo.to_hash['url'] = "http://farm#{@photo.farm}.staticflickr.com/#{@photo.server}/#{@photo.id}_#{@photo.secret}.jpg"
      rescue FlickRaw::FailedResponse => e
        respond_to do |format|
          format.json { render json: "Leider ist ein Fehler aufgetreten, bitte versuch es noch einmal.", status: :unprocessable_entity }
        end
        return
      end
    else
      @photo = "Du hast leider noch keine Flickr-Verbindung hergestellt"
    end

    respond_to do |format|
      format.json { render json: @photo }
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
    if params[:id].nil?
      respond_to do |format|
        format.json { render json: "Bitte gib eine Photo-Id an", status: :unprocessable_entity }
      end
    else
      @comments = Hash.new
      begin
        @comments[:comments] = flickr.photos.comments.getList :photo_id => params[:id]
      rescue FlickRaw::FailedResponse => e
        respond_to do |format|
          format.json { render json: "Leider ist ein Fehler aufgetreten, bitte versuch es noch einmal.", status: :unprocessable_entity }
        end
        return
      end
      #überprüfen, ob überhaupt Kommentare vorhanden sind
      if @comments[:comments].to_hash.has_key?("comment")
        #Falls möglich den Autor des Kommentars mit dem entsprechenden
        #Treebook-User verknüpfen
        @comments[:comments].each do |c|
          u = User.where(:flickr_id => c.author)
          unless u.empty?
            c.to_hash[:treebook_id] = u.first.id
          end
          c.to_hash[:time_ago] = u.first.time_ago c.datecreate
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

    flickr.access_token = current_user.access_token
    flickr.access_secret = current_user.access_secret

    if current_user.got_flickr_connection?
      if params[:photo_id].nil? || params[:comment_text].nil?
        respond_to do |format|
          format.json { render json: "Bitte gib ein Foto und einen Kommentar an", status: :unprocessable_entity}
        end
        return
      else
        begin
          @comment = flickr.photos.comments.addComment(:photo_id => params[:photo_id],
                                                     :comment_text => params[:comment_text])
          owner = flickr.photos.getInfo(:photo_id => params[:photo_id]).owner.nsid
          u = User.find_by_flickr_id owner
          unless u.id == current_user.id
            Notification.create(:user => u, :message => "#{current_user.firstname} #{current_user.name} hat dein Photo kommentiert", :recognized => false, :typ => 1)
          end
        rescue FlickRaw::FailedResponse => e
          respond_to do |format|
            format.json { render json: "Leider ist ein Fehler aufgetreten, bitte versuch es noch einmal.", status: :unprocessable_entity }
          end
          return
        end
        respond_to do |format|
          format.json { render json: @comment }
        end
      end
    else
      respond_to do |format|
        format.json { render json: "Bitte verbinde deinen Account erst mit Flickr.", status: :unprocessable_entity }
      end
    end
  end

  # Public: Ein Foto zu einem Photoset hinzufügen
  #
  # photoset_id - Id des Photosets
  # photo_id - Id des Photos
  #
  # Gibt eine leere Antwort oder einen Fehler bei Fehlschlag zurück
  def add_photo_to_photoset

    flickr.access_token = current_user.access_token
    flickr.access_secret = current_user.access_secret

    if params[:photoset_id].nil? || params[:photo_id].nil?
      respond_to do |format|
        format.json { render json: "Bitte gib ein Photoset und ein Foto an", status: :unprocessable_entity}
      end
      return
    else
      begin
        flickr.photosets.addPhoto(:photoset_id => params[:photoset_id],
                                :photo_id => params[:photo_id])
      rescue FlickRaw::FailedResponse => e
        respond_to do |format|
          format.json { render json: "Leider ist ein Fehler aufgetreten, bitte versuch es noch einmal.", status: :unprocessable_entity }
        end
        return
      end
      respond_to do |format|
        format.json { head :no_content }
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

    flickr.access_token = current_user.access_token
    flickr.access_secret = current_user.access_secret

    if params[:photo_id].nil? || params[:title].nil? || params[:description].nil?
      respond_to do |format|
        format.json { render json: "Bitte gib ein Foto, Titel und Kommentar an", status: :unprocessable_entity}
      end
      return
    else
      begin
        @comment = flickr.photos.setMeta(:photo_id => params[:photo_id],
                                       :title => params[:title],
                                       :description => params[:description])
      rescue FlickRaw::FailedResponse => e
        respond_to do |format|
          format.json { render json: "Leider ist ein Fehler aufgetreten, bitte versuch es noch einmal.", status: :unprocessable_entity }
        end
        return
      end
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

    oauth_token = params[:oauth_token]
    oauth_verifier = params[:oauth_verifier]
    begin
      raw_token = flickr.get_access_token(session[:token]['oauth_token'], session[:token]['oauth_token_secret'], oauth_verifier)

      current_user.access_token = raw_token["oauth_token"]
      current_user.access_secret = raw_token["oauth_token_secret"]

      flickr.access_token = current_user.access_token
      flickr.access_secret = current_user.access_secret

      login = flickr.test.login
      current_user.flickr_id = login.id
      current_user.save
    rescue FlickRaw::FailedResponse => e
      respond_to do |format|
        format.json { render json: "Leider ist ein Fehler aufgetreten, bitte versuch es noch einmal.", status: :unprocessable_entity }
      end
      return
    end

    flash[:notice] = "Deine Fotos sind jetzt mit Treebook verbunden!"
    redirect_to root_path
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
        @matches = User.find(:all, :conditions => ["(firstname LIKE ? OR name LIKE ?) AND id != ? ", "#{keywords.first}%", "#{keywords.first}%", current_user.id])
      else
        @matches = User.find(:all, :conditions => ["firstname LIKE ? AND name LIKE ? AND id != ? ", "#{keywords.first}%", "#{keywords[1]}%", current_user.id])
      end
      respond_to do |format|
        format.json { render json: @matches.to_json(:only => [:firstname, :name, :id], :methods => [:image])}
      end
    end
    
  end
  
  # Public: Formular für den Upload von Bildern
  #
  # Beispiele:
  #
  #  GET /upload_form
  #
  #
  # Ǵibt das Formular zurück, welches im Frontend verwendet wird
  def upload_form
    respond_to do |format|
      format.html # lädt views/users/upload_form.html.erb
    end
  end

end
