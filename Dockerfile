FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
ENV MAVEN_OPTS="-Xmx1024m -XX:+TieredCompilation -XX:TieredStopAtLevel=1"
COPY . .
RUN if [ -f pom.xml ]; then \
      mvn clean package -DskipTests && cp target/*.jar /app/app.jar; \
    else \
      cd backend && mvn clean package -DskipTests && cp target/*.jar /app/app.jar; \
    fi

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/app.jar app.jar
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Dserver.port=${PORT:-8080} -jar app.jar"]
