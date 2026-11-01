THAM CHINH FULL - VU AN NGUOI BAO AN

MO TA
- Website tinh HTML/CSS/JS.
- Admin upload video truc tiep len Supabase Storage.
- Video lon hon 6MB se dung TUS resumable upload.
- Danh sach video duoc luu trong file index.json tren cung bucket.
- Nguoi xem co link website se thay video admin da upload.

TAI KHOAN ADMIN DEMO
Email: admin@thamchinh.vn
Mat khau: admin123

CAU HINH SUPABASE
1. Tao project tren https://supabase.com
2. Vao Storage > New bucket.
3. Tao bucket ten videos va bat Public bucket.
4. Vao Project Settings > API.
5. Copy Project URL va anon public key.
6. Dien vao config.js:
   supabase: {
     url: "https://xxxxx.supabase.co",
     anonKey: "xxxxx",
     bucket: "videos",
     folder: "uploads",
     manifestPath: "index.json",
     maxFileSizeMB: 200
   }

STORAGE POLICIES DE TEST
Trong Supabase Storage policies, cho phep anon select/insert/update tren bucket videos de demo.
Khi public that, nen them Supabase Auth hoac backend rieng de chi admin co quyen upload.

UPLOAD VIDEO LON
- Vao Storage > bucket VIDEOS/videos > Settings.
- Tang File size limit len bang hoac cao hon maxFileSizeMB trong config.js.
- Vi du muon upload video 200MB thi bucket File size limit phai >= 200MB.

CHAY LOCAL
1. Mo du an bang VS Code.
2. Cai extension Live Server.
3. Mo index.html va chon Open with Live Server.

DEPLOY PUBLIC
- Netlify: Add new site > Deploy manually > keo tha thu muc du an.
- Vercel: Import project hoac keo tha thu muc du an, Framework Preset: Other.
