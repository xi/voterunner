<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache'); // recommended to prevent caching of event data.

include('db.php');

// send latest messages
$stmt = $db->prepare('SELECT * FROM queue WHERE t > :t ORDER BY t ASC');
$stmt->bindValue(':t', time() - 60*5); // 5 minutes
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
