## Event Ticket Booking System --- Great Brands Nigeria Limited

This project was built using a class-based architecture to promote a more organized and modular structure. By encapsulating related functionalities within classes, each class can focus on a specific domain, such as event, booking, or cancellation management, making the code easier to manage and scale.

Prisma was chosen as the ORM because of its intuitive, type-safe query system and strong support for TypeScript. It simplifies database interactions by providing an abstraction layer that reduces the complexity of raw SQL queries while maintaining performance. Prisma's migration system ensures smooth schema evolution, making it easier to maintain and update the database structure as the project grows. Its integration with TypeScript enhances type safety, preventing runtime errors and making the code more robust.

## Dockerized Development and Test Environments

This application has been fully dockerized to ease development and testing processes. This allows isolation of the Postgres database, ensuring consistency across different environments.



## Local Development Setup

Docker and Git are Prerequisites.

- Clone the repository
- Create a `.env` file and fill in the required fields. See `.env.example` for blueprint. (For the database url, get it from the docker-compose.dev.yml)
- Run `./pendt.sh -e dev -c up-build` to build and start the dev container
- Run `./pendt.sh -e dev -c exec -s server -r "npm run prisma:migrate" ` to sync the database with the prisma defines models
- Connect to the database with your preferred database client
- Test endpoints on your preferred API testing tool

## Test set up
- Clone the repository
- Run `./pendt.sh -e test -c up-build` to build and start/run the test container


> **Note:** For additional Docker-related commands, please refer to the `pendt-script-README.md` file.

## Entity Relational Diagram

[https://dbdiagram.io/d/Event-Ticket-Booking-System-66fbeb1cfb079c7ebdf6782a](https://dbdiagram.io/d/Event-Ticket-Booking-System-66fbeb1cfb079c7ebdf6782a)

## API Documentation

[https://documenter.getpostman.com/view/20628325/2sAXxMfYrk](https://documenter.getpostman.com/view/20628325/2sAXxMfYrk)
