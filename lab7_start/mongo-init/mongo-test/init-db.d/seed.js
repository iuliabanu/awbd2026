db.createUser({
  user: "umovies",
  pwd: "pmovies",
  roles: [
    { role: "readWrite", db: "moviesdb" }
  ]
});
