class Vote < ActiveRecord::Base
	belongs_to :user
	belongs_to :post

  # Public: Getter und Setter
	attr_accessible :upvote, :user_id, :post_id

	validates :user, :presence => true
	validates :post, :presence => true

	# Public: Gibt alle Likes zurück
  def likes
			Post.find(self.post_id).likes
	end

  # Public: Gibt alle Dislikes zurück
	def dislikes
			Post.find(self.post_id).dislikes
	end
end
