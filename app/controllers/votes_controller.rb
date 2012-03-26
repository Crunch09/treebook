class VotesController < ApplicationController
	def create
		@vote = Vote.new(params[:vote])

		respond_to do |format|
        if @vote.save
        	if @vote.upvote == true
        		@vote.post.likes = @vote.post.likes + 1
        	else
        		@vote.post.dislikes = @vote.post.dislikes + 1
        	end
        	@vote.post.save
        	format.json { render json: @vote, status: :created, location: @vote }
      	else
        	format.json { render json: @vote.errors, status: :unprocessable_entity }
      	end
    end
end