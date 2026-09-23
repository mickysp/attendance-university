# Frontend API services

เรียก API จากหน้าเว็บและ component ผ่าน service ของแต่ละหมวด:

```text
api/
  client.ts       # fetch, query encoding, JSON และ FormData
  auth/           # login, OTP, password, user, profile, avatar, logout
  administrators/ # โหลด/เพิ่มผู้ใช้ เปลี่ยนสิทธิ์ และลบผู้ใช้
  attendance/     # บันทึกเช็กชื่อ สรุป และประวัติ
  check-in/       # ตั้งค่าฟอร์มเช็กชื่อ
  classes/        # รายวิชา
  majors/         # สาขาวิชา
  schedule/       # ตารางเวลาเช็กชื่อ
  students/       # นักศึกษาและอัปโหลดไฟล์
  teachers/       # อาจารย์
```

```ts
import { classesApi } from "@/services/api/classes";

const response = await classesApi.get(classId, { cache: "no-store" });
const result = await response.json();
if (!response.ok || !result.success) {
  throw new Error(result.message || "โหลดข้อมูลไม่สำเร็จ");
}
```

- Service กำหนด URL, HTTP method และชนิดข้อมูลที่ส่ง ส่วนหน้าเว็บจัดการ loading, validation และข้อความแจ้งเตือน
- คืนค่า `Promise<Response>` เดิม เพื่อรองรับการตรวจ `status`, `ok`, `.json()` และ `.text()` ของแต่ละหน้า โดยไม่อ่าน body ซ้ำ
- HTTP 4xx/5xx ไม่ throw อัตโนมัติ; network error และการ abort ส่งต่อไปยัง caller
- ส่ง `signal` และ `cache` ผ่าน options ได้ ส่วน auth ที่ใช้ cookie กำหนด `credentials: "include"` ไว้ใน service
- `studentsApi.uploadFile(formData)` และ `authApi.uploadAvatar(formData)` ไม่กำหนด Content-Type เพื่อให้ browser ใส่ multipart boundary
- เพิ่ม endpoint ใหม่ในหมวดที่เกี่ยวข้อง แล้ว import มาใช้ หลีกเลี่ยง `fetch` และ URL `/api/...` ใน component
- ชนิดข้อมูลนักศึกษารวมอยู่ใน `src/types/students.ts` โดย request ของ service อิง payload ของ route ปัจจุบัน ซึ่งยังต่างจาก types บางส่วนที่ใช้ `offeringId`

ตรวจสอบด้วย `npm run lint`
