# คู่มือตั้งค่า OneDrive ENV

เอกสารนี้อธิบายว่า env ที่ใช้กับการอัปโหลดไฟล์ไป OneDrive มาจากไหน และต้องทำอย่างไรเมื่อเปลี่ยนบัญชีอีเมลที่ใช้เก็บไฟล์

## ค่าที่ต้องมี

```env
ONEDRIVE_CLIENT_ID=
ONEDRIVE_CLIENT_SECRET=
ONEDRIVE_REFRESH_TOKEN=
ONEDRIVE_FOLDER_ID=
ONEDRIVE_SCOPE=offline_access Files.ReadWrite
ONEDRIVE_TOKEN_ENDPOINT=https://login.microsoftonline.com/consumers/oauth2/v2.0/token
```

## สรุปสั้น: แต่ละค่าย่อมาจากอะไร

- `ONEDRIVE_CLIENT_ID` = รหัสแอปจาก Azure App Registration
- `ONEDRIVE_CLIENT_SECRET` = Secret Value ของแอป (ไม่ใช่ Secret ID)
- `ONEDRIVE_REFRESH_TOKEN` = โทเคนของ "บัญชีผู้ใช้" ที่ใช้เก็บไฟล์
- `ONEDRIVE_FOLDER_ID` = id ของโฟลเดอร์ปลายทางใน OneDrive ของบัญชีนั้น

## 1) วิธีได้ `ONEDRIVE_CLIENT_ID`

1. เข้า Azure Portal
2. ไปที่ `App registrations` > เลือกแอป
3. หน้า `Overview` > คัดลอก `Application (client) ID`
4. นำมาใส่ `ONEDRIVE_CLIENT_ID`

## 2) วิธีได้ `ONEDRIVE_CLIENT_SECRET`

1. เข้าแอปเดิมใน Azure Portal
2. ไปที่ `Certificates & secrets`
3. กด `New client secret`
4. คัดลอกค่าในคอลัมน์ `Value` ทันที
5. นำมาใส่ `ONEDRIVE_CLIENT_SECRET`

สำคัญ:

- ใช้ `Value` เท่านั้น
- ห้ามใช้ `Secret ID`

## 3) วิธีได้ `ONEDRIVE_REFRESH_TOKEN`

### 3.1 ขอ Authorization Code

ใช้ URL นี้ (แทนค่า `<CLIENT_ID>` ให้เรียบร้อย):

```text
https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?client_id=<CLIENT_ID>&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fcallback&response_mode=query&scope=offline_access%20Files.ReadWrite
```

จากนั้น:

1. ล็อกอินบัญชี Microsoft ที่จะใช้เป็นบัญชีกลางสำหรับเก็บไฟล์
2. หลังยอมรับสิทธิ์ Browser จะพาไป URL ประมาณ `http://localhost:8000/callback?code=...`
3. คัดลอกค่า `code` ไปใช้ในขั้นถัดไป (ต้องลบ `%24%24` ออกด้วย)

หมายเหตุ:

- หน้า `404 Cannot GET /callback` ถือว่าปกติ (ไม่ใช่ปัญหา)
- ต้องใช้ `redirect_uri` ให้ตรงกับที่ตั้งใน App Registration

### 3.2 แลก Code เป็น Token

ตัวอย่าง PowerShell:

```powershell
$body = @{
  client_id     = '<CLIENT_ID>'
  client_secret = '<CLIENT_SECRET_VALUE>'
  code          = '<AUTH_CODE>'
  redirect_uri  = 'http://localhost:8000/callback'
  grant_type    = 'authorization_code'
  scope         = 'offline_access Files.ReadWrite'
}

$tok = Invoke-RestMethod -Method Post `
  -Uri 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token' `
  -ContentType 'application/x-www-form-urlencoded' `
  -Body $body
```

ดึงค่า refresh token แบบเต็ม:

```powershell
$tok.refresh_token
```

แล้วนำค่าเต็มไปใส่ `ONEDRIVE_REFRESH_TOKEN`

## 4) วิธีได้ `ONEDRIVE_FOLDER_ID`

### 4.1 วิธีได้ `access_token` (ใช้คู่กับ refresh token)

ใช้ `ONEDRIVE_REFRESH_TOKEN` ที่ได้จากข้อ 3.2 เพื่อแลก `access_token`:

```powershell
$body = @{
  client_id     = '<CLIENT_ID>'
  client_secret = '<CLIENT_SECRET_VALUE>'
  refresh_token = '<REFRESH_TOKEN>'
  grant_type    = 'refresh_token'
  scope         = 'offline_access Files.ReadWrite'
}

$tok = Invoke-RestMethod -Method Post `
  -Uri 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token' `
  -ContentType 'application/x-www-form-urlencoded' `
  -Body $body

$accessToken = $tok.access_token
```

### 4.2 หา `ONEDRIVE_FOLDER_ID` จากชื่อโฟลเดอร์

หลังได้ `access_token` แล้ว ให้ list โฟลเดอร์ root:

```powershell
Invoke-RestMethod -Method Get `
  -Uri "https://graph.microsoft.com/v1.0/me/drive/root/children?`$select=id,name,folder" `
  -Headers @{ Authorization = "Bearer $accessToken" } |
  Select-Object -ExpandProperty value |
  Where-Object { $_.name -eq 'TRMS' } |
  Select-Object id,name
```

ค่าที่ต้องใช้คือคอลัมน์ `id` แล้วนำไปใส่ `ONEDRIVE_FOLDER_ID`

ตัวอย่าง:

- `24A1A290D53B75EC!sa7fe809bf9544f3ca1f43362d4a8de84`

## 5) ถ้าจะเปลี่ยน "อีเมลบัญชีที่ใช้เก็บไฟล์" ในอนาคต

ทำใหม่เฉพาะ 2 ค่า:

1. ออก `ONEDRIVE_REFRESH_TOKEN` ใหม่จากบัญชีใหม่
2. หา `ONEDRIVE_FOLDER_ID` ใหม่ของบัญชีใหม่

ส่วนใหญ่ไม่ต้องเปลี่ยน:

- `ONEDRIVE_CLIENT_ID`
- `ONEDRIVE_CLIENT_SECRET`

(ยกเว้นกรณีเปลี่ยนไปใช้ App Registration คนละตัว)

## 6) เช็คลิสต์ก่อนทดสอบอัปโหลด

1. ค่า env ครบและไม่มี `...`
2. `ONEDRIVE_REFRESH_TOKEN` เป็นค่าเต็มบรรทัดเดียว
3. `ONEDRIVE_FOLDER_ID` มาจาก Graph API ของบัญชีเดียวกับ refresh token
4. Restart API ทุกครั้งหลังแก้ `.env`
5. ทดสอบอัปโหลด 1 ไฟล์จากหน้า Create Course

## 7) ปัญหาที่เจอบ่อย

- `invalid_client`:
  - ใช้ `client_secret` ผิด (เอา Secret ID มาแทน Value)
- `invalid_grant`:
  - code หมดอายุ/ใช้ซ้ำ
  - refresh token ไม่ถูกต้องหรือ copy ไม่ครบ
- `The provided item ID is not valid for the requested drive`:
  - `ONEDRIVE_FOLDER_ID` ไม่อยู่ใน drive ของบัญชีเดียวกับ refresh token
