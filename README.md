# Hướng dẫn chạy dự án

Đây là một ứng dụng Node.js sử dụng Express và MongoDB.

## Yêu cầu

- [Node.js](https://nodejs.org/) (phiên bản 14 trở lên)
- [npm](https://www.npmjs.com/) (thường đi kèm với Node.js)

## Cài đặt

1.  Mở terminal tại thư mục gốc của dự án.
2.  Cài đặt các thư viện cần thiết:

    ```bash
    npm install
    ```

## Chạy ứng dụng

1.  Khởi động server:

    ```bash
    npm start
    ```

2.  Mở trình duyệt và truy cập: `http://localhost:8000`

## Tài khoản Admin mặc định

Khi chạy lần đầu, hệ thống sẽ tự động tạo tài khoản admin nếu chưa tồn tại:
- Username: `admin`
- Password: `admin123`

## Cấu hình Database

Dự án sử dụng MongoDB. Chuỗi kết nối được cấu hình trong `database.js`. Mặc định nó sẽ kết nối đến một database trên cloud. Nếu bạn muốn chạy database local, hãy cài đặt MongoDB và cập nhật biến môi trường `MONGODB_URI`.
