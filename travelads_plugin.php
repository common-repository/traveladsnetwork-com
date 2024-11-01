<?php
/**
 * Plugin Name: TravelAdsNetwork.com
 * Description: Auto detect the keywords in your page to add links
 * Version: 1.0
 * Author: TravelAdsNetwork
 * Author URI: https://traveladsnetwork.com
 */

/**
 * Create a restful response
 *
 * @param int    $return_code http code to send
 * @param string $status      can be 'success' | 'error'
 * @param string $message     describe the answer, explain the error
 * @param Object $data        data to send (not json encoded string)
 */
function respond($return_code=200, $status='success', $message='', $data='')
{
	// {{{
	header("HTTP/1.1 ".$status_code);
	http_response_code($return_code);

	$answer = [];
	$answer += ['status_code' => $return_code];
	$answer += ['status' => $status];
	if($message != '')
		$answer += ['message' => $message];
	if($data != '')
		$answer += ['data' => $data];

	echo json_encode($answer);
	exit();
	// }}}
}

global $wpdb;

//
// Transforms pages into API, to communicate with the API
//
if(isset($_GET['TAN_api']))
{
	// {{{
	$key = $_GET['kw'];
	
	if(!$key || !isset($_POST['offer']))
		respond(400, 'error', 'data missing!');
	
	$res = $wpdb->get_results('SELECT * FROM `tan_keywords` WHERE `keyword` = "'.$_GET['kw'].'"');

	$offs = json_decode('['.$res[0]->{'links'}.']');

	if(count($offs)) // already links
	{
		for($i=0 ; $i<count($offs) ; $i++)
			if($offs[$i]->{'adv_id'} === $_POST['offer']['adv_id'])
				respond('202', 'success', 'Entry already present in database');

		$query = "UPDATE `tan_keywords` 
		          SET `links` = '". $res[0]->{'links'} .','.json_encode($_POST['offer'])."'
		          WHERE `keyword` = LOWER('".$key."')";
	}
	else	// no links yet
	{
		$query = "INSERT INTO `tan_keywords` (`keyword`, `links`)
		          VALUES (LOWER('".$key."'), '".json_encode($_POST['offer'])."')";
	}

	$wpdb->query($query);

	respond(202, 'success', 'Entry successfully added to database');

	exit();
	// }}}
}


$tan_log_code=-1;

/**
 * Tests if the user is logged into TAN or not
 *
 * @return int HTTP code of request, usually 400 or 202
 */
function tan_test_log()
{
	// {{{
	global $tan_log_code;
	if($tan_log_code !== -1)
		return $tan_log_code;

	if(isset($_COOKIE['TAN_login']))
	{
		$request = new WP_Http;

		// 
		// even if the user modifies the cookies, no problems, it's 
		// treated on the API side
		//
		
		$username = isset($_COOKIE['TAN_username'])?$_COOKIE['TAN_username']:'';
		$nonce = isset($_COOKIE['TAN_login'])?$_COOKIE['TAN_login']:'';

		$result = $request->get( 'https://traveladsnetwork.com/api-remote-login/?method=checkNonce'
					 .'&username='.$username
					 .'&nonce='.$nonce );

		$tan_log_code = $result['response']['code'];
		
		if($tan_log_code === 202)
			wp_enqueue_script("traveladsnetwork_updatecookiejs", plugins_url('assets/js/updateCookie.js', __FILE__));
	}
	else
		$tan_log_code = 400;

	return $tan_log_code;
	// }}}
}

define('travelads_PLUGIN_DIR',plugin_dir_path(__FILE__));


