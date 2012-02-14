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

end