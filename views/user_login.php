<div class="row">
	<div class="col-md-offset-2 col-md-8">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h3 class="panel-title">Login to Yoda</h3>
			</div>
			<div class="panel-body">
				<form method="POST" class="form-horizontal" id="f-login">
					<div class="form-group">
						<label class="col-sm-3 control-label" for="f-login-username">Username</label>
						<div class="col-sm-9">
							<input name="username" id="f-login-username" class="form-control" type="text" required />
						</div>
					</div>
					<div class="form-group">
						<label class="col-sm-3 control-label" for="f-login-password">Password</label>
						<div class="col-sm-9">
							<input name="password" id="f-login-password" class="form-control" type="password" required />
						</div>
					</div>
					<div class="form-group">
						<div class="col-sm-offset-3 col-sm-9">
							<input id="f-login-submit" class="btn btn-primary" type="submit" value="Sign in" />
						</div>
					</div>
				</form>
<?php
	if ($loginFailed) {
?>
				<p>
					Login failed. Please check your username and password.
				</p>
<?php
	}
?>
			</div>
		</div>
	</div>
</div>
