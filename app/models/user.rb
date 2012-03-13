class User < ActiveRecord::Base
  has_one :authentication
  has_many :posts
  has_many :owned_trees, :class_name => "Tree"
  has_and_belongs_to_many :trees



  # Include default devise modules. Others available are:
  # :token_authenticatable, :encryptable, :confirmable, :lockable, :timeoutable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable, :omniauthable

  # Setup accessible (or protected) attributes for your model
  attr_accessible :email, :password, :password_confirmation, :remember_me, :firstname, :name, :birthday, :trees, :posts, :owned_trees

  def image
    default_url = "http://localhost:3000/assets/derp.png"
    gravatar_id = Digest::MD5.hexdigest(self.email.downcase)
    img = "http://gravatar.com/avatar/#{gravatar_id}.png?s=48&d=#{CGI.escape(default_url)}"
    img
  end

  
end
