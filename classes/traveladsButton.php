<?php

if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

// initialize
if ( is_admin() ) {
	// Add Button to Editor
	add_action('plugins_loaded', function() {
		add_filter( 'mce_external_plugins','tan_add_button_travel');
		add_filter( 'mce_buttons','tan_register_button_travel');
	});
}

function tan_add_button_travel( $plugin_array ) 
{
	$plugin_array['TravelAdsNetwork_links'] = plugins_url('assets/js/admin/shortcode-button-tinymce.js', dirname(__FILE__));
	return $plugin_array;
}

function tan_register_button_travel( $buttons ) 
{
//	array_push( $buttons, 'TravelAdsNetwork_links' );
	return $buttons;
}
