import { HTTP } from 'meteor/http'
import { Meteor } from 'meteor/meteor'

Meteor.methods({
	'authorities.list': function (keyword) {
		const PUBLIC_AUTHORITY_LIST_URL = `${Meteor.settings.public.API_ROOT_URL}/api-pub/ComboPub/searchContractingAuthorities`

		const publicAuthorities = HTTP.get(PUBLIC_AUTHORITY_LIST_URL, {
			...Meteor.settings.DEFAULT_REQUEST_ARGS,
			params: {
				filter: keyword,
				pageIndex: 0,
				pageSize: 200,
			},
		})

		return publicAuthorities.data.items
	},
})
