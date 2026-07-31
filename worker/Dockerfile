FROM alpine:latest

RUN apk add --no-cache g++ make python3

# Security: Create a non-root user to run the untrusted code
RUN adduser -D sandboxuser
USER sandboxuser

# Mounting code when running the container
WORKDIR /app