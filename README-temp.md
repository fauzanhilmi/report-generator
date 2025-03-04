

# Explanations
- uses mongodb and rabbitmq with persistent storage. so data won't be lost upon crash
- explain the mongo fields
- for status names, I use past tense. to future proof. also clearly indicates the process that has recently been done. also avoid ambiguous present tense (e.g "pending")
- error handling: crash only when fail to setting up (express, mongo, rmq). else dont crash so it won't affect other reports
- scale to multi instances:
  - in docker-compose it's easy wiht --scale 
  - app:
    - however to scale the app, we also need a load balancer which is not implemented yet. the code itself is safe from concurrency
    - the most concurrency risk is the cancel report (possible two users cancelling same report). however, with findoneandupdate, its solved
  - rabbitmq worker: one message will be consumed only by one consumer/worker. also, the db operation is atomic 

# Assumptions
- user cannot request a specific report (id is generated only after request)
- scheduled time can be specified up to the minute. (cron runs every minute)
- req response format. the response format bascially the mongo doc

# Future Work
- Unit tests
- Move credential to .env
- Move business logics from controller to separate file (e.g datetime validation). Then do unit test on that file. Controllers should be dumb
- also create DAO, move all data access related logic there. then easy if we have different data source in future
- Store statuses inside one enum
- Log errors 
- Log changes to each document in db (with events? or how?)
- proper username password / authentication for mongo & rmq
- Proper field validation for request and response body
- express, mongo, express should be in different docker project. but here they are all combined inside one ?
- restructure? so only 3 top level folders: api, workers, jobs. then create separate build in docker compose
- separate dockerfile for express and jobs / workers?
- create indexes on db for faster retrieval
- load balancer