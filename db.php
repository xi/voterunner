<?php
//ini_set('display_errors','On');

try {
	$db = new PDO('sqlite:public/db.sqlite');
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
