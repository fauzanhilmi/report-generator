## Setup & Run
1. Ensure Docker is installed
2. Run `docker compose up -d --build`
3. Access the APIs at `http://localhost:3000/`

### **API** 
- `POST /reports`
  - Creates a new report. If a `scheduledTime` is provided, the report is scheduled; otherwise, it is processed immediately.
  - Request Body:
    ```json
    {
        "scheduledTime": "2025-03-10T12:00:00.000Z"  // (optional) ISO 8601 format
    }
- `GET /reports/:id`
  - Retrieves details of a specific report (including its status) by its ID.
- `DELETE /reports/:id`
  - Cancels a pending report.

### **Report Status** 
- `REQUESTED` - The report request has been received but has not yet been scheduled or processed. This status is assigned when a report is created **without** a scheduled time.
- `SCHEDULED` - The report is scheduled to be processed at a future time. This happens when a user provides a `scheduledTime` in the request.  
- `QUEUED` - The report is ready for processing and has been added to the message queue. A worker will pick it up and generate the report.  
- `COMPLETED` - The report has been successfully generated and its content is available for retrieval.
- `CANCELED` - The report was manually canceled before completion.

## Assumptions
- Users cannot request a specific report; the report ID is generated only after the request is made.  
- The scheduled time can be specified with minute-level precision since the cron job runs every minute.  
- The API response format follows the structure of MongoDB document of the report.  

## Design
This project is built using the following technologies:

- **Express.js** – A Node.js framework for building the RESTful API.
- **MongoDB** – A NoSQL database for storing reports and their statuses.
- **RabbitMQ** – A message queue for handling asynchronous report generation.

### **Architecture**
The application runs inside **Docker Compose**, orchestrating multiple services together. It consists of **five containers**:

1. **API Server (Express.js)** – Handles incoming requests and manages report creation, retrieval, and cancellation.
2. **Worker (Node.js)** – Listens to the RabbitMQ queue and processes report generation asynchronously.
3. **Cron Job (Node.js)** – Periodically checks for scheduled reports and queues them for processing.
4. **MongoDB** – Stores the report data on disk.
5. **RabbitMQ** – Manages the event queue for processing reports.

Advantages of this architecture:
- **Permanent Storage** - Storing data on disk ensures that reports persist across restarts and failures.
- **Scalability** – API, worker, and cron jobs run in separate containers, making it easy to scale independently.
- **Fault Tolerance** – If one component (e.g., API or worker) crashes, others continue working. Also, RabbitMQ ensures messages aren’t lost in case of worker failure with durable queue.
- **Containerized Deployment** – Docker Compose simplifies running and managing all services in a reproducible environment.

### **Scaling to Multiple Instances**
Docker Compose makes it easy to run multiple instances of a service. For example, to run three instances of the cron job, simply use `docker compose up --scale scheduler-job=3`.

Running multiple instances introduces risks of race conditions and concurrency issues, which must be handled carefully to ensure data consistency and prevent conflicts.

- **Scaling the API Server**
  - `POST /reports` and `GET /reports/:id` are safe from concurrency issues due because they do not perform any updates on existing reports.
  - `DELETE /reports/:id` can have concurrency risks if multiple users try to delete the same report. This problem is avoided by using MongoDB's atomic operation `findOneAndUpdate`.
  - A load balancer (e.g., Nginx, HAProxy) is needed to distribute requests among the API instances. Currently it is not  yet implemented.
- **Scaling the Cron Job**
  - Since cron jobs run periodically, multiple cron job instances may fetch the same scheduled reports.
  - Again by using `findOneAndUpdate`, it's guaranteed only one instance updates a specific report, which then publishes the report to queue.
- **Scaling the Queue Worker**
  - RabbitMQ ensures that a single message is only consumed by one worker. If a worker fails, the message remains in the queue and is picked up by another worker.

## Future Work  

### **Codebase**
  - Move business logics (e.g., `scheduledTime` validation) from controllers to a separate utility file. Controllers should be thin and dumb. Then, write unit tests for the extracted logic.
  - Create a **DAO (Data Access Object)** layer to handle database interactions. This leads to a more modular codebase and makes switching databases easier in the future.
  - Store report statuses in a single enum throughout the codebase for better maintainability. 
  - Restructure to have only three top-level folders:  
    - `api/` → Express backend  
    - `workers/` → Queue workers  
    - `jobs/` → Cron jobs
    then also split them into different Docker projects.

### **Security & Best Practices**  
- Move sensitive credentials (MongoDB, RabbitMQ, etc.) to `.env` file.  
- Implement proper username / password authentication for MongoDB & RabbitMQ.  
- Validate all API request bodies properly before processing.
- Refactor the response body to exclude unnecessary MongoDB fields to make it more user-friendly.

### **Logging & Monitoring**  
- Log errors a logging library.  
- Log document changes in the database.  

### **Performance & Scalability**  
  - Create database indexes for faster data retrieval.  
  - Create Mongo replica sets for better availability & fault tolerance.
  - Add a load balancer to distribute traffic across multiple API instances.