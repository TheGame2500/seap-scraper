import { Meteor } from 'meteor/meteor';
import '../imports/api/authorities/methods'
import '../imports/api/companies/methods'
import '../imports/api/contracts/methods'
import '../imports/api/CPVs/methods'
import '../imports/api/fileUploads/server/fileUploads'

import '../imports/api/contracts/server/publish'
import '../imports/api/users/server/publish'

Meteor.startup(() => {
	// code to run on server at startup
});
