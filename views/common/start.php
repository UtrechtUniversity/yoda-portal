<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Yoda Portal</title>
    <link rel="shortcut icon" href="/static/img/favicon.ico">
    <link rel="stylesheet" href="<?php echo base_url('/static/lib/bootstrap/css/bootstrap.min.css?version=' . ASSETS_VERSION)?>">
    <link rel="stylesheet" href="<?php echo base_url('/static/lib/select2/select2.css?version=' . ASSETS_VERSION)?>">
    <link rel="stylesheet" href="<?php echo base_url('/static/lib/select2/select2-bootstrap.min.css?version=' . ASSETS_VERSION)?>">
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
    <script src="<?php echo base_url('/static/lib/jquery/js/jquery.min.js?version=' . ASSETS_VERSION)?>"></script>
    <script src="<?php echo base_url('/static/lib/bootstrap/js/bootstrap.min.js?version=' . ASSETS_VERSION)?>"></script>
    <script src="<?php echo base_url('/static/lib/select2/select2.min.js?version=' . ASSETS_VERSION)?>"></script>
    <script src="<?php echo base_url('/static/lib/toastr/toastr.min.js?version=' . ASSETS_VERSION)?>"></script>
    <script src="<?php echo base_url('/static/js/yoda-portal.js?version=' . ASSETS_VERSION)?>"></script>
    <script src="<?php echo base_url('/static/js/messages.js?version=' . ASSETS_VERSION)?>"></script>
    <?php
    if (isset($scriptIncludes)) {
        foreach ($scriptIncludes as $include) {
            ?>
            <script src="<?php echo $moduleBase . '/static/' . $include . '?version=' . ASSETS_VERSION ?>"></script>
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

<div class="brandbar container">
    <div class="logo pull-left">
        <a href="http://www.uu.nl">
            <img src="<?php echo base_url('/static/img/logo-uu.svg')?>">
        </a>
    </div>
    <div class="auth-action pull-right">
        <?php if (isset($user) && isset($user['username'])) { ?>
            <a class="logout text-right" href="<?php echo base_url('user/logout')?>">Log out <?php echo htmlentities($user['username']) ?></a>
        <?php } else { ?>
            <a class="btn btn-primary text-right " href="<?php echo base_url('user/login')?>">Sign in</a>
        <?php } ?>
    </div>
</div>

<nav class="navbar navbar-inverse navbar-static-top">
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
                if($module_items && sizeof($module_items) > 0):
                    foreach($module_items as $moduleName => $module):
                        $active = (isset($activeModule) && $activeModule === $moduleName);
                        ?>
                        <li class="<?php echo $active ? 'active' : ''?>">
                            <a href="<?php echo base_url($moduleName)?>">
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
