class User < ActiveRecord::Base
  has_many :posts
  has_and_belongs_to_many :trees



  # Include default devise modules. Others available are:
  # :token_authenticatable, :encryptable, :confirmable, :lockable, :timeoutable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable, :omniauthable

  # Setup accessible (or protected) attributes for your model
  attr_accessible :email, :password, :password_confirmation, :remember_me, :firstname, :name, :birthday


	def self.find_for_google_oauth(access_token, signed_in_resource=nil)
		data = access_token.extra.raw_info
	  	if user = User.where(:email => data.email).first
	    	user
	  	else # Create a user with a stub password. 
	    	User.create!(:email => data.email, :password => Devise.friendly_token[0,20], :firstname => data.given_name, :name => data.family_name) 
	  	end
	end
end
