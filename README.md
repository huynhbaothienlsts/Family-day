# LSTS Family Day Live Score

Website chấm điểm trực tiếp cho Family Day của Trường Đinh Thiện Lý. GitHub Pages chỉ phục vụ giao diện; Microsoft 365, Firebase Authentication và Cloud Firestore vẫn chạy trên nền tảng đám mây.

```text
GitHub Pages → Vite/React → Firebase Authentication → Microsoft 365
                         → Cloud Firestore realtime
```

## 1. Yêu cầu

- Node.js 20 LTS
- Tài khoản GitHub và repository, ví dụ `family-day-live-score`
- Firebase project đã bật Cloud Firestore
- Microsoft Entra app registration
- Firebase service account chỉ dùng trên máy quản trị để tạo dữ liệu ban đầu

## 2. Cài đặt trên máy

```powershell
git clone https://github.com/USERNAME/family-day-live-score.git
cd family-day-live-score
npm install
Copy-Item .env.example .env
npm run dev
```

Điền `.env` theo Firebase Console → Project settings → Your apps → Web app. Không tải `.env` lên GitHub. Các trang dùng hash routing, ví dụ `/#/schedule`, `/#/score-entry`, `/#/admin` và `/#/live`.

## 3. Firebase

1. Tạo Firebase project và Web app; bật Cloud Firestore.
2. Chạy `npx firebase login`, `npx firebase use --add`, rồi `npx firebase deploy --only firestore`.
3. Authentication → Sign-in method → Microsoft: bật provider và nhập Microsoft Application ID cùng client secret. Client secret chỉ nhập vào Firebase Console.
4. Authentication → Settings → Authorized domains: thêm `USERNAME.github.io` và giữ `localhost`.

Security Rules cho phép công khai đọc dữ liệu thi đấu, nhưng chỉ tài khoản Microsoft có bản ghi `users/{email viết thường}` và `active: true` mới được ghi điểm. Mỗi cập nhật điểm phải tạo audit log cùng transaction; rules kiểm tra audit theo match/version. Chỉ Admin quản lý users và cấu hình.

## 4. Microsoft Entra

Ứng dụng dùng **Firebase Microsoft OAuth provider**, không dùng MSAL trực tiếp.

1. Microsoft Entra Admin Center → App registrations → chọn/tạo ứng dụng.
2. Authentication → Add a platform → Web.
3. Thêm redirect URI Firebase hiển thị, thường là `https://YOUR_FIREBASE_PROJECT.firebaseapp.com/__/auth/handler`.
4. Firebase xử lý callback rồi trở về GitHub Pages. Nếu chính sách Entra yêu cầu origin/SPA URL, thêm `https://USERNAME.github.io/family-day-live-score/`.
5. Tạo client secret và chỉ nhập vào Firebase Console.
6. Đặt `VITE_MICROSOFT_TENANT` bằng Directory tenant ID của trường. Dùng `common` chỉ khi cần; allowlist vẫn quyết định quyền.

## 5. Tạo Admin đầu tiên và nạp lịch

Tải Firebase service-account JSON về thư mục an toàn ngoài repository:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS='C:\secure\service-account.json'
$env:INITIAL_ADMIN_EMAIL='admin@school.edu.vn'
npm run seed
```

Lệnh tạo Admin, 4 Houses, 32 Families, 2 môn và 32 trận. Seed có ID cố định và dùng merge, nhưng vẫn nên sao lưu trước khi chạy lại trên dữ liệu sự kiện thật. Không commit service-account JSON.

## 6. GitHub và GitHub Pages

1. Tạo repository `family-day-live-score`, commit mã nguồn và push nhánh `main`.
2. Settings → Secrets and variables → Actions: tạo bảy secrets:

   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_MICROSOFT_TENANT`

3. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
4. Push vào `main`. Workflow dùng Node 20, chạy `npm ci`, tests, build và deploy `dist`.

Firebase web config xuất hiện trong bundle trình duyệt theo thiết kế và không phải cơ chế bảo mật. Bảo mật dựa trên Authentication, allowlist và Firestore Rules. Không bao giờ commit Firebase Admin/service-account private key, Microsoft client secret, private certificate, refresh token hoặc mật khẩu.

URL dự kiến:

- `https://USERNAME.github.io/family-day-live-score/#/`
- Live/projector: `https://USERNAME.github.io/family-day-live-score/#/live`
- Nhập điểm: `https://USERNAME.github.io/family-day-live-score/#/score-entry`
- Admin: `https://USERNAME.github.io/family-day-live-score/#/admin`

Hash routing không cần `404.html`. Vite dùng asset path tương đối nên repository subpath không làm hỏng CSS/JavaScript.

Firestore Rules không được Pages triển khai. Khi rules thay đổi, chạy `npx firebase deploy --only firestore` trên máy quản trị.

## 7. Khắc phục sự cố

| Vấn đề | Kiểm tra |
|---|---|
| Trang trắng | Actions có đủ secrets; xem lỗi Firebase trong Developer Tools |
| Asset 404 | Giữ `base: './'`; không dùng `/assets/...` |
| Route 404 | URL phải có `/#/`; ứng dụng dùng hash routing |
| Popup đăng nhập đóng | Microsoft provider bật và popup không bị chặn |
| Redirect URI mismatch | Entra phải có chính xác Firebase auth-handler URI |
| Unauthorized domain | Thêm `USERNAME.github.io`, không thêm path repository |
| Firestore permission denied | Deploy rules; kiểm tra email lowercase, role và `active` |
| Đăng nhập được nhưng không nhập điểm | Admin phải thêm email vào allowlist và bật Active |
| Mất kết nối | Chờ nhãn LIVE trở lại; không nhập lại khi đang hiển thị “Đang lưu…” |
| Xung đột cập nhật | Kiểm tra dữ liệu realtime mới rồi nhập lại |

## 8. Kiến trúc, hiệu năng và hosting thay thế

- Một realtime listener tải cả 32 matches; không query từng Family.
- Family/House totals được suy ra client-side.
- User/audit listeners chỉ mở ở Admin và đều unsubscribe khi unmount.
- Match transaction dùng `version` để ngăn ghi đè im lặng.
- `src/scoring.ts` cô lập chính sách cộng điểm thô vì điều lệ không quy định 3–1–0.

Firebase Hosting vẫn được giữ làm phương án dự phòng:

```powershell
npm run build
npx firebase deploy --only hosting,firestore
```
