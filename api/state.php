<?php
header('Content-Type: application/json');
//header('Cache-Control: no-cache');

include('db.php');

$stmt = $db->prepare('SELECT MAX(t) FROM queue');
$stmt->execute();
$t = $stmt->fetch()['MAX(t)'];

$delstmt = $db->prepare('SELECT * FROM state WHERE delegate = :delegate');

function getByDelegate($delegate='') {
	global $delstmt;
	$delstmt->bindValue(':delegate', $delegate);
	$delstmt->execute();
	$l = $delstmt->fetchAll();

	foreach ($l as $k => $d) {
		$followers = getByDelegate($d['id']);
		$l[$k]['followers'] = $followers;
	}

	return $l;
}

$stmt = $db->prepare('SELECT * FROM queue WHERE action = "chat" ORDER BY t ASC');
$stmt->execute();
$chat = $stmt->fetchAll();

$result = array(
	't' => $t,
	'tree' => getByDelegate(),
	'chat' => $chat
);
echo json_encode($result);
?>
