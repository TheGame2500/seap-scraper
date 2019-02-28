import { Meteor } from 'meteor/meteor';
import '../imports/api/authorities/methods'
import '../imports/api/companies/methods'
import '../imports/api/contracts/methods'
import '../imports/api/CPVs/methods'

import '../imports/api/contracts/server/publish'

Meteor.startup(() => {
	// code to run on server at startup
});
