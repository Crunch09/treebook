class Tree < ActiveRecord::Base
  belongs_to :user
  has_and_belongs_to_many :users
  has_and_belongs_to_many :posts

  attr_accessible :title, :user, :user_id, :users, :posts

  validates :title, :presence => true
  validates :user, :presence => true
end
