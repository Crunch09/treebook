class Post < ActiveRecord::Base
  belongs_to :user
  belongs_to :comment_to, :class_name => "Post",
    :foreign_key => "post_id"
end
