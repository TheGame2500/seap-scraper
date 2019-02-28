import { HTTP } from 'meteor/http'
import { Meteor } from 'meteor/meteor'

Meteor.methods({
	'companies.list': function (keyword) {
		if (!this.userId) return;
		const COMPANY_LIST_URL = `${Meteor.settings.public.API_ROOT_URL}/api-pub/ComboPub/searchSuppliers`

		const companies = HTTP.get(COMPANY_LIST_URL, {
			...Meteor.settings.DEFAULT_REQUEST_ARGS,
			params: {
				filter: keyword,
				pageIndex: 0,
				pageSize: 200,
			},
		})

		return companies.data.items
	},
})
