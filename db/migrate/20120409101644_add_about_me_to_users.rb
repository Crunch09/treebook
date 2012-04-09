class AddAboutMeToUsers < ActiveRecord::Migration
  def change
    add_column :users, :likes, :string

    add_column :users, :movies, :text

    add_column :users, :food, :text

    add_column :users, :music, :text

    add_column :users, :books, :text

    add_column :users, :twitter, :string

    add_column :users, :github, :string

  end
end
