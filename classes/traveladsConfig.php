<?php
if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

add_action('admin_post_nopriv_update_tan_pages', 'tan_update_pages_config');
add_action('admin_post_update_tan_pages', 'tan_update_pages_config');

function tan_update_pages_config() {
	global $wpdb;

	$pages = json_decode(stripslashes( $_POST['data'] ));

    var_dump( $pages );

	foreach( $pages as $page )
	{
		var_dump($page);

		$query = "INSERT INTO `tan_pages_config` (`page_id`, 
										`mode`,
										`link_amount`,
										`update_links`,
										`merchants`) 
				VALUES (".$page->pageId.",
						".$page->mode.",
						".$page->maxLinks.",
						".$page->updateExist.",
						".json_encode($page->merchants).")
				ON DUPLICATE KEY UPDATE
					`mode`         = ".$page->mode.",
					`link_amount`  = ".$page->maxLinks.",
					`update_links` = ".$page->updateExist.",
					`merchants`    = ".json_encode( $page->merchants )."";
		echo $query;

		$wpdb->query($query);
	}

}

class traveladsConfig {
	private $config = null;
	static private $instance = null;

	//Singleton: private construct
	private function __construct() {

		//Add the admin page and settings
		if( is_admin() ) 
			add_action( 'admin_menu', array( $this, 'addmenu' ) );

	}
	
	static public function instance() {
		//Only one instance
		if ( self::$instance == null ) 
			self::$instance = new traveladsConfig();
	
		return self::$instance;
	}
	
	/**
	 * Displays the configuration menu
	 */

