// ตัวแปรสำหรับเก็บข้อมูล (ไม่ใช้ localStorage แล้ว)
let tasks = [];
let subjectsList = [];

// ========== ⬇️ ‼️‼️ สำคัญมาก ‼️‼️ ⬇️ ==========
// เมื่อคุณอัปโหลดเว็บขึ้น Render แล้ว ให้เอา URL ของ Render มาใส่ตรงนี้
// มันต้องชี้ไปที่ไฟล์ api.php ของคุณ
const API_URL = 'https://your-app-name.onrender.com/api.php'; 
// (เช่น https://student-tasks-abc.onrender.com/api.php)
// ===========================================


// --- (ฟังก์ชันโหลดวิชาจาก db.json ยังเหมือนเดิม) ---
async function loadSubjects() {
    try {
        const response = await fetch('db.json'); 
        if (!response.ok) {
            throw new Error('ไม่สามารถโหลดไฟล์ db.json ได้');
        }
        subjectsList = await response.json();
        
        const subjectDropdown = document.getElementById('taskSubject');
        subjectDropdown.innerHTML = ''; 
        
        subjectsList.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.name; 
            option.textContent = subject.name;
            subjectDropdown.appendChild(option);
        });
        
        const otherOption = document.createElement('option');
        otherOption.value = 'other';
        otherOption.textContent = 'วิชาอื่นๆ (พิมพ์เอง)';
        subjectDropdown.appendChild(otherOption);

    } catch (error) {
        console.error(error);
        const subjectDropdown = document.getElementById('taskSubject');
        subjectDropdown.innerHTML = '<option value="other">ไม่พบรายวิชา (พิมพ์เอง)</option>';
        checkOtherSubject(subjectDropdown);
    }
}

// --- (ฟังก์ชัน Dropdown วิชา ยังเหมือนเดิม) ---
function checkOtherSubject(selectElement) {
    const otherInput = document.getElementById('taskSubjectOther');
    if (selectElement.value === 'other') {
        otherInput.style.display = 'block';
        otherInput.focus();
    } else {
        otherInput.style.display = 'none';
        otherInput.value = '';
    }
}

// ========== ⬇️ ฟังก์ชันใหม่: โหลดงานจาก Database ⬇️ ==========
async function loadTasks() {
    console.log('Loading tasks from database...');
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const tasksFromDB = await response.json();
        
        if (!Array.isArray(tasksFromDB)) {
             tasks = [];
             console.warn("Received non-array response from API:", tasksFromDB);
             renderTasks();
             updateStats();
             return;
        }

        // แปลงค่าที่มาจาก SQL ให้ JS เข้าใจ
        tasks = tasksFromDB.map(task => ({
            ...task,
            id: parseInt(task.id), // ID เป็นตัวเลข
            completed: task.completed === 't' || task.completed === true, // SQL ส่ง 't'/'f'
            due: task.due_date // เปลี่ยนชื่อ field
        }));
        
        renderTasks();
        updateStats();
    } catch (error) {
        console.error('Failed to load tasks:', error);
        alert('❌ ไม่สามารถโหลดข้อมูลงานได้! กรุณาเช็คการเชื่อมต่อ หรือ URL ของ API ใน script.js');
    }
}
// ========== ⬆️ จบฟังก์ชัน ⬆️ ==========


