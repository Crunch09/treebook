class Vote < ActiveRecord::Base
	belongs_to :user
	belongs_to :post

	attr_accessible :upvote, :user_id, :post_id

	validates :user, :presence => true
  	validates :post, :presence => true
  	validates :upvote, :presence => true
end
