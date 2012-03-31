class Tree < ActiveRecord::Base
  belongs_to :user
  has_and_belongs_to_many :users
  has_and_belongs_to_many :posts

  # Public: Getter und Setter
  attr_accessible :title, :user, :user_id, :users, :posts, :user_ids

  validates :title, :presence => true
  validates :user, :presence => true
end
