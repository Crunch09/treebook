class CreateTrees < ActiveRecord::Migration
  def change
    create_table :trees do |t|
      t.references :user
      t.string :title

      t.timestamps
    end
    add_index :trees, :user_id
  end
end
