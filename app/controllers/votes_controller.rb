class VotesController < ApplicationController
	def create
		@vote = Vote.new(params[:vote])
		if Vote.where(:post_id => @vote.post_id, :user_id => @vote.user_id).count == 0
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
				format.json { render json: "Leider haben Sie ihre Stimme schon abgegeben", status: :unprocessable_entity}
			end
		end
    end
end