class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
	def google_oauth2
	    # You need to implement the method below in your model
	    @user = User.find_for_google_oauth(request.env["omniauth.auth"], current_user)

	    if @user.persisted?
	      flash[:notice] = "Erfolgreich mit Google angemeldet."
	      sign_in_and_redirect @user, :event => :authentication
	    else
	      session["devise.google_data"] = request.env["omniauth.auth"]
	      redirect_to new_user_registration_url
	    end
  	end

  	def passthru
  		render :file => "#{Rails.root}/public/404.html", :status => 404, :layout => false
  		# Or alternatively,
  		# raise ActionController::RoutingError.new('Not Found')
	end
end