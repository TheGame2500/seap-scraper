import { Template } from 'meteor/templating';
import './file-uploader.html'

Template.fileUploader.events({
	'change #upload-file': function (event) {
		const file = event.target.files[0];
		if (!file) return;

		const xhr = new XMLHttpRequest();
		xhr.open('POST', '/uploadFile', true);
		xhr.onload = function () {
			console.log('done')
		}

		xhr.send(file);
	},
})
