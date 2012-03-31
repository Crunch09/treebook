class TreesController < ApplicationController

  before_filter :authenticate_user!

  # Public: Gibt Infos zu einem Tree
  #
  # id - Die Id des Trees
  #
  # Beispiele:
  #
  # GET /trees/1.json
  #
  # Gibt den Tree zurück, oder falls
  # dieser nicht dem aktuellen User gehört, eine Fehlermeldung
  def show
    @tree = Tree.find(params[:id])

    respond_to do |format|
      if @tree.user == current_user
        format.json { render json: @tree.to_json(:include => { :user => {:only => [:firstname, :name, :id, :email]}, :users => {:only => [:firstname, :name, :id, :email], :methods => :image}}) }
      else
        format.json { render json: "Sie koennen leider nicht auf diesen Tree zugreifen", status: :unprocessable_entity }
      end
    end
  end

  # Public: Erstellt einen neuen Tree
  #
  # Beispiele:
  #
  #  POST /trees.json
  #
  # Gibt den erstellten Tree oder eine Fehlermeldung zurück 
  def create
    @tree = Tree.new(params[:tree])
    @tree.title = ERB::Util.h(@tree.title)
    respond_to do |format|
      if @tree.save
        format.json { render json: @tree, status: :created, location: @tree }
      else
        format.json { render json: @tree.errors, status: :unprocessable_entity }
      end
    end
  end

  # Public: Aktualisiert einen bestehenden Tree
  #
  # id - Id des Trees
  #
  # Beispiele:
  #
  #  PUT /trees/1.json
  #
  # Gibt eine HTTP No-Content Meldung oder eine Fehlermeldung zurück
  def update
    @tree = Tree.find(params[:id])

    respond_to do |format|
      if @tree.update_attributes(params[:tree])
        format.json { head :no_content }
      else
        format.json { render json: @tree.errors, status: :unprocessable_entity }
      end
    end
  end

  # Public: Löscht einen Tree
  #
  # id - Id des Trees
  #
  # Beispiele:
  #
  #  DELETE /trees/1.json
  #
  # Gibt nichts zurück
  def destroy
    @tree = Tree.find(params[:id])
    @tree.destroy

    respond_to do |format|
      format.json { head :no_content }
    end
  end


  # Public: Listet alle Trees des angemeldeten Users auf
  #
  # Beispiele:
  #
  #  GET /trees.json
  #
  # Gibt die Trees des Users zurück
  def index 
      respond_to do |format|
        format.json { render json: current_user.owned_trees.to_json(
          :include => { :users => {:only => [:firstname, :name, :id, :email]}}
        )}
      end
  end

end
