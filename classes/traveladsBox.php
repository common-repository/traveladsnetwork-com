<?php

if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

// initialize
if ( is_admin() ) {
	// {{{
	add_action('add_meta_boxes', function () {

		$screens = array ('post', 'page');	
		$args = array (
			'public'   => true,
			'_builtin' => false
		);
		$custom_post_types = get_post_types ($args, 'names', 'and');
		$screens = array_values (array_merge ($screens, $custom_post_types));
	
		foreach ($screens as $screen) {
			add_meta_box (
				'travelads_sectionid',
				'<img src="'.plugins_url("assets/images/logo.png", dirname(__FILE__)).'">'.' TravelAdsNetwork',
				'tan_add_meta_box_callback',
				$screen
			);
		}
	});
	// }}}
}

/**
 * adds the box under the tinyMCE editor. This function should be called by the add_meta_box() wordpress method.
 *
 * @param int $post The ID of the post
 */
function tan_add_meta_box_callback($post) {
	// {{{
		?>
			<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDgspF4rU8TvPRHq6LV05GQyBHCEdPYiC4&libraries=places&language=en" defer></script>
		<?php

		global $wpdb;
		
		//
		// Getting the page infos from the database
		//
		$result = $wpdb->get_results("SELECT mode FROM tan_pages_config WHERE page_id = '". $post->ID ."'");
		if (count($result) === 0 || $result[0]->{'mode'} !== "0")
			return;
	
		//
		// Is the user connected to traveladsnetwork??
		//
		$code = tan_test_log();
		if($code !== 202):
			?>
				<div id="login_window">
					<p class="title"><?php echo "<img src=".plugins_url("assets/images/logo.png", dirname(__FILE__)).">"; ?>TravelAdsNetwork</p>
					<p class="subtitle">The Travel Ads Network for Travel Bloggers</p>
					<form id='TANLoginForm'>
						<div class="field">
							<label class="label">Username or E-mail</label>
							<div class="control">
								<input class="input" name="username" type="text" placeholder="Your Username or E-mail">
							</div>
						</div>
						<div class="field">
							<label class="label">Password</label>
							<div class="control">
								<input class="input" name="password" type="password" value="" placeholder="Your password">
							</div>
						</div>
						<div class="field" id=wrongCreds>
							<div class="control">
								Wrong credentials!
							</div>
						</div>
						<div class="field is-grouped">
							<div class="control">
								<p>
									Don’t have an account? <a href="https://traveladsnetwork.com/register/" target="_blank">Sign up</a> today!  
								</p>
							</div>
						</div>
						<div class="field">
							<div class="control">					
								<button type='submit'  class="button is-link" id="checkLog" style="padding-top: 0;padding-bottom: 0;margin-top: 0;display: block;border-radius: 25px;padding-left: 35px;padding-right: 35px;">Submit</button>
							</div>
						</div>
					</form>
				</div>
			<?php
		else:

			$pageInfos = $wpdb->get_results("SELECT * FROM tan_pages_config WHERE page_id = '". $post->ID ."'")[0];

			//
			// creating the navigation bar to go through the keywords
			//
			?>
				<div id=navMenuOffset> </div>
				<table id='navMenu'>
					<tr>
						<td colspan=6><input type='text' id='googleField' placeholder='Search for hotels, POI!'/></td>
						<td style="width: auto">
							<div class='questionDiv'>
								<span class="questionIcon">?</span>
								<div class=explain>
									This field allow you to add your own keywords, you can search for any POI or hotel! 
									Select words or hotel names to add them as keywords. 
									<div id=newKWs></div>
								</div>
							</div>
						</td>
						<td style="width: auto">
							<div class=shortcutDiv>
								<span class=shortcutIcon>
								<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
viewBox="0 0 224 224"
style=" fill:#ffffff;"><g fill="none" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="M0,224v-224h224v224z" fill="none"></path><g fill="#ffffff"><g id="surface1"><path d="M21,49c-7.65625,0 -14,6.34375 -14,14v98c0,7.65625 6.34375,14 14,14h182c7.65625,0 14,-6.34375 14,-14v-98c0,-7.65625 -6.34375,-14 -14,-14zM21,63h182v98h-182zM35,77v14h14v-14zM63,77v14h14v-14zM91,77v14h14v-14zM119,77v14h14v-14zM147,77v14h14v-14zM175,77v14h14v-14zM35,105v14h28v-14zM77,105v14h14v-14zM105,105v14h14v-14zM133,105v14h14v-14zM161,105v14h28v-14zM35,133v14h28v-14zM77,133v14h70v-14zM161,133v14h28v-14z"></path></g></g></g></svg>
								</span>
								<div class=explain>
									shortcuts: 
									<table>
										<tr>
											<td>Left/Right arrow</td><td>Change current keyWord</td>
										</tr>
										<tr>
											<td>Up/Down arrow</td><td>Change merchant</td>
										</tr>
										<tr>
											<td>enter/space</td><td>Toggle current keyword</td>
										</tr>
										<tr>
											<td>ctrl + enter/space</td><td>Toggle all keyWords</td>
										</tr>
										<tr>
											<td>shift + enter/space</td><td>Toggle all custom keyWords</td>
										</tr>
									</table>
								</div>
							</div>
						</td>
					</tr>
					<tr>
						<td class=navMenu_autoWidth>
							<input id=navMenu_keyWord type=text readonly=readonly>
						</td>
						<td id=navMenu_arrowsCell>
							<div>
								<span id=navMenuprevWord>&lt;</span>
								<span id=navMenunextWord>&gt;</span>
							</div>
						</td>
						<td>
							<span id=navMenu_currentKeyWord></span> of <span id=navMenu_totalKeyWord></span>
						</td>
						<td class=navMenu_autoWidth>
							Select merchant:
						</td>
						<td>
							<select id=navMenu_merchantSelect>
								<?php
									$allmerchants=json_decode(file_get_contents(plugins_url("data/advertisers.json", dirname(__FILE__))));

									if(!count(json_decode($pageInfos->{'merchants'})))
										foreach($allmerchants as $oneMerch)
											echo "<option value=".$oneMerch->{'id'}."> ".$oneMerch->{'name'};
									else
										foreach(json_decode($pageInfos->{'merchants'}) as $m)
											foreach($allmerchants as $oneMerch)
												if($oneMerch->{'id'} == intval($m))
												{
													echo "<option value=".$m."> ".$oneMerch->{'name'};
													break;
												}
								?>
							</select>
						</td>
						<td class=navMenu_autoWidth>
							Insert Link:
						</td>
						<td style='width:auto' colspan=2>
							<div id='navMenu_buttonOnOff'></div>
						</td>
					</tr>
				</table>

				<div id='hidden_travel_editor' style='display: none'></div>
				<div id='travel_editor'>
					<h3 style="text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif">
						Slide the mouse over here to load your page
					</h3>
				</div>
			<?php

		endif;
	// }}}
}

/**
 * Will trigger after a page is published
 * Allow to initialize the page parameters for new pages
 *
 * @param int $post_id The ID of the current post
 */
add_action('save_post', function ($post_id) {
	global $wpdb;
	$post = get_post($post_id);

	if($post->post_type === "page" or $post->post_type === "post" )
		$wpdb->query("INSERT INTO `tan_pages_config`(`page_id`, `mode`, `link_amount`, `update_links`) 
		              	VALUES ('".$post_id."','1','3','1')");
});