// อัพเดทสถิติ (แก้เล็กน้อย)
function updateStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const todayTasks = tasks.filter(t => {
        const dueDate = new Date(t.due + 'T00:00:00'); 
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime() && !t.completed;
    }).length;

    const overdueTasks = tasks.filter(t => {
        const dueDate = new Date(t.due + 'T00:00:00'); 
        return dueDate < today && !t.completed;
    }).length;
    
    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card"><div class="stat-number">${totalTasks}</div><div class="stat-label">งานทั้งหมด</div></div>
        <div class="stat-card"><div class="stat-number">${pendingTasks}</div><div class="stat-label">งานที่รอทำ</div></div>
        <div class="stat-card"><div class="stat-number">${todayTasks}</div><div class="stat-label">งานวันนี้</div></div>
        <div class="stat-card"><div class="stat-number">${overdueTasks}</div><div class="stat-label">เลยกำหนด</div></div>
        <div class="stat-card"><div class="stat-number">${completedTasks}</div><div class="stat-label">เสร็จแล้ว</div></div>
    `;
}

// ========== ⬇️ แก้ไข: เพิ่มงาน (ส่งไป API) ⬇️ ==========
async function addTask() {
    const name = document.getElementById('taskName').value.trim();
    const assignedOn = document.getElementById('taskAssignedOn').value;
    const due = document.getElementById('taskDue').value;
    const priority = document.getElementById('taskPriority').value;
    const description = document.getElementById('taskDescription').value.trim();

    if (!name || !due) {
        alert('❌ กรุณากรอกข้อมูล "ชื่องาน" และ "วันส่ง/วันสอบ" ให้ครบ');
        return;
    }
    if (assignedOn === 'ไม่ระบุ') {
        alert('❌ กรุณาเลือก "วันที่สั่งงาน" ด้วยครับ (ช่องนี้บังคับกรอก)');
        return;
    }

    let subject = document.getElementById('taskSubject').value;
    if (subject === 'other') {
        subject = document.getElementById('taskSubjectOther').value.trim();
    }
    if (!subject) {
        subject = "(ไม่มีวิชา)";
    }

    const newTask = { name, subject, assignedOn, due, priority, description };
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask)
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('✅ เพิ่มงานเรียบร้อย!');
            clearForm();
            loadTasks(); // โหลดข้อมูลใหม่จาก DB
        } else {
            throw new Error(result.error || 'Unknown error');
        }
    } catch (error) {
        console.error('Failed to add task:', error);
        alert('❌ ไม่สามารถบันทึกงานได้');
    }
}
// ========== ⬆️ จบส่วน ⬆️ ==========

// (ลบฟังก์ชัน saveTasks() ทิ้ง)

// ล้างฟอร์ม (เหมือนเดิม)
function clearForm() {
    document.getElementById('taskName').value = '';
    const subjectDropdown = document.getElementById('taskSubject');
    if (subjectDropdown.options.length > 0) {
        subjectDropdown.value = subjectDropdown.options[0].value; 
    }
    document.getElementById('taskSubjectOther').value = '';
    document.getElementById('taskSubjectOther').style.display = 'none';
    document.getElementById('taskAssignedOn').value = 'ไม่ระบุ';
    document.getElementById('taskDue').value = ''; 
    document.getElementById('taskPriority').value = 'normal';
    document.getElementById('taskDescription').value = '';
}

// แสดงงาน (แก้ชื่อ field เล็กน้อย)
function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    
    if (tasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <div class="icon">📝</div>
                <h3>ยังไม่มีงาน</h3>
                <p>เริ่มต้นด้วยการเพิ่มงานแรกของคุณ</p>
            </div>
        `;
        return;
    }

    // (เรียงงาน - เหมือนเดิม)
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        return new Date(a.due + 'T00:00:00') - new Date(b.due + 'T00:00:00');
    });

    tasksList.innerHTML = sortedTasks.map(task => {
        const dueDate = new Date(task.due + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        const taskDueDate = new Date(task.due + 'T00:00:00');
        taskDueDate.setHours(0, 0, 0, 0);

        const isOverdue = taskDueDate < today && !task.completed;
        const isToday = taskDueDate.getTime() === today.getTime();
        
        let statusClass = '';
        if (task.completed) {
            statusClass = 'completed';
        } else if (isOverdue) {
            statusClass = 'overdue';
        } else if (task.priority === 'urgent') {
            statusClass = 'urgent';
        }

        let statusText = '';
        if (task.completed) {
            statusText = '<span class="status-badge status-completed">✅ เสร็จแล้ว</span>';
        } else if (isOverdue) {
            statusText = '<span class="status-badge status-overdue">⚠️ เลยกำหนด</span>';
        } else if (task.priority === 'urgent') {
             statusText = '<span class="status-badge status-urgent">🔴 เร่งด่วน</span>';
        } else {
            statusText = '<span class="status-badge status-pending">⏳ รอดำเนินการ</span>';
        }
        

        const assignedOnText = task.assigned_on && task.assigned_on !== 'ไม่ระบุ' 
            ? `🕒 สั่งงานเมื่อ: ${task.assigned_on}<br>` 
            : '';
            
        const subjectText = (task.subject && task.subject !== '(ไม่มีวิชา)')
            ? `<div class="task-subject">${task.subject}</div>`
            : ''; 

        return `
            <div class="task-item ${statusClass}">
                <div class="task-header">
                    <div class="task-title">${task.name}</div>
                    ${subjectText}
                </div>
                
                <div class="task-details">
                    ${assignedOnText} 
                    📅 วันส่ง: ${formatThaiDate(dueDate)} ${isToday && !task.completed ? '(วันนี้!)' : ''}
                    <br>
                    ⚡ ความสำคัญ: ${getPriorityText(task.priority)}
                    ${task.description ? `<div class="task-description">📋 ${task.description}</div>` : ''}
                </div>

                <div class="task-actions">
                    ${statusText}
                    <button class="btn btn-small ${task.completed ? 'btn-warning' : 'btn-success'}" 
                            onclick="toggleTaskComplete(${task.id}, ${!task.completed})">
                        ${task.completed ? '↩️ ยกเลิก' : '✅ เสร็จแล้ว'}
                    </button>
                    <button class="btn btn-small btn-info" onclick="editTask(${task.id})">
                        ✏️ แก้ไข
                    </button>
                    <button class="btn btn-small btn-danger" onclick="deleteTask(${task.id})">
                        🗑️ ลบ
                    </button>
                </div>
            </div>
        `;
    }).join('');
}


