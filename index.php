<?php
if (isset($_GET['topic']) && $_GET['topic']) {
	//if (file_exists("public/$t.sqlite"))
	include('tpl/app.php');
}
else
	include('tpl/welcome.php');
?>
