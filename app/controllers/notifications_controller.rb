class NotificationsController < ApplicationController

	# Public: Holt alle Notifications des aktuellen Users
	#
	# Beispiele:
	#
	#  GET /notifications.json
	#
	# Gibt alle Notifications des aktuellen Users zurück
	def index
		@notifications = User.find(:all, :conditions => [:user => current_user, :recognized => false])
		respond_to do |format|
			format.json { render json: @notifications }
		end
	end

	# Public: Setzt alle ungelesenen Notifications des aktuellen Users auf gelesen
	#
	# Beispiele:
	#
	# PUT /notifications/update.json
	#
	# Gibt nichts zurück
	def update
		@notifications = User.find(:all, :conditions => [:user => current_user, :recognized => false])
		@notifications.each do |n|
			n.update_attributes(:recognized => true)
		end

		respond_to do |format|
			format.json { head :no_content }
		end
	end

end