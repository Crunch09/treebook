class CreateNotifications < ActiveRecord::Migration
  def change
    create_table :notifications do |t|
      t.references :user
      t.string :message
      t.boolean :recognized
      t.integer :typ
      t.timestamps
    end
    add_index :notifications, :user_id
  end
end
