class UsersController < ApplicationController

	before_filter :authenticate_user!, :except => 'index'

	#GET /users
	#GET /users.json
	def index
		@users = User.all

		gon.user_id = current_user.id

		respond_to do |format|
			format.html { redirect_to new_user_session_path if current_user.nil? }
			format.json { render json: @users }
		end
	end

	#GET /trees
	#GET /trees.json
	def trees
		@ownedTrees = Tree.where :user_id => current_user.id 
	    respond_to do |format|
	    	format.html
	    	format.json { render json: @ownedTrees }
	    end
	end

end