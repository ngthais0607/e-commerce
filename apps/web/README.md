# E-Commerce Frontend

Frontend application built with React + Vite, TypeScript, and Tailwind CSS.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. **Quan trọng:** Đảm bảo backend API đang chạy trước khi start frontend:
```bash
# Terminal 1: Chạy backend
cd ../api
npm run dev

# Terminal 2: Chạy frontend
cd ../web
npm run dev
```

3. The app will be available at http://localhost:5173

## API Configuration

Frontend sử dụng Vite proxy để kết nối với backend:
- Development: Requests đến `/api` sẽ được proxy đến `http://localhost:4000`
- Production: Có thể set `VITE_API_URL` trong `.env` để dùng absolute URL

Nếu gặp lỗi "Network Error":
1. Kiểm tra backend có đang chạy tại `http://localhost:4000` không
2. Kiểm tra CORS configuration trong backend
3. Kiểm tra database connection trong backend

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Tech Stack

- React 18
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Zustand
- Axios
