FROM mongo:latest
COPY ./samplefiles/movies.json /movies.json
COPY ./samplefiles/comments.json /comments.json
CMD mongoimport --host mongo_test --username umovies --password pmovies --authenticationDatabase moviesdb --db moviesdb --collection movies --type json --jsonArray --file /movies.json && \
    mongoimport --host mongo_test --username umovies --password pmovies --authenticationDatabase moviesdb --db moviesdb --collection comments --type json --jsonArray --file /comments.json
