class UsersController < ApplicationController

	before_filter :authenticate_user!

	#GET /users
	#GET /users.json
	def index
		@users = User.all

		respond_to do |format|
			format.html
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