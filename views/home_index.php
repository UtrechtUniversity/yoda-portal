<style>
.portal-chooser .row > div {
	text-align: center;
	font-size: 22px;
}

.portal-chooser a {
	text-shadow: 0 0 4px rgba(0,0,0,0.2);
}
.portal-chooser a span {
	text-shadow: 0 0 6px rgba(0,0,0,0.3);
}

.portal-chooser a:hover {
	text-decoration: none;
}

.portal-chooser .well {
	color: #000;
	transition: background-color 160ms;
}

.portal-chooser .well:hover {
	background-color: #eaeaea;
}

.portal-chooser .well > .glyphicon {
	vertical-align: middle;
	font-size: 80px;
	display: block;
}
</style>

<div class="container-fluid portal-chooser">
	<?php 
	if($modules && sizeof($modules) > 0):
		foreach($modules as $mod):?>
			<div class="row">
			<?php
				if($mod && sizeof($mod) > 0):
					$md_size = round(12 / sizeof($mod));
					foreach ($mod as $moduleName => $module):
				?>
					<div class="col-xs-12 col-md-<?=$md_size;?>">
						<a href="<?php echo base_url($moduleName)?>">
							<div class="well">
								<span class="<?php echo $module['icon_class']?>" aria-hidden="true"></span>
								<?php echo $module['label']?>
							</div>
						</a>
					</div>
			<?php 
				endforeach;
			endif;?>
			</div>
		<?php 
		endforeach; 
	endif;?>
</div>

<div class="jumbotron">
	<h1>Welcome to Yoda!</h1>
	<p>
		Yoda is a share-collaborate environment for research data.
	</p>
	<!-- <a class="btn btn-default" href="#">Learn more</a> -->
</div>
