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
                    <div class="col-sm-9">
                        <input name="username" id="f-login-username" class="form-control" type="text" placeholder="j.a.smith@uu.nl" autofocus="" required />
                        <span id="capitals" class="hidden error text-danger">Username should not contain capital letters.</span>
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-sm-3 col-form-label" for="f-login-password">Password</label>
                    <div class="col-sm-9">
                        <input name="password" id="f-login-password" class="form-control" type="password" required />
                        <a href="https://<?php echo $this->config->item('yoda_eus_fqdn') ?>/user/forgot-password" title="Forgot / change password?">Forgot / change password?</a>
                    </div>
                </div>
                <div class="form-group row">
                    <div class="offset-sm-3 col-sm-9">
                        <input id="f-login-submit" class="btn btn-primary col-sm-3" type="submit" value="Sign in" />
                    </div>
                </div>
                <?php echo form_close(); ?>
                <?php if ($loginFailed) { ?>
                    <p>
                        Login failed. Please check your username and password.
                    </p>
                <?php } ?>
            </div>
        </div>
    </div>
</div>