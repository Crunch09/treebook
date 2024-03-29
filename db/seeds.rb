# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)


chris = User.create({ name:"Brandt", firstname:"Christian", password: "123456", password_confirmation: "123456", email:"christianbrandt90@gmail.com"})
flo = User.create({ name:"Thomas", firstname:"Florian", password: "123456", password_confirmation: "123456", email:"florian.thomas@mni.thm.de"})

trees = Tree.create([{ user: flo, title: "the first one"}, {user: chris, title: "first tree"}])
# user chris in tree von user flo einfuegen
t = trees.first
t.users << chris
t.save
t2 = trees.last
t2.users << flo
t2.save
posts = Post.create([{ user: flo, text: "my first post", likes: 0, dislikes: 0}, { user: chris, text: "the first reply", likes: 0, dislikes: 0}])
p = posts.first
p.trees << t
p.save
p2 = posts.last
p2.trees << t2
p2.save