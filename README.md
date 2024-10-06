## Event Ticket Booking System --- Great Brands Nigeria Limited

This project was built using a class-based architecture to promote a more organized and modular structure. By encapsulating related functionalities within classes, each class can focus on a specific domain, such as event, booking, or cancellation management, making the code easier to manage and scale.

Prisma was chosen as the ORM because of its intuitive, type-safe query system and strong support for TypeScript. It simplifies database interactions by providing an abstraction layer that reduces the complexity of raw SQL queries while maintaining performance. Prisma's migration system ensures smooth schema evolution, making it easier to maintain and update the database structure as the project grows. Its integration with TypeScript enhances type safety, preventing runtime errors and making the code more robust.

## Local Development Setup

Docker and Git are Prerequisites.

- Clone the repository
- Create a `.env` file and fill in the required fields. See `.env.example` for blueprint.
- Run `yarn install` or `yarn` to install all project dependency
- Run `docker compose up` to start the postgres container used in this application
- Connect to the database with your preferred database client
- Run `yarn prisma:migrate` to sync the Prisma models with your database in development mode.
- Run `yarn dev` to start the server in development mode
- Run `yarn test` to execute the test suite

## Entity Relational Diagram

[https://dbdiagram.io/d/Event-Ticket-Booking-System-66fbeb1cfb079c7ebdf6782a](https://dbdiagram.io/d/Event-Ticket-Booking-System-66fbeb1cfb079c7ebdf6782a)

## API Documentation

[https://documenter.getpostman.com/view/20628325/2sAXxMfYrk](https://documenter.getpostman.com/view/20628325/2sAXxMfYrk)
