class Notification < ActiveRecord::Base
	belongs_to :user

	attr_accessible :user, :message, :recognized, :typ, :user_id
end
