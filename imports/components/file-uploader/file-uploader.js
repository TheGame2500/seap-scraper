import { Template } from 'meteor/templating';
import './file-uploader.html'

Template.fileUploader.events({
	'click #upload': function (event) {
		const file = $('#upload-file')[0].files[0];
		if (!file) return;

		const xhr = new XMLHttpRequest();
		xhr.open('POST', '/uploadFile', true);
		xhr.onload = function () {
			console.log('done')
		}

		xhr.send(file);
	},
})
