# LSTS Family Day Live Score

Ứng dụng chấm điểm Family Day dùng kiến trúc nhẹ:

```text
GitHub Pages → React/Vite → Google Apps Script Web App → Google Sheets
```

Không có tài khoản cá nhân, Firebase hoặc Microsoft OAuth. Giáo viên dùng tên và một mật khẩu sự kiện chung. Mật khẩu được băm và lưu trong Apps Script Properties, không nằm trong mã frontend hoặc Google Sheet.

## 1. Local development

Yêu cầu Node.js 20 LTS.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Sau khi triển khai Apps Script, đặt URL `/exec` vào `.env`:

```text
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

Không đặt mật khẩu trong `.env`; mọi biến Vite đều công khai trong bundle.

## 2. Create the Google Sheet

1. Tạo Google Sheet mới, ví dụ **LSTS Family Day Live Score**.
2. Extensions → Apps Script.
3. Sao chép toàn bộ [apps-script/Code.gs](apps-script/Code.gs) vào `Code.gs`.
4. Project Settings → bật **Show appsscript.json manifest file in editor**, rồi sao chép [apps-script/appsscript.json](apps-script/appsscript.json).
5. Save và chọn hàm `setupEvent`, nhấn Run, cấp quyền cho script.

`setupEvent()` tạo ba sheet:

### Matches

`matchId, sport, familyA, familyB, houseA, houseB, court, startTime, endTime, scoreA, scoreB, status, updatedBy, updatedAt, version`

Chứa đúng 32 trận được định nghĩa trước. Không chạy lại `setupEvent()` khi Matches đã có dữ liệu; hàm sẽ dừng để tránh ghi đè.

### AuditLog

`timestamp, matchId, sport, familyA, familyB, oldScoreA, oldScoreB, newScoreA, newScoreB, teacherName, action, version`

### Config

Chứa thông tin không nhạy cảm: tên sự kiện, ngày, thời gian, chu kỳ refresh và chính sách `raw_scores`.

## 3. Configure the shared password

Trong Apps Script editor, chạy một lần:

```javascript
setTeacherPassword('MẬT_KHẨU_SỰ_KIỆN_MỚI');
```

Cách dễ nhất là tạm thêm một hàm, chạy rồi xóa hàm tạm:

```javascript
function configurePasswordOnce() {
  setTeacherPassword('mật-khẩu-dài-và-khó-đoán');
}
```

Script tạo salt ngẫu nhiên và lưu `PASSWORD_SALT` cùng `TEACHER_PASSWORD_HASH` trong Project Settings → Script Properties. Mật khẩu thô không được lưu. Muốn đổi mật khẩu, chạy lại `setTeacherPassword()` với mật khẩu mới và tạo deployment version mới.

## 4. Deploy the Apps Script backend

1. Deploy → New deployment.
2. Type: **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone**. Quyền ghi vẫn cần token nhận được sau khi xác thực mật khẩu.
5. Deploy và sao chép URL kết thúc bằng `/exec`.
6. Mỗi lần sửa Apps Script: Deploy → Manage deployments → Edit → **New version** → Deploy.

API dùng GET đơn để tải cả 32 trận và POST `text/plain` để tương thích từ GitHub Pages mà không tạo CORS preflight. Apps Script trả JSON qua HTTPS.

## 5. API behavior

- `GET ?action=matches`: trả toàn bộ Matches.
- `POST {action:"authenticate", teacherName, password}`: xác thực hash và trả token 2 giờ.
- `POST {action:"updateMatch", token, matchId, version, scoreA, scoreB, status}`: kiểm tra token, điểm và version.

`LockService.getScriptLock()` tuần tự hóa write. Nếu version đã thay đổi, API trả `CONFLICT`; frontend không báo thành công và tải dữ liệu mới. Mỗi write thành công cập nhật Matches và thêm AuditLog trước khi phản hồi.

## 6. Test teacher login and score entry

1. Mở `/#/score-entry`.
2. Nhập tên giáo viên và mật khẩu chung.
3. Thử mật khẩu sai để xác nhận bị từ chối.
4. Chọn môn, nhập điểm bằng bàn phím số và lưu.
5. Kiểm tra Matches có `updatedBy`, `updatedAt`, `version` mới và AuditLog có dòng tương ứng.
6. Mở hai trình duyệt, tải cùng một trận rồi lưu lần lượt. Lần thứ hai phải nhận cảnh báo xung đột.
7. Tắt mạng trước khi lưu; giao diện phải hiện **Lưu thất bại**, không hiện **Đã lưu**.

## 7. GitHub Pages deployment

1. Tạo repository, ví dụ `family-day-live-score`, và push nhánh `main`.
2. Settings → Secrets and variables → Actions → New repository secret.
3. Tạo duy nhất `VITE_APPS_SCRIPT_URL` bằng URL Apps Script `/exec`.
4. Settings → Pages → Source: **GitHub Actions**.
5. Push vào `main` hoặc chạy workflow thủ công.

URL dự kiến:

- `https://USERNAME.github.io/family-day-live-score/#/`
- `https://USERNAME.github.io/family-day-live-score/#/live`
- `https://USERNAME.github.io/family-day-live-score/#/score-entry`

Vite dùng asset path tương đối và ứng dụng dùng hash routing, nên refresh không tạo 404.

## 8. Runtime behavior

- Frontend tải cả 32 matches bằng một request mỗi 7 giây; không reload trang.
- House/Family totals, ranking, current matches và progress được tính trong trình duyệt.
- Chỉ dữ liệu tên giáo viên và token ngắn hạn được giữ trong `sessionStorage`; kết quả chính thức luôn ở Google Sheets.
- Token có thời hạn hai giờ và có thể hết sớm nếu Apps Script CacheService thu hồi entry.
- House score dùng raw Family match scores; không có quy tắc 3–1–0.

## 9. Troubleshooting

| Vấn đề | Cách kiểm tra |
|---|---|
| Apps Script URL incorrect | Phải dùng URL deployment `/exec`, không dùng editor/dev URL |
| Permission error | Web app Execute as Me và access Anyone; chạy `setupEvent()` đã cấp quyền |
| API request fails | Mở URL `/exec?action=matches` trực tiếp; kiểm tra deployment version mới nhất |
| Password always rejected | Chạy lại `setTeacherPassword()`; kiểm tra Script Properties có hash và salt |
| Failed score save | Kiểm tra mạng, token hai giờ, Sheet headers và Apps Script Executions |
| Concurrent update warning | Dữ liệu đã được người khác sửa; xem dữ liệu mới rồi nhập lại |
| GitHub Pages blank | Secret URL phải tồn tại lúc build; xem Actions log và asset URLs `./assets/...` |
| Không thấy dữ liệu mới | Đợi tối đa 7 giây hoặc kiểm tra nhãn kết nối ở góc màn hình |

## Security notes

GitHub source và `VITE_APPS_SCRIPT_URL` là công khai. Đây là bình thường. Không commit mật khẩu, password hash/salt, token, hoặc bản sao Sheet chứa dữ liệu nhạy cảm. Mật khẩu chung phù hợp sự kiện ngắn, nhưng nên đổi trước sự kiện và đổi lại sau khi kết thúc.
