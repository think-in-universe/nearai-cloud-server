# Pin base image digest (important!)
FROM alpine:3.22.2@sha256:4b7ce07002c69e8f3d704a9c5d6fd3053be500b7f1c69fc0d80990c2ad8dd412

# Make build timestamps deterministic
ARG SOURCE_DATE_EPOCH
ENV SOURCE_DATE_EPOCH=$SOURCE_DATE_EPOCH
LABEL org.opencontainers.image.created=$SOURCE_DATE_EPOCH

# Ensure consistent file metadata
RUN mkdir /app && \
    echo "Hello reproducible world!" > /app/hello.txt && \
    touch -d "@${SOURCE_DATE_EPOCH}" /app/hello.txt

# Default command
CMD ["cat", "/app/hello.txt"]
