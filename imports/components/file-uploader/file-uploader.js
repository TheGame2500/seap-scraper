import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var'

import '../loader/loader.js'
import './file-uploader.html'

Template.fileUploader.onCreated(function () {
	this.loadingData = new ReactiveVar(false)
})

Template.fileUploader.helpers({
	loadingData() {
		return Template.instance().loadingData.get()
	},
})

Template.fileUploader.events({
	'click #upload': function (ev, instance) {
		const file = $('#upload-file')[0].files[0];
		if (!file) return;

		const xhr = new XMLHttpRequest();
		xhr.open('POST', '/uploadFile', true);

		xhr.upload.addEventListener('progress', (event) => {
			instance.loadingData.set({
				percent: `${((event.loaded / event.total) * 100).toFixed(2)}%`,
				class: event.loaded === event.total ? 'success' : 'warning',
				copy: event.loaded === event.total ? 'Done.' : 'Loading...',
				loaded: event.loaded,
				total: event.total,
			})
		}, false)

		xhr.onerror = function (error) {
			console.error('UPLOAD ERROR', error)
			instance.loadingData.set(false)
		}
		xhr.onload = function () {
			console.log('done')
			instance.loadingData.set(false)
		}

		xhr.send(file);
	},
})
