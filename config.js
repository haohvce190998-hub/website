/*
  CẤU HÌNH SUPABASE + VIETQR / MOMO

  Supabase:
  1. Tạo project Supabase.
  2. Tạo Storage bucket public, ví dụ: videos.
  3. Điền url, anonKey và bucket bên dưới.

  VietQR:
  - bankId ví dụ: MB, VCB, BIDV, TCB, ACB.
  - accountNo là số tài khoản nhận tiền.
  - accountName là tên chủ tài khoản.

  MoMo:
  - Điền số điện thoại MoMo thật.
*/

window.THAM_CHINH_CONFIG = {
  // Dien Supabase config de admin upload video va moi nguoi cung xem duoc video.
  supabase: {
url: "https://gjrzlhljchvxibrtrrgx.supabase.co",
anonKey: "sb_publishable_nKYllPcLgq40Kk8vTEauhg_1b3cqhg2",
    bucket: "VIDEOS",
    folder: "uploads",
    manifestPath: "index.json",
    usersPath: "users.json",
    commentsPath: "comments.json",
    charactersPath: "characters.json",
    maxFileSizeMB: 200
  },

  vietqr: {
    bankId: "MB",
    accountNo: "0123456789",
    accountName: "THAM CHINH GAME SHOW"
  },

  momo: {
    phone: "0900000000",
    accountName: "THAM CHINH GAME SHOW"
  },

  /*
    EmailJS tu dong gui ve qua email:
    1. Tao tai khoan tai https://www.emailjs.com/
    2. Tao Email Service.
    3. Tao Email Template voi cac bien:
       to_email, to_name, ticket_code, ticket_type, time_slot, quantity,
       total, qr_url, email_body
    4. Dien publicKey, serviceId, templateId ben duoi.
  */
  emailjs: {
    publicKey: "cfCb9xgAFgB6Rjlut",
    serviceId: "service_it8vx47",
    templateId: "template_sxemyp3"
  }
};