//
// adding the styles for the admin side (configuration, login, etc..)
//
add_action('admin_print_styles', function() {
	// {{{

	global $wpdb;

	$ID = get_the_ID();
	$res = $wpdb->get_results('SELECT * FROM tan_pages_config
				WHERE `page_id` = "'.$ID.'"');
	
	$pageConfig = $res[0];
	
	switch(preg_replace('/\?.*$/', '', $_SERVER['REQUEST_URI']))
	{
		case('/wp-admin/admin.php'):
			if(tan_test_log() === 202)
				wp_enqueue_style("traveladsnetwork_configcss", plugins_url('assets/css/config.css', __FILE__));
			else
				wp_enqueue_style("traveladsnetwork_logincss", plugins_url('assets/css/login.css', __FILE__));
			break;
		case('/wp-admin/post-new.php'):
			if($pageConfig->{'mode'} === '0')	//manual mode
				wp_enqueue_style("traveladsnetwork_pageEditcss", plugins_url('assets/css/pageEdit.css', __FILE__));
				if(tan_test_log() !== 202)
					wp_enqueue_style("traveladsnetwork_logincss", plugins_url('assets/css/login.css', __FILE__));
			break;
		case('/wp-admin/post.php'):
			if($pageConfig->{'mode'} === '0')	//manual mode
				wp_enqueue_style("traveladsnetwork_pageEditcss", plugins_url('assets/css/pageEdit.css', __FILE__));
				if(tan_test_log() !== 202)
					wp_enqueue_style("traveladsnetwork_logincss", plugins_url('assets/css/login.css', __FILE__));
			break;
	}
	// }}}
});

//
// adding scripts for the admin side
//
add_action('admin_print_scripts', function() {
	// {{{
	global $wpdb;

	wp_enqueue_script("traveladsnetwork_funcsJs", plugins_url('assets/js/functions.js', __FILE__));

	$ID = get_the_ID();
	$res = $wpdb->get_results('SELECT * FROM tan_pages_config
				WHERE `page_id` = "'.$ID.'"');

	$pageConfig = $res[0];

	switch(preg_replace('/\?.*$/', '', $_SERVER['REQUEST_URI']))
	{
		case('/wp-admin/admin.php'):
			if(tan_test_log() === 202)
			{
				wp_enqueue_script("traveladsnetwork_sortableJs", plugins_url('assets/libs/sortable.js', __FILE__));
				wp_enqueue_script("traveladsnetwork_configjs", plugins_url('assets/js/config.js', __FILE__));
				wp_localize_script( 'traveladsnetwork_configjs', 
				                    'php_data',
				                    isset($_COOKIE['TAN_savedConfig'])
				                              ? stripslashes($_COOKIE['TAN_savedConfig'])
				                              : 'null');
			}
			else
				wp_enqueue_script("traveladsnetwork_loginjs", plugins_url('assets/js/login.js', __FILE__));
			break;
		case('/wp-admin/post.php'):
			if($pageConfig->{'mode'} === '0')	//manual mode
			{
				wp_enqueue_script("traveladsnetwork_keyWordsData", plugins_url('data/keyWords.js', __FILE__));
				wp_enqueue_script("traveladsnetwork_pageEditjs", plugins_url('assets/js/pageEdit.js', __FILE__));

				if(tan_test_log() !== 202)
					wp_enqueue_script("traveladsnetwork_loginjs", plugins_url('assets/js/login.js', __FILE__));
			}
			break;

		case('/wp-admin/post-new.php'):
			if($pageConfig->{'mode'} === '0')	//manual mode
			{
				wp_enqueue_script("traveladsnetwork_keyWordsData", plugins_url('data/keyWords.js', __FILE__));
				wp_enqueue_script("traveladsnetwork_pageEditjs", plugins_url('assets/js/pageEdit.js', __FILE__));
			}
			break;
	}
	// }}}
});

//
// adding scripts for the posts and pages
//
add_action('wp_enqueue_scripts', function() {
	// {{{
	wp_enqueue_script('jquery');

	//
	// load the keyWords ASAP
	//
	wp_enqueue_script("traveladsnetwork_keyWordsData", plugins_url('data/keyWords.js', __FILE__));

	wp_enqueue_script("traveladsnetwork_funcsJs", plugins_url('assets/js/functions.js', __FILE__));

	global $wpdb;
	$ID = get_the_ID();
	$res = $wpdb->get_results('SELECT * FROM tan_pages_config
				WHERE `page_id` = "'.$ID.'"');

	$affiliate_id = get_option('TAN_HO_ID');

	if($affiliate_id !== false && count($res) > 0):

		$pageConfig = $res[0];

		$res = $wpdb->get_results("SELECT * FROM `tan_keywords`");

		$savedMatches = [];

		foreach($res as $r)
			$savedMatches += [$r->{'keyword'} => json_decode('['.$r->{'links'}.']')];
		
		if($pageConfig->{'mode'} === '1')	//automatic mode
		{
			wp_enqueue_script("traveladsnetwork_autoModejs", plugins_url('assets/js/autoMode.js', __FILE__));
			wp_localize_script( 'traveladsnetwork_autoModejs',
			                    'php_data',
			                    [ 'savedMatches'  => $savedMatches ,
			                      'affiliate_id'  => $affiliate_id,
			                      'all_merchants' => json_decode(file_get_contents(plugins_url("data/advertisers.json", __FILE__))),
			                      'pageConfig'    => $pageConfig] );
		}
		else if($pageConfig->{'mode'} === '0') 	// manual mode
		{
			wp_enqueue_script("traveladsnetwork_manualModejs", plugins_url('assets/js/manualMode.js', __FILE__));
			wp_localize_script( 'traveladsnetwork_manualModejs',
			                    'php_data',
			                    [ 'savedMatches'  => $savedMatches,
			                      'affiliate_id'  => $affiliate_id,
			                      'all_merchants' => json_decode(file_get_contents(plugins_url("data/advertisers.json", __FILE__))),
			                      'pageConfig'    => $pageConfig] );
		}
	endif;
	// }}}
});



add_action( 'init',function(){
});

add_action( 'delete_post', function($id) {
	global $wpdb;
	$wpdb->query("DELETE FROM `tan_pages_config` WHERE `page_id` = '$id'");
});


add_action('save_post', function ($id) {
	// {{{

	//
	// If this is just a revision, don't alter the DB
	//
	if ( wp_is_post_revision( $post_id ) )
		return;

	global $wpdb;
	$wpdb->query("INSERT INTO `tan_pages_config` (`page_id`) VALUES '$post_id'");

	// }}}
});

//
// handle for uninstallation (database cleanup)
//
register_uninstall_hook( __FILE__, 'tan_remove');
function tan_remove() {
	// {{{
	global $wpdb;

	$wpdb->query("DROP TABLE `tan_pages_config`");
	$wpdb->query("DROP TABLE `tan_keywords`");
	// }}}
}

register_deactivation_hook( __FILE__, function() {
});

//
// database table creation
//
register_activation_hook( __FILE__, function () {
	// {{{
	global $wpdb;

	$wpdb->query("CREATE TABLE `tan_pages_config` ( `page_id` INT NOT NULL ,
								`mode` BOOLEAN NOT NULL DEFAULT TRUE , 
								`link_amount` INT NOT NULL DEFAULT '3' , 
								`update_links` BOOLEAN NOT NULL DEFAULT TRUE ,
								`merchants` VARCHAR(128) NOT NULL DEFAULT '[]' , 
								PRIMARY KEY (`page_id`))");

	$insertQuery='INSERT INTO `tan_pages_config` (`page_id`) VALUES';

	$idList=[];
	if(is_object(get_pages()))
		foreach(get_pages() as $page)
			array_push($idList, $page->{'ID'});
	if(is_object(get_posts()))
		foreach(get_posts() as $post)
			array_push($idList, $post->{'ID'});

	foreach($idList as $id)
		$insertQuery .= '("'.$id.'"), ';

	$insertQuery = trim($insertQuery, ', ');

	$wpdb->query($insertQuery);

	$wpdb->query('CREATE TABLE `tan_keywords` ( `keyword` VARCHAR(128) NOT NULL , 
									`links` VARCHAR(2048) NOT NULL , 
									PRIMARY KEY (`keyword`))');
	// }}}
});

//
// Including the other PHP files
//

// {{{
include(travelads_PLUGIN_DIR.'classes/traveladsConfig.php'); // to get the button and menu on the side
$tan_object = traveladsConfig::instance();

if(  preg_replace('/\?.*$/', '', $_SERVER['REQUEST_URI'])  === '/wp-admin/post.php'
  || preg_replace('/\?.*$/', '', $_SERVER['REQUEST_URI'])  === '/wp-admin/post-new.php')
{
	$ID = $_GET['post'];
	$res = $wpdb->get_results('SELECT * FROM tan_pages_config
				WHERE `page_id` = "'.$ID.'"');
	$pageConfig = $res[0];

	if($pageConfig->{'mode'} === '0')	//manual mode
	{
		require_once(travelads_PLUGIN_DIR.'classes/traveladsBox.php');
		require_once(travelads_PLUGIN_DIR.'classes/traveladsButton.php');
	}
}

// Do not pollute other plugins
unset($tan_object);

// }}}
