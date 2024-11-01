!function($) {
	let occupied = false;

	$(document).ready(function() {
		/**
		 * Choses the offer to put in the hyperlink among the offers array, and replace
		 * the keyword with this offer's link
		 *
		 * @param {Node}   node     DOM Node to replace with the link
		 * @param {Array}  offers   Array containing the offers available
		 * @param {number} merchant Id of the merchant to choose
		 * @param {bool}   flag     true if the offer has been obtained via an API call
		 */
		function tan_chooseAndReplace(node, offers, merchant, keyword, flag=false)
		{
			offer = offers.filter(v=>v.adv_id == merchant)[0];
			if(!offer) return;


			offer.offer_url = fillDeepLinkFields( offer.offer_url,
			                                      offer.offer_cat_link_id, offer.origin_id || '',
			                                      offer.destination_id || '',
			                                      '',
			                                      '',
			                                      offer.hotel_id || '');


			
			//
			// Adding the kw to the database
			//
			if(flag)
				$.post('?TAN_api&kw='+keyword.format(), {offer: offer});

			var link = buildDeepLink(offer);

			node.replaceWith("<a target='_blank' class='tanDeepLink' href='"+link+"'>"+keyword+"</a>");

			occupied = false;
		}



		//
		// Variables used by the parsing process
		//
		document.cookie = "TAN_update=; path=/";
		var savedMatches = php_data.savedMatches;
		var totalMatchedKeywords = 0;

		/**
		 * replace the keywords in the text
		 * 
		 * @param {Node} element Dom Node where to search for the pattern
		 */
		function tan_replaceFunc(element) {
			var merchant = parseInt(element.attr('data-adv'));
			var keyword = element.text();
			var search = element.attr('data-search');

			if(  !savedMatches[keyword.format()]
			  || (  !savedMatches[keyword.format()].notYet
			     && !savedMatches[keyword.format()].filter(v=>v.adv_id == merchant).length ))
			{
				//
				// call to our api, to access ONLY if no match was found in the affiliate's database
				//
				savedMatches[keyword.format()] = {"notYet": true};
				$.getJSON("https://traveladsnetwork.com/api-from-js/?method=getOffers&search="+search+"&aff_id="+php_data.affiliate_id+"&onlyTargeted=true")
					.done(function(offers) {
						//
						// We only keep targeted hotels, tours, and flights offers
						// We also lighten them
						//
						offers = offers.filter(o=>  typeof o.destination_id !== 'undefined'
						                         && ( o.offer_cat_link_id === '7'
						                           || o.offer_cat_link_id === '11'
						                           || o.offer_cat_link_id === '15'))

						               .map(o => ({ off_id:          parseInt(o.off_id),
						                            offer_url:       o.offer_url,
						                            adv_id:          parseInt(o.advertiser_id),
						                            cat_id:          parseInt(o.offer_cat_link_id),
						                            destination_id:  o.destination_id,
						                            hotel_id:        o.hotel_id}));
						
						savedMatches[keyword.format()] = offers;
						
						tan_chooseAndReplace(element, offers, merchant, keyword, true);
					});
			}
			else
			{
				//
				// Interval to wait while the first occurence of 
				// this keyWord is being processed
				//
				var stop = setInterval(function(){
					if(typeof savedMatches[keyword.format()].notYet == 'undefined')
					{
						tan_chooseAndReplace(element, savedMatches[keyword.format()], merchant, keyword);
						clearInterval(stop);
					}
				}, 200);
			}
		};

		//
		// replace keywords where the user chose on
		// the manual mode editor
		//
		$("span.TAN_link.active").each(function(){
			let stop = setInterval(() => {
				if(!occupied)
				{
					occupied = true;
					tan_replaceFunc($(this));
					clearInterval(stop);
				}
				else
					console.log('waiting...');
			}, 100);
		});

		if(php_data.pageConfig.update_links)
		{
			php_data.all_merchants.forEach(function(merch) {
				$('a[href*="'+merch.name.toLowerCase()+'"]:not(.tanDeepLink)').each(function() {
					let link = this.getAttribute('href');

					let testRegex = RegExp(merch.name, 'i');
					
					function findTrueLink(link){
						let url;

						try      { url = new URL(link) }
						catch(e) { return '' }

						if(testRegex.test(url.hostname)) return url.href;
						
						let trueLink = ''
						url.searchParams.forEach(function(elem) {
							if(testRegex.test(elem))
									trueLink = findTrueLink(elem) || trueLink;
						});

						return trueLink;
					}

					link = findTrueLink(link);

					link = buildDeepLink({
						off_id: merch.main_off_id,
						offer_url: merch.baseLink + encodeURIComponent(link)
					});

					this.setAttribute('href', link);
					this.setAttribute('target', '_blank');
				});
			});
		}
	});
}(jQuery);
