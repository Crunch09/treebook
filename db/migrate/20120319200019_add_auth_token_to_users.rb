class AddAuthTokenToUsers < ActiveRecord::Migration
  def change
  	change_table(:users) do |t|
  		t.string :access_token
  		t.string :access_secret
  	end
  end
end
