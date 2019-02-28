import { Meteor } from 'meteor/meteor'

Meteor.publish('users.data', function () {
	return Meteor.users.find(this.userId, { fields: {
		isAdmin: 1,
	} })
})
