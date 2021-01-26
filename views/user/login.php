<div class="row">
    <div class="offset-md-2 col-md-8">
        <div class="card">
            <div class="card-header">
                <div class="panel-title">
                    Login to Yoda
                </div>
            </div>
            <div class="card-body">
                <?php echo form_open('user/login'); ?>
                <div class="form-group row">
                    <label class="col-sm-3 col-form-label" for="f-login-username">Username</label>
                    <input name="username" id="f-login-username" class="form-control col-sm-6" type="text" placeholder="j.a.smith@uu.nl" autofocus="" required />
                    <span id="capitals" class="hidden error text-danger">Username should not contain capital letters.</span>
                </div>
                <div class="form-group row">
                    <label class="col-sm-3 col-form-label" for="f-login-password">Password</label>
                    <input name="password" id="f-login-password" class="form-control col-sm-6" type="password" required />
                    <a class="col-sm-6 offset-sm-3 pl-0" href="https://<?php echo $this->config->item('yoda_eus_fqdn') ?>/user/forgot-password" title="Forgot / change password?">Forgot / change password?</a>
                </div>
                <div class="form-group row">
                    <input id="f-login-submit" class="btn btn-primary col-sm-6 offset-sm-3" type="submit" value="Sign in" />
		<?php if ( $this->config->item('oidc_active') ): ?>
		</div>
		<div class="row col-sm-6 offset-sm-3">
			<hr class="col-sm-5 px-0"/>
			<span class="col-sm-2">Or</span>
			<hr class="col-sm-5 px-0"/>
		</div> 
		<div class="form-group row">
		    <a class="btn btn-secondary col-sm-6 mt-2 offset-sm-3" href="<?php echo $this->config->item('oidc_auth_uri'); ?>"><?php echo $this->config->item('oidc_signin_text'); ?></a>
		<?php endif; ?>
                </div>
                <?php echo form_close(); ?>
                <?php if ($loginFailed) { ?>
                    <p>
                        <?php echo $error; ?>
                    </p>
                <?php } ?>
            </div>
        </div>
    </div>
</div>
