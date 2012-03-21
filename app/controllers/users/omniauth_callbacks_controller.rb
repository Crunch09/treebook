class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController

	def facebook

		omniauth = request.env["omniauth.auth"]
		data = omniauth['info']
	    authentication = Authentication.find_by_provider_and_uid(omniauth['provider'], omniauth['uid'])

	    if authentication
	      flash[:notice] = "Erfolgreich mit Facebook angemeldet"
	      sign_in_and_redirect :user, authentication.user
	    else
	      user = User.new(:email => data.email, :password => Devise.friendly_token[0,20], :firstname => data.first_name, :name => data.last_name)
	      a = Authentication.create!(:provider => omniauth[:provider], :uid => omniauth[:uid])
	      user.authentications << a
	      if user.save
	      	session["devise.facebook_data"] = request.env["omniauth.auth"]
	      	sign_in_and_redirect :user, user
	      else
			redirect_to new_user_registration_url
		  end
	    end
  	end

  	

  	def passthru
  		render :file => "#{Rails.root}/public/404.html", :status => 404, :layout => false
  		# Or alternatively,
  		# raise ActionController::RoutingError.new('Not Found')
	end
end