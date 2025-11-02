<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Task Organizer</title>
    <link rel="stylesheet" href="styles.css">
    
    <style>
        .form-row-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .form-group-span-2 { grid-column: span 2; }
        .form-group-span-3 { grid-column: span 3; }
        @media (max-width: 768px) {
            .form-row-grid { grid-template-columns: 1fr; }
            .form-group-span-2, .form-group-span-3 { grid-column: span 1; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 Student Task Organizer</h1>
            <p>จัดการงานและตารางเรียนของคุณ (เวอร์ชัน LINE)</p>
        </div>

        <div class="stats-grid" id="statsGrid">
            </div>

        <div class="config-section">
            <h3>➕ เพิ่มงานใหม่</h3>
            <div class="form-row-grid"> 
                <div class="form-group">
                    <label for="taskName">📝 ชื่องาน:</label>
                    <input type="text" id="taskName" placeholder="เช่น รายงาน, การบ้าน, สอบ">
                </div>
                <div class="form-group">
                    <label for="taskAssignedOn">🕒 วันที่สั่งงาน: (บังคับ)</label>
                    <select id="taskAssignedOn">
                        <option value="ไม่ระบุ">-- กรุณาเลือก --</option>
                        <option value="จันทร์เช้า">จันทร์เช้า</option>
                        <option value="จันทร์บ่าย">จันทร์บ่าย</option>
                        <option value="อังคารเช้า">อังคารเช้า</option>
                        <option value="อังคารบ่าย">อังคารบ่าย</option>
                        <option value="พุธเช้า">พุธเช้า</option>
                        <option value="พุธบ่าย">พุธบ่าย</option>
                        <option value="พฤหัสเช้า">พฤหัสเช้า</option>
                        <option value="พฤหัสบ่าย">พฤหัสบ่าย</option>
                        <option value="ศุกร์เช้า">ศุกร์เช้า</option>
                        <option value="ศุกร์บ่าย">ศุกร์บ่าย</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="taskDue">📅 วันส่ง/วันสอบ: (บังคับ)</label>
                    <input type="date" id="taskDue">
                </div>
                <div class="form-group">
                    <label for="taskSubject">📚 วิชา: (ไม่บังคับ)</label>
                    <select id="taskSubject" onchange="checkOtherSubject(this)">
                        <option value="">...กำลังโหลดวิชา...</option>
                    </select>
                    <input type="text" id="taskSubjectOther" style="display:none; margin-top:10px;" placeholder="กรอกชื่อวิชา (เช่น วิชา Lab, กิจกรรม)">
                </div>
                <div class="form-group">
                    <label for="taskPriority">⚡ ระดับความสำคัญ:</label>
                    <select id="taskPriority">
                        <option value="normal">🟢 ปกติ</option>
                        <option value="important">🟡 สำคัญ</option>
                        <option value="urgent">🔴 เร่งด่วน</option>
                    </select>
                </div>
                <div class="form-group form-group-span-3">
                     <label for="taskDescription">📋 รายละเอียดเพิ่มเติม:</label>
                     <textarea id="taskDescription" rows="2" placeholder="หมายเหตุหรือรายละเอียด (ไม่บังคับ)"></textarea>
                </div>
            </div> 
            <button class="btn" onclick="addTask()">➕ เพิ่มงาน</button>
        </div>

        <div class="tasks-section">
            <h3 style="color: #00B900; margin-bottom: 20px;">📋 รายการงาน</h3>
            <div id="tasksList">
                </div>
        </div>
        
        </div>
    <script src="script.js"></script>
</body>
</html>
