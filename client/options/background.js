/*
 * Background controller. Wallpapers, proper fitting and video backgrounds
 */

var Backbone = require('backbone');

// TODO: write it
module.exports = new Backbone.View({
	el: document.getElementById('user_bg'),
	model: new Backbone.Model({
		id: 'background'
	}),
	set: function(toggle) {
		if (localStorage.userBG && toggle){
			var image = localStorage.userBG;
			$('body').append($('<img />', {
				id: 'user_bg',
				src: image
			}));
			// Append blurred BG, if theme is glass
			//append_glass(); some day
		}
		else {
			$('#user_bg').remove();
			$('#blurred').remove();
		}
	},
	glass: function() {

	},
	genCustom: function(file) {
		if (file){
			// Read image from disk
			var reader = new FileReader();
			reader.onload = function(event){
				var img = new Image();
				img.onload = function(){
					// Prevent memory leaks
					$(this).remove();
					localStorage.userBG = img.src;
					// Add Glass Effects Here				
				};
				img.src = event.file.result;
			};
			reader.readAsDataURL(file.files[0]);
		}
	}
});
