!function() {

    tinymce.create('tinymce.plugins.TravelAdsNetwork_links', {

        init : function(tr, url) {
            tr.addButton('TravelAdsNetwork_links', {
                title : 'TravelAdsNetwork',
                cmd : 'TravelAdsNetwork_links',
                image : url.slice(0, -9) + '/images/logo.png'
            });

            tr.addCommand('TravelAdsNetwork_links', function() {
		$('html, body').animate({
			scrollTop: $("#travel_editor").offset().top
		}, 1000);
            });
        },

    });

    // Register plugin
    tinymce.PluginManager.add( 'TravelAdsNetwork_links', tinymce.plugins.TravelAdsNetwork_links );
}();
