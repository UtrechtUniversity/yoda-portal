<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Yoda Portal</title>
    <link rel="shortcut icon" href="/static/img/favicon.ico">
    <link rel="stylesheet" href="<?php echo base_url('/static/lib/toastr/toastr.min.css?version=' . ASSETS_VERSION)?>">
    <link rel="stylesheet" href="<?php echo base_url('/static/css/yoda-portal.css?version=' . ASSETS_VERSION)?>">
    <?php
    $moduleBase = base_url($this->router->module);
    if(!isset($module_items)){
        $ci = get_instance();
        $module_items = $ci->menu->getModules();
    }
    if (isset($styleIncludes)) {
        foreach ($styleIncludes as $include) {
            ?>
            <link rel="stylesheet" href="<?php echo $moduleBase . '/static/' . $include . '?version=' . ASSETS_VERSION ?>" />
            <?php
        }
    }
    ?>
    <script src="<?php echo base_url('/static/lib/jquery-1.11.2/js/jquery.min.js?version=' . ASSETS_VERSION)?>"></script>
    <script src="<?php echo base_url('/static/lib/bootstrap-4.4.1/js/bootstrap.bundle.min.js?version=' . ASSETS_VERSION)?>"></script>
    <script src="<?php echo base_url('/static/lib/toastr/toastr.min.js?version=' . ASSETS_VERSION)?>"></script>
    <script src="<?php echo base_url('/static/js/yoda-portal.js?version=' . ASSETS_VERSION)?>"></script>
    <script src="<?php echo base_url('/static/js/messages.js?version=' . ASSETS_VERSION)?>"></script>
    <?php
    if (isset($user) && isset($user['username'])) {
        ?>
        <script>
            $(function() {
                Yoda.version  = <?php echo json_encode(YODA_VERSION) ?>;
                Yoda.basePath = <?php echo json_encode('/'.$this->config->item('rodsServerZone').'/home') ?>;
                Yoda.baseUrl  = <?php echo json_encode(base_url()) ?>;
                <?php if (isset($user) && isset($user['username'])) { ?>
                Yoda.user = {
                    username: <?php echo json_encode($user['username']); ?>,
                };
                <?php } ?>
                Yoda.csrf = {
                    tokenName:  <?php echo json_encode($this->security->get_csrf_token_name()); ?>,
                    tokenValue: <?php echo json_encode($this->security->get_csrf_hash()); ?>
                };
            });
        </script>
        <?php
    }
    if (isset($scriptIncludes)) {
        foreach ($scriptIncludes as $include) {
            ?>
            <script src="<?php echo $moduleBase . '/static/' . $include . '?version=' . ASSETS_VERSION ?>"></script>
            <?php
        }
    }
    ?>
</head>
<body class="d-flex flex-column min-vh-100">

<div class="container">
    <nav class="navbar yoda-topnavbar">
        <a class="navbar-brand" href="<?php echo base_url(); ?>">
            <img class="logo" src="<?php echo base_url('/static/img/logo.svg')?>">
        </a>

        <div class="auth-action pull-right">
            <?php if (isset($user) && isset($user['username'])) { ?>
                <a class="logout text-right" href="<?php echo base_url('user/logout')?>">Log out <?php echo htmlentities($user['username']) ?></a>
            <?php } else { ?>
                <a class="btn btn-primary" href="<?php echo base_url('user/login')?>">Sign in</a>
                <a class="btn btn-primary" href="<?php echo base_url('user/login_oidc')?>">Use Solis</a>
            <?php } ?>
        </div>
    </nav>
</div>

<nav class="navbar navbar-expand-lg yoda-navbar">
    <div class="container">
        <a class="navbar-brand" href="<?php echo base_url(); ?>">
            Yoda Portal
        </a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav">
                <?php
                if($module_items && sizeof($module_items) > 0):
                    foreach($module_items as $moduleName => $module):
                        $active = (isset($activeModule) && $activeModule === $moduleName);
                        ?>
                        <li class="nav-item<?php echo $active ? ' active' : ''?>">
                            <a class="nav-link" href="<?php echo base_url($moduleName)?>">
                                <?php echo htmlentities($module['label'])?>
                            </a>
                        </li>
                    <?php
                    endforeach;
                endif;
                ?>
            </ul>
        </div>
    </div>
</nav>

<div class="container page">
    <div id="messages">
        <?php if ($messageText) { ?>
            <div class="alert alert-<?php echo $messageType; ?>">
                <a href="#" class="close" data-dismiss="alert" aria-label="close" title="close">×</a>
                <?php echo $messageText; ?>
            </div>
        <?php } ?>
    </div>
