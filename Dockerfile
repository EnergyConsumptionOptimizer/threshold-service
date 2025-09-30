# Stage 1: Build with Gradle
FROM gradle:9.1.0-jdk-jammy AS build
WORKDIR /usr/src/app

COPY build.gradle.kts settings.gradle.kts gradle.properties ./
COPY gradle/ ./gradle/
COPY . .

RUN gradle build

# Stage 2: Runtime with Node.js
FROM node:24-alpine AS runtime
WORKDIR /app
RUN apk add --update --no-cache curl

# Copy necessary files from the build stage
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package.json ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
