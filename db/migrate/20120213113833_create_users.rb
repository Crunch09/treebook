class CreateUsers < ActiveRecord::Migration
  def change
    create_table :users do |t|
      t.string :name
      t.string :firstname
      t.date :birthday
      t.string :password
      t.integer :privacy_setting
      t.timestamps
    end
  end
end
