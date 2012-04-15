class Notification < ActiveRecord::Base
	belongs_to :user

	# Public : Getter und Setter
	attr_accessible :user, :message, :recognized, :typ, :user_id
end
