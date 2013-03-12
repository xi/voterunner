<?php
//ini_set('display_errors','On');

if (!isset($_GET['topic']) || empty($_GET['topic'])) {
	header("HTTP/1.0 404 Not Found");
	include('../tpl/404.htm');
	die();
}

try {
	$db = new PDO("sqlite:../public/{$_GET['topic']}.sqlite");
	$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	$db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
}
catch(PDOException $e) {die('Error while connecting to Database: '.$e->getMessage());}

$db->query("CREATE TABLE IF NOT EXISTS state (
	id TEXT UNIQUE,
	name TEXT,
	comment TEXT,
	delegate TEXT
);");
$db->query("CREATE TABLE IF NOT EXISTS queue (
	t INTEGER,
	action TEXT,
	id TEXT,
	v TEXT
);");
?>
