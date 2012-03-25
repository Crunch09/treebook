class Vote < ActiveRecord::Bas
	belongs_to :user
	belongs_to :post

	attr_accessible :upvote, :user_id, :post_id

	
end
