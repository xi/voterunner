<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache'); // recommended to prevent caching of event data.

include('db.php');

// clean queue
$stmt = $db->prepare('DELETE FROM queue WHERE t < :t');
$stmt->bindValue(':t', time() - 60*5); // 5 minutes
$stmt->execute();

// send latest messages
$stmt = $db->prepare('SELECT * FROM queue ORDER BY t ASC');
$stmt->execute();
$queue = $stmt->fetchAll();

foreach ($queue as $msg) {
  echo "id: {$msg['t']}\n";
	echo "event: {$msg['action']}\n";
  echo "data: " . json_encode(array('id' => $msg['id'], 'v' => $msg['v'])) . "\n\n";
  ob_flush();
  flush();
}
?>
