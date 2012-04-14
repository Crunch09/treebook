class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController

	# Public: Erstellt eine Verbindung mit Facebook
	# 
	# omniauth - Alle Parameter die von Facebook übergeben werden
	# 
	# Erstellt einen User, meldet einen bestehenden an oder leitet zum
	# Registrierungsformular weiter
	def facebook

		omniauth = request.env["omniauth.auth"]
		data = omniauth['info']
		# Überprüfen, ob es für diese uid bereits eine Facebookverbindung gibt
	    authentication = Authentication.find_by_provider_and_uid(omniauth['provider'], omniauth['uid'])

	    if authentication
	      flash[:notice] = "Erfolgreich mit Facebook angemeldet"
	      sign_in_and_redirect :user, authentication.user
	    else
	      a = Authentication.create!(:provider => omniauth[:provider], :uid => omniauth[:uid])
	      # überprüfen, ob schon ein User mit dieser Email-Adresse existiert
	      # falls ja, Accounts verbinden
	      if User.find_by_email(data.email).nil?
          # ein neuer User wird erstellt
          user = User.new(:email => data.email, :password => Devise.friendly_token[0,20], :firstname => data.first_name, :name => data.last_name)
          user.authentications << a
	      else
  	      user = User.find_by_email(data.email)
          user.authentications << a
        end

	      if user.save
	      	session["devise.facebook_data"] = request.env["omniauth.auth"]
	      	sign_in_and_redirect :user, user
	      else
          redirect_to root_path
		    end
	    end
  	end

  	
  	# TODO
  	def passthru
  		render :file => "#{Rails.root}/public/404.html", :status => 404, :layout => false
	end
end