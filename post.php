<?php
/**
 * The clients post local changes here
 *
 * @package: voretunner
 * @license: AGPL
 * @copyright: 2013 Tobias Bengfort <tobias.bengfort@gmx.net>
 */

if (isset($_POST['action']) && isset($_POST['id']) && isset($_POST['v'])) {
	include('db.php');

	$stmt = $db->prepare("INSERT INTO queue (t, action, id, v) VALUES (:t, :action, :id, :v)");
	$stmt->bindValue(':t', time());
	$stmt->bindValue(':action', $_POST['action']);
	$stmt->bindValue(':id', $_POST['id']);
	$stmt->bindValue(':v', $_POST['v']);
	$stmt->execute();

	if ($_POST['action'] === 'createNode') {
		$stmt = $db->prepare("INSERT INTO state (id, name, comment, delegate) VALUES (:id, 'anonymous', '', '')");
	}
	elseif ($_POST['action'] === 'rmNode') {
		$stmt = $db->prepare("DELETE FROM state WHERE id = :id");
	}
	elseif ($_POST['action'] === 'setNodeName') {
		$stmt = $db->prepare("UPDATE state SET name = :v WHERE id = :id");
		$stmt->bindValue(':v', $_POST['v']);
	}
	elseif ($_POST['action'] === 'setNodeComment') {
		$stmt = $db->prepare("UPDATE state SET comment = :v WHERE id = :id");
		$stmt->bindValue(':v', $_POST['v']);
	}
	elseif ($_POST['action'] === 'setDelegate') {
		$stmt = $db->prepare("UPDATE state SET delegate = :v WHERE id = :id");
		$stmt->bindValue(':v', $_POST['v']);
	}
	elseif ($_POST['action'] === 'rmDelegate') {
		$stmt = $db->prepare("UPDATE state SET delegate = null WHERE id = :id");
	}
	else {
		exit(1);
	}
	$stmt->bindValue(':id', $_POST['id']);
	$stmt->execute();
}
?>
