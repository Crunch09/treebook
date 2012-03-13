class CreatePostTreeJoinTable < ActiveRecord::Migration
  def change
  	create_table :posts_trees, :id => false do |t|
  		t.integer :post_id
  		t.integer :tree_id
  	end
  end
  def up
  end

  def down
  end
end
