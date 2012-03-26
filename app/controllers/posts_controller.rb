class PostsController < ApplicationController

  before_filter :authenticate_user!

  # GET /posts
  # GET /posts.json
  def index
    # eigene Posts
    ownPosts = Post.where(:post_id => nil, :user_id => current_user.id)
    # Posts in Trees in denen man Mitglied ist
    sharedPosts = Post.select { |e| (e.tree_ids & current_user.tree_ids).count > 0 && e.post_id.nil? && e.user_id != current_user.id  }
    @posts = (ownPosts + sharedPosts).sort_by( &:created_at ) 

    User.current = current_user
    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @posts.to_json(:include => :trees, :methods => [:comments, :time_ago, :votes]) }
    end
  end

  # GET /posts/1
  # GET /posts/1.json
  def show
    User.current = current_user
    @post = Post.find(params[:id])

    respond_to do |format|
      if (@post.tree_ids & current_user.tree_ids).count > 0 || @post.user_id == current_user.id
        format.json { render json: @post.to_json(:include => :trees, :methods => [:comments, :time_ago, :votes]) }
      else
        format.json { render json: "Sie haben leider keine Berechtigung diesen Post zu sehen", status: :unprocessable_entity }
      end
    end
  end

  # GET /posts/new
  # GET /posts/new.json
  def new
    @post = Post.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @post }
    end
  end

  # GET /posts/1/edit
  def edit
    @post = Post.find(params[:id])
  end

  # POST /posts
  # POST /posts.json
  def create
    User.current = current_user
    @post = Post.new(params[:post])
    @post.text = ERB::Util.h(@post.text)
    respond_to do |format|
      if @post.save
        format.html { redirect_to @post, notice: 'Post was successfully created.' }
        format.json { render json: @post.as_json, status: :created, location: @post }
      else
        format.html { render action: "new" }
        format.json { render json: @post.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /posts/1
  # PUT /posts/1.json
  def update
    @post = Post.find(params[:id])

    respond_to do |format|
      if @post.update_attributes(params[:post])
        format.html { redirect_to @post, notice: 'Post was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @post.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /posts/1
  # DELETE /posts/1.json
  def destroy
    @post = Post.find(params[:id])
    @post.destroy

    respond_to do |format|
      format.html { redirect_to posts_url }
      format.json { head :no_content }
    end
  end
end
