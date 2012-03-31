class VotesController < ApplicationController
	# Public: liked oder disliked einen Post
	#
	# upvote - Boolean, true bei like, false bei dislike
	#
	# Gibt den Vote oder eine Fehlermeldung, falls bereits abgestimmt wurde,
	# zurück
	def create
		@vote = Vote.new(params[:vote])
		savedVotes = Vote.https://twitter.com/where(:post_id => @vote.post_id, :user_id => @vote.user_id)
		if savedVotes.count == 0
			respond_to do |format|
		        if @vote.save
		        	if @vote.upvote == true
		        		@vote.post.likes = @vote.post.likes + 1
		        	else
		        		@vote.post.dislikes = @vote.post.dislikes + 1
		        	end
		        	@vote.post.save
		        	format.json { render json: @vote.to_json(:methods => [:likes, :dislikes]), status: :created, location: @vote }
		      	else
		        	format.json { render json: @vote.errors, status: :unprocessable_entity }
		      	end
		    end
		else
			respond_to do |format|
				#überprüfen, ob der User sich anders entschieden hat
				savedVote = savedVotes.first
				if savedVote.upvote != @vote.upvote
					if @vote.upvote == true
		        		savedVote.post.likes = savedVote.post.likes + 1
		        		savedVote.post.dislikes = savedVote.post.dislikes - 1
		        	else
		        		savedVote.post.dislikes = savedVote.post.dislikes + 1
		        		savedVote.post.likes = savedVote.post.likes - 1
		        	end
		        	savedVote.post.save
		        	savedVote.update_attributes!(:upvote => @vote.upvote)
		        	format.json { render json: savedVote.to_json(:methods => [:likes, :dislikes]), status: :created, location: savedVote }
		        else
					format.json { render json: "Du kannst leider nicht mehrmals abstimmen", status: :unprocessable_entity}
				end
			end
		end
    end
end