// (formatThaiDate, getPriorityText ... เหมือนเดิม)
function formatThaiDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return date.toLocaleDateString('th-TH', options); 
}
function getPriorityText(priority) {
    const priorities = { normal: '🟢 ปกติ', important: '🟡 สำคัญ', urgent: '🔴 เร่งด่วน' };
    return priorities[priority] || '🟢 ปกติ';
}


// ========== ⬇️ แก้ไข: เปลี่ยนสถานะงาน (ส่งไป API) ⬇️ ==========
async function toggleTaskComplete(taskId, newStatus) {
    try {
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: taskId, completed: newStatus })
        });
        const result = await response.json();
        
        if (result.status === 'success') {
            loadTasks(); // โหลดข้อมูลใหม่จาก DB
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Failed to update task:', error);
        alert('❌ ไม่สามารถอัพเดทสถานะได้');
    }
}
// ========== ⬆️ จบส่วน ⬆️ ==========

// ========== ⬇️ แก้ไข: ลบงาน (ส่งไป API) ⬇️ ==========
async function deleteTask(taskId) {
    if (confirm('🗑️ คุณแน่ใจหรือไม่ที่จะลบงานนี้?')) {
        try {
            // เราต้องส่ง ID ไปใน URL
            const response = await fetch(`${API_URL}?id=${taskId}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            
            if (result.status === 'success') {
                loadTasks(); // โหลดข้อมูลใหม่จาก DB
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Failed to delete task:', error);
            alert('❌ ไม่สามารถลบงานได้');
        }
    }
}
// ========== ⬆️ จบส่วน ⬆️ ==========


// ========== ⬇️ แก้ไข: แก้ไขงาน ⬇️ ==========
async function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        document.getElementById('taskName').value = task.name;
        
        const subjectDropdown = document.getElementById('taskSubject');
        const otherSubjectInput = document.getElementById('taskSubjectOther');
        const isKnownSubject = subjectsList.some(s => s.name === task.subject);

        if (isKnownSubject && task.subject !== '(ไม่มีวิชา)') {
            subjectDropdown.value = task.subject;
            otherSubjectInput.style.display = 'none';
        } else {
            subjectDropdown.value = 'other';
            otherSubjectInput.value = (task.subject === '(ไม่มีวิชา)') ? '' : task.subject;
            otherSubjectInput.style.display = 'block';
        }

        document.getElementById('taskAssignedOn').value = task.assigned_on || 'ไม่ระบุ'; // (แก้ field name)
        document.getElementById('taskDue').value = task.due; // (task.due คือ YYYY-MM-DD)
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskDescription').value = task.description || '';
        
        // นี่คือวิธีลัด: ลบตัวเก่าออกก่อน แล้วเดี๋ยวฟอร์ม "เพิ่มงาน" จะเพิ่มเข้าไปใหม่
        // เราต้องรอให้ลบเสร็จก่อน
        if (confirm('แก้ไขงานนี้? (ระบบจะลบตัวเก่าและเตรียมเพิ่มใหม่)')) {
            try {
                const response = await fetch(`${API_URL}?id=${taskId}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                if (result.status === 'success') {
                    loadTasks(); // โหลดใหม่
                    document.getElementById('taskName').focus(); // ย้ายโฟกัส
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                alert('เกิดข้อผิดพลาดขณะเตรียมแก้ไข');
            }
        }
    }
}
// ========== ⬆️ จบส่วน ⬆️ ==========


/*
=====================================================
== (ลบ) ฟังก์ชัน check... 4 ตัว ถูกลบออกไป
== เพราะ PHP จะเป็นคนทำหน้าที่นี้แทน
=====================================================
*/


// เริ่มต้นโปรแกรม
document.addEventListener('DOMContentLoaded', function() {
    loadSubjects(); // โหลดวิชาจาก db.json
    loadTasks();    // โหลดงานจาก Database (ใหม่)
});