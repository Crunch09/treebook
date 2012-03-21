class AddFlickrIdToUsers < ActiveRecord::Migration
  def change
    add_column :users, :flickr_id, :string

  end
end
