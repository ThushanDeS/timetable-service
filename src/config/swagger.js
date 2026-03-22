const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Timetable Service API",
      version: "1.0.0",
      description:
        "Timetable Management microservice for Smart Campus Services. Handles timetable generation, schedule viewing, and updates.",
      contact: { name: "Student 3" },
    },
    servers: [
      {
        url: "https://timetable-service-vzzm.onrender.com",
        description: "Production (Render) server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);
