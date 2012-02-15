class Post < ActiveRecord::Base
  belongs_to :user
  belongs_to :comment_to, :class_name => "Post",
    :foreign_key => "post_id"
  has_and_belongs_to_many :trees
end
