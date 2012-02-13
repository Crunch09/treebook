class CreatePosts < ActiveRecord::Migration
  def change
    create_table :posts do |t|
      t.references :user
      t.text :text
      t.integer :likes
      t.integer :dislikes
      t.references :post
      t.timestamps
    end
  end
end
