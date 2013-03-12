<?php
header('Content-Type: application/json');
//header('Cache-Control: no-cache');

include('db.php');

$stmt = $db->prepare('SELECT MAX(t) FROM queue');
$stmt->execute();
$t = $stmt->fetch()['MAX(t)'];

$stmt = $db->prepare('SELECT * FROM state WHERE delegate = :delegate');

function getByDelegate($delegate='') {
	global $stmt;
	$stmt->bindValue(':delegate', $delegate);
	$stmt->execute();
	$l = $stmt->fetchAll();

	foreach ($l as $k => $d) {
		$followers = getByDelegate($d['id']);
		$l[$k]['followers'] = $followers;
	}

	return $l;
}

$result = array(
	't' => $t,
	'tree' => getByDelegate(),
);
echo json_encode($result);
?>
