class PostsController < ApplicationController

  before_filter :authenticate_user!

  # Public: Findet alle Posts mit Leserechten des aktuellen Users
  # 
  # Beispiele:
  # 
  #  GET /posts.json
  # 
  # Gibt alle eigenen Posts und Posts in Trees, in denen der aktuelle
  # User Mitglied ist, zurück
  def index
    # eigene Posts
    ownPosts = Post.where(:post_id => nil, :user_id => current_user.id)
    # Posts in Trees, in denen der aktuelle User Mitglied ist
    sharedPosts = Post.select { |e| (e.tree_ids & current_user.tree_ids).count > 0 && 
                                      e.post_id.nil? && 
                                      e.user_id != current_user.id  
                              }
    @posts = (ownPosts + sharedPosts).sort_by( &:created_at ) 

    User.current = current_user
    respond_to do |format|
      format.json { render json: @posts.to_json(:include => :trees, :methods => [:comments, :time_ago, :votes]) }
    end
  end

  # Public: Findet einen bestimmten Post
  # 
  # id - Id des Posts, der zu suchen ist
  #
  # Beispiele:
  #
  #  GET /posts/1.json
  #
  # Gibt Infos zum einem Post zurück oder eine Fehlermeldung,
  # wenn man diesen nicht sehen darf
  def show
    User.current = current_user
    @post = Post.find(params[:id])

    respond_to do |format|
      if (@post.tree_ids & current_user.tree_ids).count > 0 || (@post.user_id == current_user.id) || (@post.trees.empty? && !@post.post_id.nil?)
        format.json { render json: @post.to_json(:include => :trees, :methods => [:comments, :time_ago, :votes]) }
      else
        format.json { render json: "Du darfst diesen Post leider nicht sehen.", status: :unprocessable_entity }
      end
    end
  end


  # Public: Speichert einen neuen Post
  #
  # Beispiele:
  #
  #   POST /posts.json
  #
  # Gibt den erstellten Post oder eine Fehlermeldung zurück
  def create
    User.current = current_user
    @post = Post.new(params[:post])
    @post.text = ERB::Util.h(@post.text)
    respond_to do |format|
      if @post.save
        unless @post.post_id.nil?
          p = Post.find @post.post_id
          unless p.user.id == current_user.id
            Notification.create(:user => p.user, :message => "#{current_user.firstname} #{current_user.name} hat deinen Post kommentiert", :recognized => false, :typ => 0)
          end
        end
        format.json { render json: @post.as_json, status: :created, location: @post }
      else
        format.json { render json: @post.errors, status: :unprocessable_entity }
      end
    end
  end

  # Public: Aktualisiert einen Post
  # 
  # id - Id des Posts
  #
  # Beispiele:
  #
  #  PUT /posts/1.json
  #
  # Gibt einen HTTP No-Content Status oder eine Fehlermeldung zurück
  def update
    @post = Post.find(params[:id])

    respond_to do |format|
      if @post.update_attributes(params[:post])
        format.json { head :no_content }
      else
        format.json { render json: @post.errors, status: :unprocessable_entity }
      end
    end
  end

  # Public: Löscht einen Post
  # 
  # id - Id des Posts
  # 
  # Beispiele:
  #
  #  DELETE /posts/1.json
  #
  # Gibt einen HTTP No-Content Status  zurück
  def destroy
    @post = Post.find(params[:id])
    @post.destroy

    respond_to do |format|
      format.json { head :no_content }
    end
  end
end
