FROM maven:3.9.11-eclipse-temurin-21 AS build

WORKDIR /app/backend

COPY renalCareAI/.mvn .mvn
COPY renalCareAI/mvnw renalCareAI/pom.xml ./
RUN chmod +x ./mvnw
RUN ./mvnw -q -DskipTests dependency:go-offline

COPY renalCareAI/src src
RUN ./mvnw -q -DskipTests clean package

FROM eclipse-temurin:21-jre

WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv python3-pip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/backend/target/*.jar app.jar
COPY chatbox-rag chatbox-rag
RUN python3 -m venv /app/chatbox-rag/.venv \
    && /app/chatbox-rag/.venv/bin/pip install --no-cache-dir -r /app/chatbox-rag/requirements.txt

EXPOSE 8080

ENV APP_RAG_WORKING_DIRECTORY=/app/chatbox-rag
ENV APP_RAG_COMMAND=/app/chatbox-rag/.venv/bin/python,-m,app.start
ENV APP_RAG_BASE_URL=http://127.0.0.1:8001
ENV RAG_HOST=127.0.0.1
ENV RAG_PORT=8001

ENTRYPOINT ["java", "-jar", "app.jar"]
