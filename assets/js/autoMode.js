!function($) {
	$(document).ready(function() {

		/**
		 * Choses the offer to put in the hyperlink, among the offers array
		 *
		 * @param {Array}  matches Array containing all matches of this node
		 * @param {Array}  offers  Array containing the offers available
		 * @param {number} i       index of the current keyWord
		 *
		 * @description This function uses the array `merchants`, to determine which merchants to pick
		 */
		function tan_chooseAmongOffers(matches, offers, i) 
		{
			// {{{
			var count=0;
			choosen = undefined;
			for(count = 0 ; count<merchants.length ; count++)
			{
				merch = merchants[count];
				
				if(!merchants.length)
					choosen = offers[Math.floor(Math.random()*offers.length)]
				else
					choosen = offers.filter(elem => elem.adv_id == merch)[0];

				if(typeof choosen !== 'undefined' 
				   && typeof choosen.off_id !== 'undefined')
				{
					merchants.pushAtEnd(count);
					choosen.offer_url = fillDeepLinkFields(choosen.offer_url,
					                                       choosen.offer_cat_link_id, 
					                                       choosen.origin_id || '', 
					                                       choosen.destination_id || '',
									       '',
									       '',
									       choosen.hotel_id || '');
					var link = buildDeepLink(choosen);
					matches[i] = '<a class="tanDeepLink" target="_blank" href="'+link+'">'+matches[i]+'</a>';

					break;
				}
			}

			return matches;
			// }}}
		};

		/**
		 * replace the keywords in the text
		 * 
		 * @param {RegExp} target  regex containing the elements to match
		 * @param {Node}   element Dom Node where to search for the pattern
		 */
		function tan_replaceFunc(target, element) {
			// {{{
			matches = $(element).text().match(target);
			if(!matches) return;

			var i=0;
			var finalStr = $(element).text().replace(target, function(word) {
				i++;
				return (totalMatchedKeywords+i > maxKeyWords)? word: '{ "who":"tan", "num":'+i+' }';
			});

			let done=0;
			totalMatchedKeywords+=matches.length;
			for(var i=0 ; i<matches.length ; i++)
			{
				(function(matches, i) {
					if(  typeof savedMatches[matches[i].toLowerCase()] === 'undefined'
					  || savedMatches[matches[i].toLowerCase()] === null)
					{
						//
						// Telling that this keyword being processed, to avoid calling the database
						// for several occurences of the same keyword
						//
						savedMatches[matches[i].toLowerCase()] = {"notYet": true};
						$.getJSON("https://traveladsnetwork.com/api-from-js/?method=getOffers&search="+matches[i]+"&aff_id="+php_data.affiliate_id+"&onlyTargeted=true")
							.done(function(offers) {
								//
								// We only keep targeted hotels, flights and tours offers
								// We also lighten them
								//
								offers = offers.filter(o=>  typeof o.destination_id !== 'undefined'
								                         && ( o.offer_cat_link_id === '7'
								                           || o.offer_cat_link_id === '11'
								                           || o.offer_cat_link_id === '15'))
								               .map(o => ({ off_id:         parseInt(o.off_id),
								                            offer_url:      o.offer_url,
								                            adv_id:         parseInt(o.advertiser_id),
								                            cat_id:         parseInt(o.offer_cat_link_id),
								                            destination_id : o.destination_id,
								                            hotel_id:        o.hotel_id }));
								//
								// Store that in the save matches array to avoid 
								// calling the API every time
								//
								savedMatches[matches[i].toLowerCase()] = offers;

								addToCookie[matches[i].toLowerCase()] = offers.slice(0, 10);
								document.cookie = 'TAN_matches='+JSON.stringify(addToCookie)+'; path=/';
								
								//
								// Replace the keyWords with the replacement in the matches array:
								// Bangkok => <a href='bookin.com?....'>Bangkok</a>
								//
								matches = tan_chooseAmongOffers(matches, offers, i);
								done++;

								//
								// Did we iterate among all the matches of this node?
								//
								if(done === matches.length)
								{
									//
									// Finally, replacing the actual node, with the link
									//
									$(element)
										.replaceWith(finalStr
											.replace(/\{ "who":"tan", "num":\d+ \}/g, function(n){
												return matches[JSON.parse(n).num-1];
											}));
								}
							});
					}
					else
					{
						//
						// Interval to wait while the first occurence of 
						// this keyWord is being processed
						//
						let stop = setInterval(function(){
							if(typeof savedMatches[matches[i].toLowerCase()].notYet === 'undefined')
							{
								matches = tan_chooseAmongOffers(matches, savedMatches[matches[i].toLowerCase()], i);
								done++;
								if(done === matches.length)
								{
									$(element)
										.replaceWith(finalStr
											.replace(/\{ "who":"tan", "num":\d+ \}/g, function(n){
												return matches[JSON.parse(n).num-1];
											}));
								}
								clearInterval(stop);
							}
						}, 200);
					}

				})(matches, i);
			}
			// }}}
		};

		/**
		 * Spot the keyWords in the text nodes, and replace them with links
		 *
		 * @param {RegExp} target regular expression matching the targeted keywords
		 */
		$.fn.tan_replaceWithLinks = function(target) {
			// {{{
			//
			// Get all text nodes:
			//
			excludeNodes = ['SCRIPT', 'STYLE', 'H1', 'H2', 'H3', 'H4'];
			var $textNodes = this
					.find("*")
					.andSelf()
					.contents()
					.filter(function() {
						return this.nodeType === 3 
							&& !$(this).parent("a").length
							&& !$(this).parent(excludeNodes.join(',')).length
							&& $(this).text().trim() !== '';
					});

			//
			// Iterate through the text nodes, replacing 
			// the content with the link:
			//
			totalMatchedKeywords = 0;
			$textNodes.each(function(index, element) {
				tan_replaceFunc(target, element);
			});
			// }}}
		};

		//
		// Varaibles used by the parsing process
		//
		var savedMatches = php_data.savedMatches;
		var merchants = JSON.parse(php_data.pageConfig.merchants);
		var maxKeyWords = php_data.pageConfig.link_amount;
		var defaultMerchants = [];
		var totalMatchedKeywords = 0;
		var addToCookie = {};

		if(!merchants.length)
			merchants = php_data.all_merchants.map(v=>v.id);

		//
		// creation of the Regex (list of keywords)
		//
		data=keyWords;
		var to_replace = '';
		for(var i=0 ; i<data.length ; i++)
			to_replace += '\\b'+data[i]+'\\b|';
		to_replace += '(worldThatWillNeverAppearNowhere)';
		
		//
		// replace words on the content only
		//
		$(document).tan_replaceWithLinks(new RegExp(to_replace, 'gi'));

		if(php_data.pageConfig.update_links)
		{
			// {{{
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
			// }}}
		}
	});
}(jQuery);
