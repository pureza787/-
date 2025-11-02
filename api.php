<?php
// ตั้งค่า header
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// ========== ⬇️ ‼️ วางลิงก์ SUPABASE (ที่ใส่รหัสผ่านใหม่) ของคุณตรงนี้ ‼️ ⬇️ ==========
$db_url = "postgresql://postgres:pureza78700@db.vmcnmlvdfdcgtdweapkp.supabase.co:5432/postgres"; 
// ====================================================================================

// เชื่อมต่อฐานข้อมูล
$db_conn = pg_connect($db_url);

if (!$db_conn) {
    echo json_encode(['error' => 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// จัดการ OPTIONS request (สำหรับ CORS)
if ($method == "OPTIONS") {
    http_response_code(200);
    exit;
}

// --- จัดการ GET (โหลดงานทั้งหมด) ---
if ($method == "GET") {
    $result = pg_query($db_conn, "SELECT * FROM tasks ORDER BY due_date ASC");
    $tasks = pg_fetch_all($result);
    echo json_encode($tasks ?: []);
}

// --- จัดการ POST (เพิ่มงานใหม่) ---
if ($method == "POST") {
    $data = json_decode(file_get_contents('php://input'));
    
    pg_prepare($db_conn, "add_task", 'INSERT INTO tasks (name, subject, assigned_on, due_date, priority, description) VALUES ($1, $2, $3, $4, $5, $6)');
    $result = pg_execute($db_conn, "add_task", [
        $data->name,
        $data->subject,
        $data->assignedOn,
        $data->due, // YYYY-MM-DD
        $data->priority,
        $data->description
    ]);
    
    if ($result) {
        echo json_encode(['status' => 'success', 'message' => 'เพิ่มงานเรียบร้อย']);
    } else {
        echo json_encode(['error' => 'ไม่สามารถเพิ่มงานได้']);
    }
}

// --- จัดการ PUT (อัพเดทสถานะ 'เสร็จแล้ว') ---
if ($method == "PUT") {
    $data = json_decode(file_get_contents('php://input'));
    
    pg_prepare($db_conn, "update_task", 'UPDATE tasks SET completed = $1 WHERE id = $2');
    $result = pg_execute($db_conn, "update_task", [$data->completed, $data->id]);
    
    if ($result) {
        echo json_encode(['status' => 'success', 'message' => 'อัพเดทสถานะเรียบร้อย']);
    } else {
        echo json_encode(['error' => 'ไม่สามารถอัพเดทได้']);
    }
}

// --- จัดการ DELETE (ลบงาน) ---
if ($method == "DELETE") {
    $id = $_GET['id'];
    
    pg_prepare($db_conn, "delete_task", 'DELETE FROM tasks WHERE id = $1');
    $result = pg_execute($db_conn, "delete_task", [$id]);
    
    if ($result) {
        echo json_encode(['status' => 'success', 'message' => 'ลบงานเรียบร้อย']);
    } else {
        echo json_encode(['error' => 'ไม่สามารถลบงานได้']);
    }
}

pg_close($db_conn);
?>