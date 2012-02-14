class CreateTreeUserJoinTable < ActiveRecord::Migration
  def change
  	create_table :trees_users, :id => false do |t|
  		t.integer :tree_id
  		t.integer :user_id
  	end
  end
  def up
  end

  def down
  end
end
