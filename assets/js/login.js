!function($) {
	function checkCreds(user, pass)
	{
		$.ajax({
			type: 'POST',
			url: 'https://traveladsnetwork.com/api-remote-login/?method=checkCredentials',
			data: {
				username: user,
				password: pass
			},
			success: function(response){
				if(response.status == 'success')
				{
					document.cookie = "TAN_login="+response.data.new_cookie+"; path=/";
					document.cookie = "TAN_hoID="+response.data.affiliate_id+"; path=/";
					document.cookie = "TAN_username="+$('input[name=username]').val()+"; path=/";
					location.reload();
				}
			},
			error: function(data){
				data=data.responseJSON;

				$('input[name=username], input[name=password]').addClass('animateWrongCreds');
				$('#wrongCreds .control').text(data.message);
				setTimeout(function() {
					$('input[name=username], input[name=password]').removeClass('animateWrongCreds');
				}, 300*3);
				$('#wrongCreds').toggle(true);
			}
		});
	}

	$(document).ready(function() {
		$('#checkLog').on("click", function(e){
			e.preventDefault();
			
			checkCreds($('input[name=username]').val(), $('input[name=password]').val());
		});
		$('#login_window input').on("keydown", function(e){
			if(e.keyCode === 13) //enter
			{
				e.preventDefault();
				
				checkCreds($('input[name=username]').val(), $('input[name=password]').val());
			}
		});
	});
}(jQuery);
