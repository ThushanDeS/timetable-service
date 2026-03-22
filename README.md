# Timetable Service — Smart Campus Services

Timetable Management microservice for the Smart Campus Services platform (CTSE Cloud Computing Assignment).

## Features

- **Auto-Generate Timetable** from enrolled courses (calls Course Service)
- **Manual Entry CRUD** — Add, update, delete timetable entries
- **Time Conflict Detection** — Prevents overlapping schedules
- **Group by Day** — Returns timetable organized by weekday
- **Inter-Service Auth** — JWT validation via Auth Service
- **Security** — Helmet, CORS, rate limiting, input validation (Joi)

## Tech Stack

- Node.js 18 + Express
- MongoDB Atlas (Mongoose ODM)
- Axios (for inter-service communication with Auth & Course Services)
- Docker (multi-stage build, non-root user)
- GitHub Actions CI/CD
- SonarCloud + Snyk (DevSecOps)

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with MongoDB URI, JWT secret, Auth/Course Service URLs
npm run dev     # http://localhost:3003
```

### Docker

```bash
docker build -t timetable-service .
docker run -p 3003:3003 --env-file .env timetable-service
```

## API Endpoints

| Method | Endpoint              | Auth | Description                         |
| ------ | --------------------- | ---- | ----------------------------------- |
| GET    | `/timetable`          | JWT  | Get student's timetable             |
| POST   | `/timetable/generate` | JWT  | Auto-generate from enrolled courses |
| POST   | `/timetable`          | JWT  | Add entry manually                  |
| PUT    | `/timetable/:id`      | JWT  | Update entry                        |
| DELETE | `/timetable/:id`      | JWT  | Remove entry                        |
| DELETE | `/timetable`          | JWT  | Clear entire timetable              |
| GET    | `/health`             | No   | Health check                        |

### API Documentation

Once running: http://localhost:3003/api-docs

## Production Deployment

- **Cloud Provider:** Microsoft Azure
- **Service:** Azure Container Apps (managed container orchestration)
- **Registry:** Azure Container Registry (`campusservices.azurecr.io`)
- **Live URL:** https://timetable-service.redisland-b57e0bf2.eastus.azurecontainerapps.io

## CI/CD Pipeline

1. **Lint & Test** — ESLint + Jest with coverage
2. **Security Scan** — SonarCloud (SAST) + Snyk (dependency vulnerabilities)
3. **Build & Push** — Docker build → push to Azure Container Registry
4. **Deploy** — Update Azure Container App with new image

## Inter-Service Communication

1. **Auth Service**: Validates JWT tokens via `GET /auth/validate`
2. **Course Service**: Fetches enrolled courses via `GET /courses/my` for timetable generation

## Testing

```bash
npm test
```

## License

MIT
