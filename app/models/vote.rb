class Vote < ActiveRecord::Base
	belongs_to :user
	belongs_to :post

	attr_accessible :upvote, :user_id, :post_id

	validates :user, :presence => true
  	validates :post, :presence => true

  	def likes
  		Post.find(self.post_id).likes
  	end

  	def dislikes
  		Post.find(self.post_id).dislikes
  	end

  	def as_json(options={})
    	super(:methods => [:likes, :dislikes])
  	end
end
