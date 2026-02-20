# Use an official OpenJDK runtime as a parent image
FROM openjdk:21-alpine

# Copy the JAR file to the container
ADD target/userservice-0.0.1-SNAPSHOT.jar userservice-0.0.1-SNAPSHOT.jar

# Run the application
ENTRYPOINT [ "java","-jar","userservice-0.0.1-SNAPSHOT.jar" ]