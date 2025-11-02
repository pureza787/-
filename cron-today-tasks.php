<?php
date_default_timezone_set('Asia/Bangkok'); // ตั้ง Timezone เป็นไทย

// 🔑 Channel Access Token (เหมือนเดิม)
$accessToken = "XwRHup7JpWC8nAXmx/tqF9OOH1hdodRF94vLx4dQoHKJGd2k+9ioOuKNn0dr6x2ToOyjApEAS4MRWZLzOsEqgZ0Dh+K5/mhPjtKirbqvI8nGXKf9RPOK7gZbD+EhnlW0nmAworYOQgw3keiiB2uYlwdB04t89/1O/w1cDnyilFU=";

// 🔑 User ID ของคุณ (เหมือนเดิม)
$userId = "U1977508eeb7c606289428d3930efe89a";

// ========== ⬇️ ‼️ วางลิงก์ SUPABASE (ลิงก์เดียวกับ api.php) ‼️ ⬇️ ==========
$db_url = "postgresql://postgres:pureza78700@db.vmcnmlvdfdcgtdweapkp.supabase.co:5432/postgres"; 
// ====================================================================================


// --- (ฟังก์ชัน sendLineMessage ... เหมือนเดิมเป๊ะ) ---
function sendLineMessage($accessToken, $userId, $message) {
    $url = "https://api.line.me/v2/bot/message/push";
    $headers = ["Content-Type: application/json", "Authorization: Bearer " . $accessToken];
    $data = ["to" => $userId, "messages" => [["type" => "text", "text" => $message]]];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $result = curl_exec($ch);
    curl_close($ch);
    return $result;
}

// --- (ฟังก์ชันดึงงาน... แก้ไขใหม่ทั้งหมด) ---
function getPendingTasks($db_conn) {
    // เลือกงานที่ "ยังไม่เสร็จ" และ "ถึงกำหนดส่งวันนี้ หรือ เลยกำหนดไปแล้ว"
    $query = "SELECT * FROM tasks WHERE completed = false AND due_date <= NOW()";
    $result = pg_query($db_conn, $query);
    
    if ($result) {
        return pg_fetch_all($result) ?: [];
    }
    return [];
}

// =========================
// เริ่มการทำงาน
// =========================

// เวลาที่ต้องการให้ส่งแจ้งเตือน (ตามที่คุณขอ)
$alertTimes = ["17:00", "19:30"];
$currentTime = date("H:i");

echo "Current Time: $currentTime\n";

// ถ้าเวลาไม่ตรง ก็ไม่ต้องทำอะไรเลย
if (!in_array($currentTime, $alertTimes)) {
    echo "Not an alert time. Exiting.";
    exit;
}

// ถ้าเวลาตรง... เชื่อมต่อ DB
$db_conn = pg_connect($db_url);
if (!$db_conn) {
    sendLineMessage($accessToken, $userId, "⚠️ บอทแจ้งเตือน Error: ไม่สามารถเชื่อมต่อ Supabase DB ได้");
    exit;
}

// ดึงงานที่ค้าง
$pendingTasks = getPendingTasks($db_conn);
pg_close($db_conn);

$taskCount = count($pendingTasks);

if ($taskCount > 0) {
    // ถ้ามีงานค้าง
    $message = "🔔 แจ้งเตือน! (เวลา $currentTime น.)\n";
    $message .= "คุณมีงานที่ยังไม่ได้ทำ (งานวันนี้ + งานที่เลยกำหนด) ทั้งหมด $taskCount รายการ:\n";
    
    foreach ($pendingTasks as $index => $task) {
        if ($index >= 5) { // ส่งแค่ 5 งานแรก
            $message .= "\nและอื่นๆ...";
            break;
        }
        $message .= "\n- " . $task['name'] . " (ส่ง " . $task['due_date'] . ")";
    }
    
    sendLineMessage($accessToken, $userId, $message);
    echo "Sent notification for $taskCount tasks.";

} else {
    // ถ้าไม่มีงานค้าง
    echo "No pending tasks to send.";
}
?>