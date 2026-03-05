# toryOrderFrontend/Dockerfile

# --- 1단계: 빌드 (Node.js) ---
FROM node:22 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
# Vite 빌드 실행 -> dist 폴더 생성됨
RUN npm run build

# --- 2단계: 실행 (Nginx) ---
FROM nginx:alpine

# 1. 빌드된 프론트엔드 결과물 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 2. 커스텀 Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]