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

  attr_accessor :posts_by_user, :gravatar_size


  def image
    default_url = "http://localhost:3000/assets/derp.png"
    gravatar_id = Digest::MD5.hexdigest(self.email.downcase)
    img = "http://gravatar.com/avatar/#{gravatar_id}.png?s=#{self.gravatar_size}&d=#{CGI.escape(default_url)}"
    img
  end

  def got_flickr_connection?
    !self.access_token.nil? && !self.access_secret.nil?
  end

  # zeigt alle "FirstLevel"-Posts an die ich von einem anderen User sehen darf
  def shared_posts owner_id = nil
    available_posts = []
    unless self == User.current
      owner_id ||= User.current.posts_by_user
      p = Post.where('user_id' => owner_id, 'post_id' => nil)
      p.each do |p|
        p.trees.each do |t|
          if t.users.include? User.current
            available_posts << p
            break
          end
        end
      end
    else
      available_posts = self.posts.where(:post_id => nil)
    end
    available_posts
  end

  def get_photos
    flickr.access_token = self.access_token
    flickr.access_secret = self.access_secret
    album = Hash.new
    album[:photosets] = flickr.photosets.getList
    album[:photosets].each do |p|
      p.to_hash[:fotos] = flickr.photosets.getPhotos(:photoset_id => p.id).photo
      p.to_hash[:fotos].each do |f|
        f.to_hash[:url] = "http://farm#{f.farm}.staticflickr.com/#{f.server}/#{f.id}_#{f.secret}.jpg"
        f.to_hash[:description] = flickr.photos.getInfo(:photo_id => f.id).description
      end
    end
    album
  end

  def to_s
    "#{self.firstname} #{self.name}"
  end

  #werden benötigt um innerhalb von shared_posts auf den current_user zuzugreifen
  def self.current
    Thread.current[:user]
  end

  def self.current=(user)
    Thread.current[:user] = user
  end

end
