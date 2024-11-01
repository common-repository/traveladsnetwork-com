jQuery(document).ready(function($) {

	//
	// Pages bulk selection
	//
	
	// {{{
	
	function updateBulkSelect()
	{
		$('#bulkMenu').toggleClass('selected', !!$(".page.selected").length);
		$('#selectedPagesAmount').html($('.page.selected').length);
	}
	
	$('.select, .pageName').click(function(e) {
		// {{{

		let $page = $(this).parents('.page'),
		    $lastSelectedPage = $('.lastSelected');

		if(e.originalEvent.shiftKey)
		{
			let $grp;

			if( $lastSelectedPage && !$lastSelectedPage.is($page) )
			{
				if( $page.index() > $lastSelectedPage.index() )
					$grp = $page.prevUntil($lastSelectedPage);
				else
					$grp = $page.nextUntil($lastSelectedPage);

				$grp = $grp.add( $page ).add($lastSelectedPage);

				$lastSelectedPage.toggleClass('lastSelected', false);
				$page.toggleClass('lastSelected', true);
			}
			else
				$grp = $page;

			let selected = $grp.filter('.selected').length;

			$grp.toggleClass('selected', (selected < $grp.length/2) );
		}
		else
		{
			$page.toggleClass('selected');

			$lastSelectedPage.toggleClass('lastSelected', false);
			$page.toggleClass('lastSelected', true);
		}

		updateBulkSelect();

		// }}}
	});

	$(document).keydown(function(e) {
		// {{{
		e = e.originalEvent;

		if(e.ctrlKey && e.key === "a") // CTRL + a
			$('.page').toggleClass('selected', true);
		else if(e.keyCode === 27) // Escape
			$('.page').toggleClass('selected', false);

		updateBulkSelect();
		// }}}
	});

	$('#bulkMenu .select').click(function() {
		// {{{
		let $grp = $('.page');

		let selected = $grp.filter('.selected').length;

		$grp.toggleClass('selected', (selected < $grp.length/2) );

		updateBulkSelect();
		// }}}
	})

	$('#bulkMenu .mode select').change(function() {
		$(".page.selected .mode select").val( $(this).val() );
	});

	$('#bulkMenu .maxLinks input').change(function() {
		$(".page.selected .maxLinks input").val( $(this).val() );
	});

	$('#bulkMenu .updateExist input').click(function() {
		$(".page.selected .updateExist input").prop( 'checked', $(this).is(':checked') );
	});

	// }}}
	
	//
	// Merchant section
	//
	
	// {{{
	

	function updateFocussedMerchantField() {
		let $foc = $('.merchantField.focussed');

		if($foc.is('#bulkMenu .merchants input')) // bulk selection
			$foc = $foc.add('.page.selected .merchants input');

		$foc.attr( 'value', [...$('#selectedMerchantList li')].map(v=>$(v).find('.merchantName').text().trim()).join(', ') || 'All merchants');
		$foc.attr( 'data-ids', JSON.stringify( [...$('#selectedMerchantList li')].map( v=>$(v).attr('value') ) ) );
	}
			

	$('.merchantField').focus(function() {
		// {{{
		
		$(this).blur();
		$('.merchantField.focussed').removeClass('focussed');
		$(this).toggleClass("focussed", true);

		// Updating the merchant panel content
		
		$('#selectedMerchantList').empty();
		$('#merchantList .selected').toggleClass('selected', false);

		if( (ids = $(this).attr('data-ids')) )
		{
			ids = ids.split('-').map(Number);

			ids.forEach(function(id) {
				$(`#merchantList li[value=${id}]`).click();
			});
		}
		
	}).click(function(e) {
		$('#merchantSection').toggleClass('active', true);
		e.stopPropagation();
		
		// }}}
	})

	$(window).click(function(e) {
		if( $('#merchantSection').is('.active') ) e.stopPropagation();
		
		$('#merchantSection').toggleClass('active', false)
		$('.merchantField.focussed').removeClass('focussed');
	})

	$('#merchantSection').click(function(e) {
		e.stopPropagation();
	})

	$('ul#merchantList li').click(function(e) {
		// {{{

		$(this).toggleClass('selected');
		if($(this).hasClass('selected'))
		{
			if($('ul#merchantList li.selected').length >= 10)
			{
				$(this).toggleClass('selected');
				alert('10 merchants max');
				return;
			}
			$('ul#selectedMerchantList').append('<li value='+$(this).attr('value')+'> '
								+'<span class=iconCross>x</span>'
								+'<span class=merchantName>' + $(this).text()) + '</span>'
								+'</li>';

			$('span.iconCross').each(function() {
				this.onclick = function() {
					var $father = $(this).parents('#selectedMerchantList > li');
					$('#merchantList > li[value='+$father.attr('value')+']').removeClass('selected');
					$father.remove();
					updateFocussedMerchantField();
				};
			});
			
		}
		else
			$('ul#selectedMerchantList li[value='+$(this).attr('value')+']').remove();

		updateFocussedMerchantField();

		// }}}
	});

	$('input.merchantField[data-ids]').each(function() {
		$(this).val(
			JSON.parse($(this).attr('data-ids')).map( merchantId => (
				$('#merchantList li[value='+merchantId+']').text()
			)).join(', ') || 'All merchants'
		);
	});

	
	var sortable = new Sortable($('ul#selectedMerchantList')[0], {
		animation: 150,
		onChange: function(e) {
			updateFocussedMerchantField();
		}
	});
	
	// }}}


	//
	// Tooltip
	//
	
	// {{{

	$('[data-tooltip]').mousemove(function(e) {
		$('#toolTip:not(.active)')
			.toggleClass('active', true)
			.html($(this).attr('data-tooltip'));
		
		$('#toolTip').offset({
			left: e.originalEvent.pageX,
			top: e.originalEvent.pageY + 15 
		});
	});
	$('[data-tooltip]').mouseleave(function(e) {
		$('#toolTip').toggleClass('active', false);
	});

	$('[data-tooltip]').click(function(e) {
		$('#toolTip').toggleClass('active', false);
	});


	// }}}

	//
	// Responsive stuff
	//
	
	// {{{
	
	$('.page').click(function(e) {
		e = e.originalEvent;

		if( window.innerWidth > 1200 ) return;
		let clickedElem = e.originalTarget || e.srcElement;
		if(clickedElem !== this) return;

		$(this).toggleClass('expanded');
		$('.expanded').not(this).toggleClass('expanded', false);
	});

	// }}}
	

	//
	// Page resize
	//
	
	// {{{

	function resizePageContainer() {
		let w = $(window).height(),
		    d = $('#wpcontent').height() + 65, // padding
		    p = $('#pagesContainer').height();

		$('#pagesContainer').css({ height: w - d + p  })
	}
	
	resizePageContainer();

	$(window).on('resize', function() {
		resizePageContainer();
	});
	$('#wpcontent').on('resize', function() {
		resizePageContainer();
	});

	// }}}
	

	//
	// Cookie stuff
	//
	
	// {{{
	
	let initConfig = {};

	$('.page').each(function() {
		initConfig[$(this).val()] = {
			mode:        $(this).find('.mode option:selected').val(),
			maxLinks:    $(this).find('.maxLinks input').val(),
			updateExist: $(this).find('.updateExist input:checked').length,
			merchants:   $(this).find('.merchants input').attr('data-ids') || '[]'
		};
	});
	
	$('.saveChangesButton').click(function() {
			
		let update = [];

		$('.page').each(function() {
			let init = initConfig[$(this).val()];
			let current = {
				mode:        $(this).find('.mode option:selected').val(),
				maxLinks:    $(this).find('.maxLinks input').val(),
				updateExist: $(this).find('.updateExist input:checked').length,
				merchants:   $(this).find('.merchants input').attr('data-ids') || '[]'
			}

			if(JSON.stringify(init) !== JSON.stringify(current))
			{
				current.pageId = $(this).val();
				update.push( current );
			}
		});


		$.post('/wp-admin/admin-post.php', {
			action: 'update_tan_pages',
			tan_pages_config: $('input#tan_pages_config').val(),
			data: JSON.stringify(update)
		}).done(function() {

			$('#savedDiv').toggle(true);
			$('#notifsContainer').append(`<div class="savedDiv appearing notice notice-success is-dismissible">
					<p>Your new configuration has been successfully saved!</p>
					<button type="button" class="notice-dismiss"><span class="screen-reader-text">Dismiss this notice.</span></button>
				</div>`);

			setTimeout(function() {
				let $lastOne = $('.savedDiv').eq( $('.savedDiv').length-1 );
				$lastOne.toggleClass('appearing', false);

				setTimeout(() => {
					$lastOne.find('.notice-dismiss').click();
				}, 5000);
			}, 1);

			$('.savedDiv .notice-dismiss').click(function() {
				$(this).parents('.savedDiv').toggleClass('dissapearing', true)

				setTimeout(() => {
					$(this).parents('.savedDiv').remove();
				}, 300);
			})
								
		});

		return false;
	});
	
	// }}}
});
