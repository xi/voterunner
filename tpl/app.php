<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
	<meta charset="utf-8">
	<title>voterunner - <?=$_GET['topic']?></title>
	<link rel="shortcut icon" href="static/favicon.ico"/>
	<link rel="stylesheet" type="text/css" href="static/style.css" />
	<script type="text/javascript" src="static/voterunner.js"></script>
</head>

<body>
	<header>
		<h1><span class="logo1">vote</span>runner</h1>
	</header>

	<div>
		<div id="sidebar">
			<div id="user">
				<div class="statusbar">
					<div class="votes" title="number of votes of you and all your followers">1</div>
					<div class="delegation">(no delegation)</div>
					<a class="undelegate" title="revoke delegation" onclick="undelegate()">‒</a>
				</div>
				<div id="name">
					<input type="text" placeholder="<enter your name>" onchange="setName()"/>
				</div>
				<div id="comment">
					<textarea onchange="setComment()"></textarea>
				</div>
			</div>

			<div id="chat">
				<ul></ul>
				<form onsubmit="event.preventDefault(); chat(this.text)">
					<label>Chat: <input type="text" name="text" required="required"/></label>
				</form>
			</div>
		</div>

		<div id="tree">
			<ul></ul>
		</div>
	</div>
</body>
</html>