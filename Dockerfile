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
# 빌드된 파일들을 Nginx가 서비스하는 폴더로 이동
COPY --from=builder /app/dist /usr/share/nginx/html
# 리액트 라우터(새로고침 시 404 방지) 설정
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]