class User < ActiveRecord::Base
  include ActionView::Helpers::DateHelper
  has_many :authentications
  has_many :posts
  has_many :owned_trees, :class_name => "Tree"
  has_many :notifications
  has_and_belongs_to_many :trees



  # Include default devise modules. Others available are:
  # :token_authenticatable, :encryptable, :confirmable, :lockable, :timeoutable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable, :omniauthable

  # Public: Getter und Setter
  attr_accessible :email, :password, :password_confirmation, :remember_me, :firstname, :name,
                  :birthday, :trees, :posts, :owned_trees, :access_token, :access_secret,
                  :flickr_id, :privacy_setting, :likes, :movies, :food, :music, :books,
                  :twitter, :github

  # Public: Initialisierung von Variablen, die nicht in der DB sind
  attr_accessor :posts_by_user, :gravatar_size


  # Public: Berechnet den Avatar des Users und gibt ihn zurück
  def image
    default_url = "http://localhost:3000/assets/derp.png" # Default-Bild
    gravatar_id = Digest::MD5.hexdigest(self.email.downcase)
    img = "http://gravatar.com/avatar/#{gravatar_id}.png?s=#{self.gravatar_size}&d=#{CGI.escape(default_url)}"
    img #die letzte Anweisung im Code einer Methode wird zurückgegeben
  end

  # Public: Gibt alle "Über mich"-Info des Users zurück
  def about_me
    h = Hash.new
    h[:likes] = self.likes
    h[:movies] = self.movies
    h[:food] = self.food
    h[:music] = self.music
    h[:books] = self.books
    h[:twitter] = self.twitter
    h[:github] = self.github
    return h
  end

  # Public : überprüft ob der User eine Flickr-Connection besitzt
  def got_flickr_connection?
    !self.access_token.nil? && !self.access_secret.nil?
  end

  # Public: zeigt alle "FirstLevel"-Posts an die ich von einem anderen User sehen darf
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

  # Public gibt alle öffentlichen Photosets des Users und deren Bilder zurück
  def get_photos
    flickr.access_token = self.access_token
    flickr.access_secret = self.access_secret
    album = Hash.new
    album[:photosets] = flickr.photosets.getList
    album[:photosets].each do |p|
      p.to_hash[:fotos] = flickr.photosets.getPhotos(:photoset_id => p.id, :privacy_filter => 1, :media => 'photos').photo
      p.to_hash[:fotos].each do |f|
        f.to_hash[:url] = "http://farm#{f.farm}.staticflickr.com/#{f.server}/#{f.id}_#{f.secret}.jpg"
        f.to_hash[:description] = flickr.photos.getInfo(:photo_id => f.id).description
      end
    end
    album
  end

  # Public: to_s wird überschrieben
  def to_s
    "#{self.firstname} #{self.name}"
  end

  def time_ago timestamp
    time_ago_in_words(Time.at(timestamp.to_i))
  end

  # Public: wird benötigt um innerhalb von shared_posts auf den current_user zuzugreifen
  def self.current
    Thread.current[:user]
  end

  # Public: wird benötigt um innerhalb von shared_posts auf den current_user zuzugreifen
  def self.current=(user)
    Thread.current[:user] = user
  end

end
