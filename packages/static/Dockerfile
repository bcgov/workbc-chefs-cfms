FROM node:20-alpine3.20 AS builder
# Set the working directory to /app inside the container
ENV NODE_ENV=production
ARG VITE_REACT_ENVIRONMENT
ENV VITE_REACT_ENVIRONMENT=$VITE_REACT_ENVIRONMENT
ARG VITE_APPLICANT_URL
ENV VITE_APPLICANT_URL=$VITE_APPLICANT_URL
ARG VITE_ADMIN_URL
ENV VITE_ADMIN_URL=$VITE_ADMIN_URL
WORKDIR /app
# Copy app files
COPY . /app
COPY tsconfig.json ./
# Install dependencies (npm ci makes sure the exact versions in the lockfile gets installed)
RUN npm install --omit=dev --ignore-scripts
# Build the app
RUN npm run build

# Bundle static assets with nginx
FROM nginxinc/nginx-unprivileged:1.27-alpine AS production
# Copy built assets from `builder` image
COPY --from=builder /app/dist /usr/share/nginx/html
# Add your nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Expose port
EXPOSE 8082
# Start nginx
CMD ["nginx", "-g", "daemon off;"]