	public function show() {
		// {{{

		?>

		<div class="wrap">
			<div id="travelads_main">

				<?php 


				//
				// Authentication
				//
		
				// {{{

				global $wpdb;

				//
				// Test HO ID
				//
				if(isset($_COOKIE['TAN_hoID']))
					update_option('TAN_HO_ID', $_COOKIE['TAN_hoID']);

				//
				// Test login cookie
				//
				$code = tan_test_log();
				
				// }}}

				if($code != 202):	// wrong cookie, we display the login form

					// {{{

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

					// }}}
				
				else: // cookie ok, we display the configuration plugin
					
					global $pages_configs;

					$pages_configs = $wpdb->get_results('SELECT * FROM `tan_pages_config`');

					//
					// Page HTML code
					//
					
					// {{{

					?>

					<hr>
					<!-- Html -->
					<form id='tan_pages' name='tan_pages' action="<?=admin_url('admin-post.php')?>" method='post'>
						<?php wp_nonce_field('tan_pages_config', 'tan_pages_config'); ?>
						<input type="hidden" name="action" value="update_tan_pages">
						<div id='content'>
							<table id=topTable>
								<tr>
									<td>
										<h1>
										<?php _e('<img src="'.plugins_url("assets/images/logo.png", dirname(__FILE__)).'"> TravelAdsNetwork Settings','travelads'); ?>
										</h1>
									<td>
									<td><button class='saveChangesButton button button-primary'>Apply changes</button></td>
								</tr>
							</table>

							<hr class='wp-header-end'/>
							
							<div id='notifsContainer'>
							</div>
							
							<table id=containerTable>
								<tr>
									<td colspan=2>
										<div id=bulkMenu>
											<ul class=pageContent>
												<li class=select><div></div></li>
												<li data-tooltip="that's the page's name" class=pageName><span><span id=selectedPagesAmount>0</span> pages selected</span></li>
												<li class=mode >
													<span data-tooltip="<b>Automatic mode</b><br/>
														We do everything for you, just sit back and contemplate as the cash is flowing in.<br/><br/>
														<b>Manual Mode</b><br/>
														You can choose which keywords to transforms to links in the post edition page.<br/><br/>
														<b>Off</b><br/>
														You don't want to insert any keyWord on this page."
													>Mode:</span>
													<select>
														<option value=1>Automatic</option>
														<option value=0>Manual</option>
														<option value=-1>Off</option>
													</select>
												</li>
												<li class=maxLinks>
													<span data-tooltip="The maximum amount of links what will be inserted in your page">
														Max links per page
													</span>
													<input type="number" min=0 max=100 />
												</li>
												<li class=updateExist>
													<span data-tooltip="If you already have affiliate links, or merchants links in your pages, they will automatically be replaced by TravelAdsNetwork affiliate links">
														Update existing links:
													</span>
													<input type="checkbox" />
												</li>
												<li class=merchants>
													<span data-tooltip="The merchants to promote in your page.">Merchants:</span>
													<input type="text" class="merchantField"/>
												</li>
											</ul>
										</div>
									</td>
								</tr>
								<tr>
									<td>
										<ul id=pagesContainer>
											<?php
												function dispPage($page_id, $page_name) {
													global $pages_configs;
													$config = '';
													foreach( $pages_configs as $page_config )
														if($page_id == $page_config->{'page_id'})
														{
															$config = json_decode( json_encode( $page_config ) );
														}
													if( ! $config )
														$config = json_decode(json_encode([
															'page_id' => $page_id,
															'mode' => '0',
															'link_amount' => '5',
															'update_links' => '1',
															'merchants' => '[]'
														]));

													?>
														<li class=page value=<?=$page_id?>>
															<ul class=pageContent>
																<li class=select>
																	<div></div>
																</li>
																<li data-tooltip="that's the page's name" class=pageName><span><?=$page_name?></span></li>
																<li class=mode >
																	<span data-tooltip="<b>Automatic mode</b><br/>
																		We do everything for you, just sit back and contemplate as the cash is flowing in.<br/><br/>
																		<b>Manual Mode</b><br/>
																		You can choose which keywords to transforms to links in the post edition page.<br/><br/>
																		<b>Off</b><br/>
																		You don't want to insert any keyWord on this page."
																	>Mode:</span>
																	<select >
																		<option value=1  <?=($config->{'mode'}==1?'selected':'')?>>Automatic</option>
																		<option value=0  <?=($config->{'mode'}==0?'selected':'')?>>Manual</option>
																		<option value=-1 <?=($config->{'mode'}==-1?'selected':'')?>>Off</option>
																	</select>
																</li>
																<li class=maxLinks>
																	<span data-tooltip="The maximum amount of links what will be inserted in your page">
																		Max links per page
																	</span>
																	<input  type="number" min=0 max=100 value=<?=$config->{'link_amount'}?> />
																</li>
																<li class=updateExist>
																	<span data-tooltip="If you already have affiliate links, or merchants links in your pages, they will automatically be replaced by TravelAdsNetwork affiliate links">
																		Update existing links:
																	</span>
																	<input  type="checkbox" <?=($config->{'update_links'}==1?'checked':'')?> />
																</li>
																<li class=merchants>
																	<span data-tooltip="The merchants to promote in your page.">Merchants:</span>
																	<input  type="text" data-ids=<?=$config->{merchants}?> class="merchantField"/>
																</li>
															</ul>
														</li>
													<?php
												}

												foreach(get_pages() as $page)
													dispPage( $page->{'ID'}, $page->{'post_title'} );
												foreach(get_posts() as $post)
													dispPage( $post->{'ID'}, $post->{'post_title'} );
											?>
										</ul>
									</td>
									<td id=merchantSection class=''>
										<div>
											<table id=filtersTable>
													<tr>
														<td>
															<ul id=merchantList>
																<?php
																	foreach(json_decode(file_get_contents(plugins_url("data/advertisers.json", dirname(__FILE__)))) as $a)
																		echo '<li value="'.$a->{'id'}.'"> '.$a->{'name'};
																?>
															</ul>
														</td>
													</tr><tr>
														<td id=selectedMerchantCell>
															<h4>Reorder your merchants:</h4>
															<ul id=selectedMerchantList class=grid>
															</ul>
														</td>
													</tr>
											</table>
										</div>
									</td>
								</tr>
							</table>
							<div id=toolTip> </div>
						</div>
					</form>

					<?php

					// }}}

				endif; 

				?>

			</div>
		</div>

		<?php

		// }}}
	}

	public function addmenu() {
		$hook=add_menu_page(__('TravelAdsNetwork Settings','travelads'),'TravelAdsNetwork','manage_options','travelads',array($this,'show'),plugins_url("assets/images/logo.png", dirname(__FILE__)),3);
	}

}
