class UsersController < ApplicationController

	require 'flickraw'

	before_filter :authenticate_user!, :except => 'index'

	#GET /users
	#GET /users.json
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

	#GET /images
	#GET /images.json
	def images
		flickr = Authentication.find_by_provider_and_user_id("flickr", current_user.id)
		unless flickr.nil?
			FlickRaw.api_key = "42026bbf6f026bb43201488328dd61b0"
			FlickRaw.shared_secret = "043bd220b6b52509"
			flickr = FlickRaw::Flickr.new
			@user = current_user
			#begin
			#	photosets = flickr.photosets.getList(:user_id => current_user.flickr_id)
			#	gon.photosets = photosets
			#	respond_to do |format|
			#		format.html 
			#		format.json { render json: photosets }
			#	end
			#rescue FlickRaw::FailedResponse => ex
			#	flash[:alert] = "Bitte geb eine gueltige Flickr-ID an"
			#	redirect_to edit_user_registration_path
			#end
		else
			flash[:notice] = "Bitte geb erst deine Flickr-ID in deinem Profil an"
			redirect_to edit_user_registration_path
		end
	end

end
