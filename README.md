# SafeBite Main Backend

## Development

Followong are the list of script that can be run in the project

| Script Name     | Description                            | Command                   |
| --------------- | -------------------------------------- | ------------------------- |
| dev             | Runs app in development mode           | `npm run dev`             |
| build           | Builds the app with tsc to dist folder | `npm run build`           |
| start           | Starts the build                       | `npm run start`           |
| prisma:generate | Generates prisma client types          | `npm run prisma:generate` |
| prisma:migrate  | Runs prisma db migration               | `npm run prisma:migrate`  |

### Project Structure

```
├─ controllers
├─ dtos
├─ prisma
├─ routes
├─ services
├─ utils
├─ app.ts
└─ server.ts
```

| Folder      | Description                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| controllers | contains all the controllers for the routes                                                                                     |
| dtos        | contains all the data transfer objects berfore goes to service, here also defined request validation constraint using decorator |
| prisma      | contains all the prisma related files, mainly prisma schema (schema.prisma)                                                     |
| routes      | contains all the routes                                                                                                         |
| services    | contains all the services, all business logic lies here                                                                         |
| utils       | contains all the utility functions which can be used anywhere in the project and not specific to any module                     |
| app.ts      | contains initialization of express app, all the middlewares and service                                                         |
| server.ts   | contains the server initialization code                                                                                         |

### Prerequisites

-   Node.js v18.15.0
-   PostgreSQL

### How to run

1. Install all dependencies

```bash
npm install
```

2. Create a `.env.development.local` file in the root directory, use `.env.example` as a template

3. If you run this for the first time, migrate prisma schema with `npm run prisma:migrate` 

4. Start the development server

```bash
npm run dev
```

## Deployment

TBA
