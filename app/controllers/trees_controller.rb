class TreesController < ApplicationController

  before_filter :authenticate_user!

  # GET /trees/1
  # GET /trees/1.json
  def show
    @tree = Tree.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      if @tree.user == current_user
        format.json { render json: @tree.to_json(:include => { :user => {:only => [:firstname, :name, :id, :email]}, :users => {:only => [:firstname, :name, :id, :email]}}) }
      else
        format.json { render json: "Sie koennen leider nicht auf diesen Tree zugreifen", status: :unprocessable_entity }
      end
    end
  end

  # GET /trees/new
  # GET /trees/new.json
  def new
    @tree = Tree.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @tree }
    end
  end

  # GET /trees/1/edit
  def edit
    @tree = Tree.find(params[:id])
  end

  # POST /trees
  # POST /trees.json
  def create
    @tree = Tree.new(params[:tree])
    @tree.title = ERB::Util.h(@tree.title)
    respond_to do |format|
      if @tree.save
        format.html { redirect_to @tree, notice: 'Tree was successfully created.' }
        format.json { render json: @tree, status: :created, location: @tree }
      else
        format.html { render action: "new" }
        format.json { render json: @tree.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /trees/1
  # PUT /trees/1.json
  def update
    @tree = Tree.find(params[:id])

    respond_to do |format|
      if @tree.update_attributes(params[:tree])
        format.html { redirect_to @tree, notice: 'Tree was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @tree.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /trees/1
  # DELETE /trees/1.json
  def destroy
    @tree = Tree.find(params[:id])
    @tree.destroy

    respond_to do |format|
      format.html { redirect_to trees_url }
      format.json { head :no_content }
    end
  end


  #GET /trees
  #GET /trees.json
  def index 
      respond_to do |format|
        format.json { render json: current_user.owned_trees }
      end
  end

end
