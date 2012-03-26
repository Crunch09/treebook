Treebook::Application.routes.draw do
  #devise_for :users do
  #  get '/users/auth/:provider' => 'users/omniauth_callbacks#passthru'
  #end

  devise_for :users, :controllers => { :omniauth_callbacks => "users/omniauth_callbacks" }

  resources :trees, :except => [:index]

  resources :posts

  root :to => 'users#index'

  match "users/:id" => "users#show", :via => :get, :as => :show_user
  match "trees/" => "trees#index", :via => :get, :as => :trees
  match "images" => "users#images", :via => :get, :as => :images
  match "images/:id" => "users#images", :via => :get
  match "gallery/:id" => "users#gallery", :via => :get
  match "photo/:id" => "users#photo", :via => :get
  match "flickrcallback" => "users#flickrcallback", :via => :get, :as => :flickrcallback
  match "vote/" => "votes#create", :via => :posts
  # You can have the root of your site routed with "root"
  # just remember to delete public/index.html.

  # The priority is based upon order of creation:
  # first created -> highest priority.

  # Sample of regular route:
  #   match 'products/:id' => 'catalog#view'
  # Keep in mind you can assign values other than :controller and :action

  # Sample of named route:
  #   match 'products/:id/purchase' => 'catalog#purchase', :as => :purchase
  # This route can be invoked with purchase_url(:id => product.id)

  # Sample resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Sample resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Sample resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Sample resource route with more complex sub-resources
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', :on => :collection
  #     end
  #   end

  # Sample resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end

  

  # See how all your routes lay out with "rake routes"

  # This is a legacy wild controller route that's not recommended for RESTful applications.
  # Note: This route will make all actions in every controller accessible via GET requests.
  # match ':controller(/:action(/:id))(.:format)'
end
