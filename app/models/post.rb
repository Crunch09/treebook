class Post < ActiveRecord::Base
  include ActionView::Helpers::DateHelper 
  belongs_to :user
  belongs_to :comment_to, :class_name => "Post",
    :foreign_key => "post_id"
  has_and_belongs_to_many :trees

  # Public : Getter und Setter
  attr_accessible :text, :likes, :dislikes, :user, :comment_to, :user_id, :post_id, :trees, :tree_ids
  # Public : Getter
  attr_reader :time_ago
  
  validates :text, :presence => true
  validates :user, :presence => true

  # Alle Kommentare eines Posts
  def comments
  	Post.where(:post_id => self.id).order("created_at DESC")
  end

  # Alle Votes für einen Post
  def votes
    Vote.where(:post_id => self.id, :user_id => User.current.id).select("upvote")
  end


  def time_ago
    time_ago_in_words(self.created_at)
    # z.B. 14.04.2012 => "vor einem Tag"
  end

  # überschreibt as_json
  def as_json(options={})
    super(:include => :trees, :methods => [:time_ago, :comments, :votes])
  end
end
