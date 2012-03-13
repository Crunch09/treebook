class UsersController < ApplicationController

	before_filter :authenticate_user!, :except => 'index'

	#GET /users
	#GET /users.json
	def index
		@users = User.all
		if !current_user.nil?
			gon.user_id = current_user.id
		end

		respond_to do |format|
			format.html { redirect_to new_user_session_path if current_user.nil? }
			format.json { render json: @users }
		end
	end


end
