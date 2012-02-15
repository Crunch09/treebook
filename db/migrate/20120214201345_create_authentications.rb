class CreateAuthentications < ActiveRecord::Migration

  def change
  	create_table :authentications do |t|
  		t.integer :user_id
  		t.string :provider
  		t.string :uid
    end
  end
  def up
  end

  def down
  end
end
