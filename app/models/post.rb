class Post < ActiveRecord::Base
  include ActionView::Helpers::DateHelper 
  belongs_to :user
  belongs_to :comment_to, :class_name => "Post",
    :foreign_key => "post_id"
  has_and_belongs_to_many :trees

  attr_accessible :text, :likes, :dislikes, :user, :comment_to, :user_id, :post_id, :trees, :tree_ids
  
  validates :text, :presence => true
  validates :user, :presence => true

  def comments
  	Post.where(:post_id => self.id).order("created_at DESC")
  end

  def time_ago
    time_ago_in_words(self.created_at)
  end
end
