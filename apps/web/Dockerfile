FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm --workspace apps/web run build

FROM nginx:alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
USER nginx
EXPOSE 80

