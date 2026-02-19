# Use an official OpenJDK runtime as a parent image
FROM openjdk:17-alpine

# Copy the JAR file to the container
ADD target/taskservice-0.0.1-SNAPSHOT.jar taskservice-0.0.1-SNAPSHOT.jar

# Run the application
ENTRYPOINT [ "java","-jar","productservice-0.0.1-SNAPSHOT.jar" ]