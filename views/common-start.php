<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Yoda Portal</title>
	<link rel="stylesheet" href="<?php echo base_url('/static/lib/bootstrap/css/bootstrap.min.css')?>">
	<link rel="stylesheet" href="<?php echo base_url('/static/lib/select2/select2.css')?>">
	<link rel="stylesheet" href="<?php echo base_url('/static/lib/select2/select2-bootstrap.min.css')?>">
<?php
	$moduleBase = base_url($this->router->module);

	if (isset($styleIncludes)) {
		foreach ($styleIncludes as $include) {
?>
	<link rel="stylesheet" href="<?php echo $moduleBase . '/static/' . $include ?>" />
<?php
		}
	}
?>
	<script src="<?php echo base_url('/static/lib/jquery/js/jquery.min.js')?>"></script>
	<script src="<?php echo base_url('/static/lib/bootstrap/js/bootstrap.min.js')?>"></script>
	<script src="<?php echo base_url('/static/lib/select2/select2.min.js')?>"></script>
	<script src="<?php echo base_url('/static/js/yoda-portal.js')?>"></script>
<?php
	if (isset($scriptIncludes)) {
		foreach ($scriptIncludes as $include) {
?>
	<script src="<?php echo $moduleBase . '/static/' . $include ?>"></script>
<?php
		}
	}
	if (isset($user) && isset($user['username'])) {
?>
	<script>
		$(function() {
			YodaPortal.extend('baseUrl', <?php echo json_encode(base_url()) ?>);
<?php
	if (isset($user) && isset($user['username'])) {
?>
			YodaPortal.extend('user', {
				username: <?php echo json_encode($user['username']); ?>,
			});
<?php
	}
?>
			YodaPortal.extend('csrf', {
				tokenName:  <?php echo json_encode($this->security->get_csrf_token_name()); ?>,
				tokenValue: <?php echo json_encode($this->security->get_csrf_hash()); ?>
			});
		});
	</script>
<?php
	}
?>
</head>
<body>

<nav class="navbar navbar-default navbar-static-top">
	<div class="container">
		<div class="navbar-header">
			<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
				<span class="sr-only">Toggle navigation</span>
				<span class="icon-bar"></span>
				<span class="icon-bar"></span>
				<span class="icon-bar"></span>
			</button>
			<a class="navbar-brand" href="<?php echo base_url()?>">Yoda Portal</a>
		</div>
		<div id="navbar" class="collapse navbar-collapse">
			<ul class="nav navbar-nav">
<?php

	global $YODA_MODULES; // FIXME.

	foreach ($YODA_MODULES as $moduleName => $module) {
		$active = (isset($activeModule) && $activeModule === $moduleName);
?>
				<li class="<?php echo $active ? 'active' : ''?>">
					<a href="<?php echo base_url($moduleName)?>">
						<?php echo htmlentities($module['label'])?>
					</a>
				</li>
<?php
	}
?>
			</ul>
			<?php if (isset($user) && isset($user['username'])) { ?>
			<div class="navbar-form navbar-right">
				<a class="logout" href="<?php echo base_url('user/logout')?>">Log out <?php echo $user['username']?></a>
			</div>
			<?php } else { ?>
			<div class="navbar-form navbar-right">
				<a class="btn btn-primary" href="<?php echo base_url('user/login')?>">Sign in</a>
			</div>
			<?php } ?>
		</div>
	</div>
</nav>
<div class="container page">
<div id="messages"></div>
