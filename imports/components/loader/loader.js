import { Template } from 'meteor/templating'
import './loader.html'

Template.loader.helpers({
	error() {
		const user = Meteor.user()
		return user.profile && user.profile.loading && user.profile.loading.error
	},
	loadingData() {
		const user = Meteor.user()
		const loadingData = user.profile && user.profile.loading
		if (!loadingData) return;
		const { totalFetches, fetchesDone } = loadingData
		return {
			percent: `${((fetchesDone / totalFetches) * 100).toFixed(2)}%`,
			class: fetchesDone === totalFetches ? 'success' : 'warning',
			copy: fetchesDone === totalFetches ? 'Done.' : 'Loading...',
		}
	},
})
