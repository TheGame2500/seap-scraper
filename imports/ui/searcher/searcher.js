import { Template } from 'meteor/templating';
import '../../components/search-form/search-form.js'
import '../../components/table/table.js'
import '../../components/loader/loader.js'
import '../../components/file-uploader/file-uploader.js'
import './searcher.html'

Template.searcher.onCreated(function () {
	this.subscribe('users.data')
})
