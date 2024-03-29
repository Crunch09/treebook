# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20120409113040) do

  create_table "authentications", :force => true do |t|
    t.integer "user_id"
    t.string  "provider"
    t.string  "uid"
  end

  create_table "notifications", :force => true do |t|
    t.integer  "user_id"
    t.string   "message"
    t.boolean  "recognized"
    t.integer  "typ"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  add_index "notifications", ["user_id"], :name => "index_notifications_on_user_id"

  create_table "posts", :force => true do |t|
    t.integer  "user_id"
    t.text     "text"
    t.integer  "likes"
    t.integer  "dislikes"
    t.integer  "post_id"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  add_index "posts", ["post_id"], :name => "index_posts_on_post_id"
  add_index "posts", ["user_id"], :name => "index_posts_on_user_id"

  create_table "posts_trees", :id => false, :force => true do |t|
    t.integer "post_id"
    t.integer "tree_id"
  end

  create_table "trees", :force => true do |t|
    t.integer  "user_id"
    t.string   "title"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  add_index "trees", ["user_id"], :name => "index_trees_on_user_id"

  create_table "trees_users", :id => false, :force => true do |t|
    t.integer "tree_id"
    t.integer "user_id"
  end

  create_table "users", :force => true do |t|
    t.string   "name"
    t.string   "firstname"
    t.date     "birthday"
    t.string   "password"
    t.integer  "privacy_setting"
    t.datetime "created_at",                             :null => false
    t.datetime "updated_at",                             :null => false
    t.string   "email",                  :default => "", :null => false
    t.string   "encrypted_password",     :default => "", :null => false
    t.string   "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",          :default => 0
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip"
    t.string   "last_sign_in_ip"
    t.string   "access_token"
    t.string   "access_secret"
    t.string   "flickr_id"
    t.string   "likes"
    t.text     "movies"
    t.text     "food"
    t.text     "music"
    t.text     "books"
    t.string   "twitter"
    t.string   "github"
  end

  add_index "users", ["email"], :name => "index_users_on_email", :unique => true
  add_index "users", ["reset_password_token"], :name => "index_users_on_reset_password_token", :unique => true

  create_table "votes", :force => true do |t|
    t.integer  "user_id"
    t.integer  "post_id"
    t.boolean  "upvote"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  add_index "votes", ["post_id"], :name => "index_votes_on_post_id"
  add_index "votes", ["user_id"], :name => "index_votes_on_user_id"

end
