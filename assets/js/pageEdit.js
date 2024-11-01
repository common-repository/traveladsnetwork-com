var currentFocus = 0;
var googleField  = [];

var travelFocused = false;

var keyWordsRegExp = '';
var addedKeyWords  = [];

var kwList = [];

var editorName = ''

var lastId = 0;


!function($) {
    $(document).ready(function() {
        // {{{
        
        /**
         * Changes the current focussed word
         *
         * @param {int}  nb     The keyWord to highlight -> e.g. if you want to highlight the 5th keyword, nb=4
         * @param {bool} scroll Should the screen scroll automatically to this keyword?
         */
        function tan_changeFocus(nb=0, scroll=true)
        {
            // {{{
            nb = nb || 0;

            nb = (nb+$('#travel_editor mark.TANKeyWord').length)%$('#travel_editor mark.TANKeyWord').length

            currentFocus = nb;
            elem = $('#travel_editor mark.TANKeyWord')[nb];

            $('#navMenu_keyWord').val(elem.innerHTML.trim());

            $('#travel_editor mark.TANKeyWord').removeClass('current');
            $(elem).addClass('current');

            $('#navMenu_currentKeyWord').text(nb+1);

            if($(elem).hasClass('active'))
            {
                $('div#navMenu_buttonOnOff').addClass('active');
            }
            else
            {
                $('div#navMenu_buttonOnOff').removeClass('active');
            }

            
            $('select#navMenu_merchantSelect').val($(elem).attr('data-adv') || $('select#navMenu_merchantSelect option')[0].value);

            if(scroll)
            {
                switch( window.editorName ) {
                    case 'gutenberg':
                        $('.edit-post-layout__content').clearQueue();
                        $('.edit-post-layout__content').animate({
                            scrollTop: $(elem).offset().top-$('.edit-post-visual-editor').offset().top-$(window).height()/2
                        }, 500);
                        break;
                    case 'tinymce':
                        $('html, body').clearQueue();
                        $('html, body').animate({
                            scrollTop: $(elem).offset().top-$(window).height()/2
                        }, 500);
                        break;
                }
            }
            // }}}
        }

        function setWpEditorContent(content)
        {
            // {{{
            if(!window.editorName)
                window.editorName = (!!wp.data)?'gutenberg':
                             (!!tinymce || !!tinyMCE)?'tinymce':
                             '';

            switch(editorName)
            {
                case 'gutenberg':
                    wp.data.dispatch( 'core/editor' ).resetBlocks([]);

                    var editedContent = wp.data.select( "core/editor" ).getEditedPostContent();
                    var newBlocks = wp.blocks.parse( content );
                    wp.data.dispatch( "core/editor" ).insertBlocks( newBlocks );

                    return true;
                case 'tinymce':

                    if(!!tinymce.activeEditor)
                        tinymce.activeEditor.setContent( content )
                    else if(!!tinyMCE.activeEditor)
                        tinyMCE.activeEditor.setContent( content )

                    $('#content').val($('#hidden_travel_editor').html());

                    return true;
            }

            return false;
            // }}}
        }

        function getWpEditorContent()
        {
            // {{{
            if(!window.editorName)
                window.editorName = (!!wp.data)?'gutenberg':
                             (!!tinymce || !!tinyMCE)?'tinymce':
                             '';

            switch(editorName)
            {
                case 'gutenberg':
                    return wp.data.select('core/editor').getEditedPostContent();
                case 'tinymce':
                    if($('#content').attr('aria-hidden') === 'true') // text editor
                        return (window.tinymce || window.tinyMCE).activeEditor.getContent();
                    else 
                        return $('#content').val().replace(/\n/g, '<br/>');
            }

            return '';
            // }}}
        }


        /**
         * Finds the position of a keyWord
         *
         * @param {DomNode}    e         The Dom node representing the keyword, has to be a `<mark class='TANKeyWord'>`
         * @param {jQueryNode} container The container in which the keyWords are. travel editor by default.
         *
         * @return {number} the position of this specific keyword, or 0 if not found
         */

        function tan_domToNum(e, container=$('#travel_editor'))
        {
            // {{{
            list = container.find(' mark.TANKeyWord');
            for(var i=0 ; i<list.length ; i++)
                if(list[i] === e)
                    return i;
            return 0;
            // }}}
        }

        /**
         * function called when a keyWord is clicked
         *
         * @param {DomNode} e The clicked keyWord, has to be a `<mark class='TANKeyWord'>`
         */
        function tan_clickMark(e)
        {
            tan_changeFocus(tan_domToNum(e));
        }

        /**
         * Toggle the specified keyWord on and off
         *
         * @param {number} foc  The keyword to activate, the currently focussed keyword by default, pass -1 to toggle all, -2 to toggle all custom keywords
         * @param {bool}   flag Weather the keyWord should be activated or deactivated. Toggle by default
         */
        function tan_activateKeyWord(foc = currentFocus, flag = undefined)
        {
            // {{{
            if(foc < 0)
            {
                let classes = ['TANKeyWord'];
                if(foc === -2)
                    classes.push('custom');

                let classesStr = classes.map(v=>'.'+v).join('');

                f = $('#travel_editor mark.active'+classesStr).length
                    - $('#travel_editor mark'+classesStr+':not(.active)').length


                f = f<0;
                
                $('#travel_editor mark'+classesStr).each(function() {
                    tan_activateKeyWord(tan_domToNum(this), f);
                });

                return;
            }

            elem = $('#travel_editor mark.TANKeyWord').eq(foc);

            if(elem.hasClass('active') === flag)
                return;

            if(flag === undefined)
                elem.toggleClass('active');
            else
                elem.toggleClass('active', flag);

            elem.attr('data-adv', $('#navMenu_merchantSelect').find('option:selected').val());


            if(foc === currentFocus) $('#navMenu_buttonOnOff').toggleClass('active', elem.hasClass('active'));

            // }}}
        }

        var totalReplaced = 0;
        
        /**
         * Surround the keyWords by <mark>, to highlighting it
         *
         * @param {RegExp} target regular expression matching the targeted keywords
         */
        jQuery.fn.tan_highlightKeywords = function(target)
        {
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
                                    return  this.nodeType === 3 
                                         && !$(this).parent("a").length
                                         && !$(this).parent(excludeNodes.join(',')).length
                                         && !$(this).parent('.TANKeyWord').length
                                         && !$(this).parent('.TAN_link').length
                                         && $(this).text().trim() !== '';
                                });

            //
            // Iterate through the text nodes, 
            // highlighting the keyWords
            //

            let totalReplaced = 0;
            $textNodes.each(function(index, element) {

                match = $(element).text().match(target);

                if(match === null) return;
                var i=0;
                var finalStr = $(element).text().replace(target, function(word) {
                    var originalWord = match[i];
                    i++;
                    totalReplaced++;

                    let tmp = addedKeyWords.filter(v=>v[0].format() === originalWord.format())
                    
                    let c = '';
                    let s = originalWord;
                    if(tmp.length)
                    {
                        c = ' custom'
                        s = tmp[0][1];
                    }

                    return `<mark class='TANKeyWord`+c+`'
                                  data-search='`+s+`'
                                  data-adv=`+$('#navMenu_merchantSelect').find('option:selected').val()+`>`
                              + originalWord 
                              + `</mark>`;
                });

                $(element).replaceWith(finalStr);
            });

            $('.TANKeyWord').each(function(i) {
                
                this.onclick = function() {
                    tan_changeFocus(tan_domToNum(this));
                };
            });
            
            // }}}
        }

        /**
         * copy content from the travel ads network editor to the tiny MCE
         */
        function copy_travel2wp()
        {
            // {{{

            $('#hidden_travel_editor').html(($('div#travel_editor').html()));

            $('#hidden_travel_editor mark.TANKeyWord').each(function() {
                $(this).replaceWith(this.outerHTML.replace(/\bmark\b/, 'span'))
            });

            $('#hidden_travel_editor span.TANKeyWord').each(function() {
                $(this).removeClass('current');
                $(this).removeClass('TANKeyWord');

                $(this).addClass('TAN_link');

                if($(this).hasClass('custom'))
                    $(this).addClass('TAN_link_custom');
            });

            $('#hidden_travel_editor section.tan_asset').each(function(i) {
                $(this).find('script').siblings().remove();
            });

            setWpEditorContent( $('#hidden_travel_editor').html() );

            $('div#travel_editor section.tan_asset script').remove();

            $('#hidden_travel_editor').empty();

            // }}}
        }
        
        /**
         * Copy the content from the wordpress editor to the travel editor
         *
         * @param {string} content The content to put in the travel editor
         */
        function copy_wp2travel()
        {
            // {{{
            content = getWpEditorContent();


            if(  $('div.mce-tinymce').css('display') === 'none' // normal mode
              && $('wp-editor-area').css('display') === 'none') // text mode
            {
                $('#travel_editor').html('<h1 style="text-align:center">The visual Editor is not supported for now...</h1>'+
                                        '<h2 style="text-align:center">You can switch to autmatic mode!</h2>');
                $('#navMenu').toggle(false);
                $('#navMenuOffset').toggle(false);
                return;
            }
            $('#navMenu').toggle(true);
            $('#navMenuOffset').toggle(true);

             totalReplaced = 0;
            $('#travel_editor').empty();
            $('#travel_editor').html(content);
            $('#travel_editor span.TAN_link').each(function() {

                $(this).replaceWith(this.outerHTML.replace(/\bspan\b/, 'mark'))
            });

            $('#travel_editor mark.TAN_link').each(function() {
                $(this).removeClass('TAN_link_custom');
                $(this).removeClass('TAN_link');

                $(this).addClass('TANKeyWord');
            });


            $("#travel_editor").tan_highlightKeywords(createNewRegexp(keyWordsRegExp, addedKeyWords.map(v=>v[0])));
            
            tan_changeFocus(currentFocus, false);
            $('#navMenu_totalKeyWord').text($('#travel_editor mark.TANKeyWord').length);
            // }}}
        }

        /**
         * Transforms the google places API response to a easier to use object
         *
         * @param {Object} googlePlace The object returned by the google places API
         *                              -> ```
         *                                 {
         *                                     address_coponents: <array of addresses>,
         *                                     geometry:          <geometry, lat, long>,
         *                                     types:             <array of types>,
         *                                     name:              <name>
         *                                 }
         *                                 ```
         *
         * @return {Object} An easier to use array
         *                   -> ```
         *                      {
         *                          country:     <country name>,
         *                          city:        <city name>,
         *                          route:       <route name>,
         *                          searchText:  <text to search on the OTA's calls>,
         *                          lat:         <latitude>,
         *                          lng:         <longitude>,
         *                      }
         *                      
         *                      ```
         */
        function googlePlaceFormat(googlePlace)
        {
            // {{{
            let out = {};

            let cityWrongNames = {
                'Krung Thep Maha Nakhon': 'Bangkok',
                'Krong Siem Reap': 'Siem Reap'
            };

            let address = googlePlace.address_components.filter(v=>  !/^[0-9]*$/.test(v.long_name)        // exclude only numbers
                                                                  && !/^[0-9]/.test(v.long_name));      // and  beginning with number

            let country             = address.filter(v=>v.types.contains('country')),
                administrativeAreas = address.filter(v=>v.types.some(t=>/administrative_area_level_\d+/.test(t))),
                city                = address.filter(v=>v.types.contains('locality', 'postal_town')),
                subLocalAreas       = address.filter(v=>v.types.some(t=>/sublocality_level_\d+/.test(t))),
                route               = address.filter(v=>v.types.contains('route'));

            out = {
                'lat': googlePlace.geometry.location.lat(),
                'lng': googlePlace.geometry.location.lng()
            };

            if(country.length)
            {
                out.country=country[0].long_name;
                if(city.length)
                {
                    out.city=city[0].long_name;

                    if(route.length)
                        out.route = route[0].long_name
                    else if(subLocalAreas.length)
                        out.route = subLocalAreas[0].long_name
                }
                else if(administrativeAreas.length)
                    out.city = administrativeAreas[0].long_name;
            }

            out.city = cityWrongNames[out.city] || out.city;
            
            
            if(!googlePlace.types.contains('lodging', 'premise'))    // is not lodging nor premise
                out.searchText = (out.route||'')+', '+(out.city||'')+', '+(out.country||'');
            else
                out.searchText = (googlePlace.name||'')+', '+(out.city||'')+', '+(out.country||'');
            
            out.searchText = out.searchText.replace(/^[, ]+/, '');

            return out;
            // }}}
        }

        /**
         * Adds the custom keyWords to the original regexp
         *
         * @param {RegExp} original The original regexp conaining all the default keywords
         * @param {Array}  keyWords A list of the new keyWords
         */
        function createNewRegexp(original, keyWords)
        {
            // {{{
            //
            // transforming the old regexp to string
            //
            let newRegExp = original.toString().replace(/^[^\/]*\/|\/[^/]*$/g, '');
            
            //
            // adding the new keyWords
            //
            for(let i=0 ; i<keyWords.length ; i++)
            {
                newRegExp += '|';
                if(/^[a-z]/i.test(keyWords[i])) // begin with latin alphabet
                    newRegExp += '\\b';

                newRegExp += keyWords[i].replace(/([\[\]\(\)\+\/\*\?])/g, '\\$1');    // making the word regex proof

                if(/[a-z]$/i.test(keyWords[i])) // finish with latin alphabet
                    newRegExp += '\\b';

                newRegExp += '|';
                if(/^[a-z]/i.test(keyWords[i])) // begin with latin alphabet
                    newRegExp += '\\b';

                newRegExp += keyWords[i].format().replace(/([\[\]\(\)\+\/\*\?])/g, '\\$1');    // making the word regex proof

                if(/[a-z]$/i.test(keyWords[i])) // finish with latin alphabet
                    newRegExp += '\\b';

            }

            return new RegExp(newRegExp, 'gi');
            // }}}
        }
        
        /**
         * initialize the google places field
         */
        function initAutocomplete() 
        {
            // {{{
            //
            // avoids to trigger the page reload on enter
            //
            $('#googleField').on('keydown', function(e){if(e.keyCode===13) e.preventDefault()});

            googleField = new google.maps.places.Autocomplete($('#googleField')[0],
                                  {types: ['establishment', 'geocode']});

            googleField.setFields(['address_components',
                       'geometry', 
                       'types', 
                       'name']);

            googleField.addListener('place_changed', fillInAddress);
            // }}}
        }
        
        /**
         * Callback, listen to google places field
         */
        function fillInAddress()
        {
            // {{{
            var place = googleField.getPlace();

            $('#googleField').addClass('kwAdd');
            let kw = $('#googleField').val().split(/, ?/)[0]

            if(lastSel[0])
            {
                let start = $(lastSel[1].startContainer).parents('mark.TANKeyWord');
                let end = $(lastSel[1].endContainer).parents('mark.TANKeyWord');

                lastSel[1].deleteContents();
                lastSel[1].insertNode(document.createTextNode(' '+kw+' '));

                start.replaceWith(function() { return this.innerHTML });
                end.replaceWith(function() { return this.innerHTML });
            }

            if(  !addedKeyWords.map(v=>v[0].format()).contains(kw.format())
              && (  !kw.match(keyWordsRegExp)
                 || kw.match(keyWordsRegExp)[0] !== kw ))    // kw not present in predefined keywords
                addedKeyWords.push([kw, googlePlaceFormat(place).searchText]);

            if(addedKeyWords.length)
                $('#newKWs').html('<br/>Your keywords:<br/> '+addedKeyWords.map(v=>'<span class=newKW>'+v[0]+'</span>').join(' '));


            $('span.newKW').click(function() {
                let kw = this.innerHTML;

                addedKeyWords = addedKeyWords.filter(v=>v[0] !== kw);
                $('.TANKeyWord').each(function() {
                    if(kw.format() === this.innerText.format())
                        $(this).replaceWith(this.innerHTML);
                });
                $(this).remove();
            });


            $("#travel_editor").tan_highlightKeywords(createNewRegexp(keyWordsRegExp, addedKeyWords.map(v=>v[0])));
            // }}}
        }

        //
        // setting up the listeners
        //

        $('div#navMenu_buttonOnOff').click(function(){
            tan_activateKeyWord();
        });

        $('div[aria-label="TravelAdsNetwork Manual"]').click(function() {
            // {{{
            if($('#travelads_sectionid').css('display') === 'none')
            {
                setTimeout(function() {
                    $('html, body').animate({
                        scrollTop: $('#travelads_sectionid').offset().top - 100
                    }, 500);
                }, 300);
            }
            // }}}
        });

        $('#navMenu_merchantSelect').change(function() {
            $('.TANKeyWord.current').attr('data-adv', $(this).find('option:selected').val())
            tan_activateKeyWord(undefined, true);
        });

        $('#navMenuprevWord').click(function() {
            tan_changeFocus(currentFocus-1);
        });
        $('#navMenunextWord').click(function() {
            tan_changeFocus(currentFocus+1);
        });

        $('#publish').click(function() {
            copy_travel2wp();
        });

        
        let stop=setInterval(function() {
            // {{{
            if(!(window.tinyMCE || window.tinymce).editors)
                return;

            clearInterval(stop);

            $('#travelads_sectionid').on('mouseenter', function() {
                if(!travelFocused)
                {
                    travelFocused = true;
                    copy_wp2travel();
                }

                let editors = ['#content', '.editor-writing-flow']
                          .concat([...(window.tinyMCE || window.tinymce).editors]
                              .map(v=>(!!v.container && '#'+v.container.getAttribute('id') || '')))
                          .filter(v=>!!v)
                          .join(', ');

                $(editors).each(function() {
                    this.onmouseenter = function() {
                        if(travelFocused)
                            copy_travel2wp();
                        travelFocused = false;
                    };
                });
            });

            let content = getWpEditorContent();
            
            var parser = new DOMParser();
            data = parser.parseFromString('<html>'+content.replace(/&nbsp;/g, '<br/>')+'</html>', "text/xml");
            
            [...data.getElementsByClassName('TAN_link_custom')].forEach(function(elem) {
                let flag=-2;
                addedKeyWords.forEach(function([kw], index) {
                    if(kw.format() === elem.innerHTML.format())
                        if(kw.format() !== kw)
                            flag = index;
                        else
                            flag = -1;
                });
                
                switch(flag)
                {
                    case -2:
                        addedKeyWords.push([elem.innerHTML, elem.getAttribute('data-search')]);
                        break;
                    case -1:
                        break;
                    default:
                        addedKeyWords[flag] = [elem.innerHTML, elem.getAttribute('data-search')];
                }
            });

            if(addedKeyWords.length)
                $('#newKWs').html('<br/>Your keywords:<br/> '+addedKeyWords.map(v=>'<span class=newKW>'+v[0]+'</span>').join(', '));
            // }}}
        }, 500);

        
        let ctrlDown = false;
        let shiftDown = false;
        let lastSel = [];
        
        /**
         * Fast mode, allow to go through the keywords 
         * with the keyboard, much faster than the mouse
         */
        $('#navMenu_keyWord').on('keydown', function(e) {
            // {{{
            let code = e.keyCode;
            let sel = $("#navMenu_merchantSelect");
            switch(code)
            {
                case 39:     // right
                    tan_changeFocus(currentFocus+1);
                    break;
                case 37: 
                    tan_changeFocus(currentFocus-1); 
                    break;    // left
                case 38:    // up
                    sel.val((sel.find(':selected').prev('option')[0] || sel.find('option:last-child')[0]).value);
                    sel.trigger('change');
                    break;    
                case 40:     // down
                    sel.val((sel.find(':selected + option')[0] || sel.find('option:first-child')[0]).value);
                    sel.trigger('change');
                    break;
                case 32: tan_activateKeyWord(ctrlDown?-1:shiftDown?-2:currentFocus); break;             // space
                case 13: tan_activateKeyWord(ctrlDown?-1:shiftDown?-2:currentFocus); break;             // enter

                case 17: ctrlDown=true; break;
                case 16: shiftDown=true; break;
            }

            e.preventDefault();
            // }}}
        })
        $('#navMenu_keyWord').on('keyup', function(e) {
            // {{{
            if(e.keyCode === 17)
                ctrlDown=false;
            if(e.keyCode === 16)
                shiftDown=false;
            // }}}
        });

        $('#travel_editor, #navMenu tr:last-child').on('mouseup', function(e) {
            // {{{
            setTimeout(function() {
                if(  !$(e.target).is("#navMenu_merchantSelect")
                  && !getSelectionHtml()[0]
                  && !$('#googleField').is(':focus'))
                    $('#navMenu_keyWord')[0].focus();
            }, 100);
            // }}}
        })

        $('#travel_editor').on('mouseup', function(e) {
            // {{{
            let sel = getSelectionHtml();
            if(!sel[0])
                return;

            lastSel = sel;
            $(lastSel[1]).parents('mark.TANKeyWord').replaceWith(function() {
                return this.innerHTML;
            })
            sel = sel[0];

            $('#googleField').val(sel.replace(/<[^>]*>/g, ''));
            $('#googleField')[0].focus();
            // }}}
        });

        document.addEventListener('scroll', function (e) {
            // {{{
            
            let topOffset = $('#wpadminbar').height() + 
                            (window.editorName==='gutenberg'?$('.edit-post-header').outerHeight():0) + 
                            ((tmp=$('.components-notice')).length?[...tmp].reduce((a,v)=>a+$(v).outerHeight(),0):0),
                diff = $(window).scrollTop() - $('#travelads_sectionid .inside').offset().top + topOffset;

            if(diff >= 0)
            {
                $('#navMenu').toggleClass('flying', true);

                $('#navMenu').css({
                    position: 'fixed',
                    left: $('#travelads_sectionid').offset().left,
                    top: topOffset,

                    width: $('#travelads_sectionid').width()+2,
                });

                $('.pac-container.pac-logo').css({
                    top:      $('#googleField').offset().top + $('#googleField').height() + 8,
                });

            }
            else
            {
                $('#navMenu').toggleClass('flying', false);
                $('#navMenu').css({
                    position: '',
                    left: '',
                    top: '',
                    width: ''
                });
            }
            // }}}
        }, true);
        
        initAutocomplete();


        //
        // creation of the Regex (list of keywords) and initializations
        //
        data=keyWords;
        var to_replace = '';
        for(var i=0 ; i<data.length ; i++)
            to_replace += '\\b'+data[i]+'\\b|';

        to_replace = to_replace.slice(0, -1);

        keyWordsRegExp = new RegExp(to_replace, 'gi')


        //
        // Open the dialog by default
        //
        setTimeout(function() {
            $('#travelads_sectionid.closed button').click();
        }, 2000);

        // }}}
    });
}(jQuery);
