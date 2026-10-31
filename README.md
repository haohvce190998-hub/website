# Gameshow Ticket + Video Web App

MVP web app cho gameshow:
- Admin/Organizer đăng video giới thiệu gameshow
- Khách hàng đăng ký / đăng nhập
- Khách hàng mua/đặt 1 vé cho mỗi gameshow
- Có giới hạn số lượng vé
- Vé có mã và QR code
- Video upload lên Cloudinary bằng unsigned upload preset
- Database/Auth dùng Supabase

## 1. Cài đặt

```bash
npm install
cp .env.example .env
npm run dev
```

Điền `.env`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_CLOUDINARY_CLOUD_NAME=dokklo1c0
VITE_CLOUDINARY_UPLOAD_PRESET=ThamChinh
```

## 2. Tạo database Supabase

Vào Supabase > SQL Editor, chạy file:

```text
supabase/schema.sql
```

Sau khi tạo user đầu tiên, muốn biến user đó thành admin thì chạy:

```sql
update public.profiles
set role = 'admin'
where email = 'email-cua-ban@example.com';
```

## 3. Luồng sử dụng

### Admin / Organizer
- Đăng nhập
- Vào Admin Dashboard
- Tạo gameshow
- Upload video giới thiệu
- Xem danh sách vé đã bán

### Customer
- Đăng ký / đăng nhập
- Xem gameshow
- Mua/đặt vé
- Xem vé và QR code của mình

## 4. Lưu ý bảo mật

Bản này là MVP/demo. Nếu chạy thật:
- Nên dùng signed upload qua server thay vì unsigned upload
- Giới hạn dung lượng video trong Cloudinary preset
- Giới hạn định dạng mp4/mov/webm
- Bật kiểm duyệt nội dung video nếu public
- Không cấp role admin từ frontend
