class User < ActiveRecord::Base

  has_many :authentications
  has_many :posts
  has_many :owned_trees, :class_name => "Tree"
  has_and_belongs_to_many :trees



  # Include default devise modules. Others available are:
  # :token_authenticatable, :encryptable, :confirmable, :lockable, :timeoutable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable, :omniauthable

  # Setup accessible (or protected) attributes for your model
  attr_accessible :email, :password, :password_confirmation, :remember_me, :firstname, :name,
                  :birthday, :trees, :posts, :owned_trees, :access_token, :access_secret,
                  :flickr_id

  attr_accessor :posts_by_user

  def image
    default_url = "http://localhost:3000/assets/derp.png"
    gravatar_id = Digest::MD5.hexdigest(self.email.downcase)
    img = "http://gravatar.com/avatar/#{gravatar_id}.png?s=48&d=#{CGI.escape(default_url)}"
    img
  end

  def got_flickr_connection?
    !self.access_token.nil? && !self.access_secret.nil?
  end

  # zeigt alle Posts an die ich von einem anderen User sehen darf
  def shared_posts owner_id = nil
    owner_id ||= posts_by_user
    available_posts = []
    p = Post.where('user_id' => owner_id)
    p.each do |p|
      p.trees.each do |t|
        if t.users.include? self
          available_posts << p
          break
        end
      end
    end
    available_posts 
  end
end
