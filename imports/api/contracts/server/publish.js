import { Meteor } from 'meteor/meteor'
import { Contracts } from '../contracts'

Meteor.publish('contracts.list', function () {
	return Contracts.find({ userID: this.userId })
})
