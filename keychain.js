/**
* @file seneca-perm backwards compatibility layer.
*
* This module will read in a valid seneca-perms options object, and
* return the 'keychain' implementationthat the acl api will expect.
*
* It does so by :
*
*   - pre-processing the original structure
*   - emitting an 'all' key used in certain scenarios.
*   - emitting keys for all roles the user has, and the permissions match on. 
*   - emitting keys for all conditions that have user properties
*/

var _ = require('lodash');
var permProcess = require('./process');

module.exports = function(db, entity, perms) {
	var listPerms = permProcess(entity, perms);

	return function keychain(user, done) {
		var roleKeys = _(listPerms).chain()
			.pluck('roles')
			.flatten()
			.compact()
			.intersection(_.get(user, 'perm$.roles', []))
			.map(_prefix('role='))
			.value();

		var conditionKeys = _(listPerms).chain()
			.filter({userArgs: true})
			.pluck('user')
			.map(_.pairs)
			.flatten()
			.reduce(_userConditions, [])
			.uniq()
			.value();

		var keys = ['all']
			.concat(roleKeys)
			.concat(conditionKeys);

		done(null, keys);

		function _userConditions(keys, v) {
			var key = v[1];

			if (key === 'user') {
				keys.push('user='+user.id);
			} else {
				var entVal = _.flatten([user[key]]);

				_.each(entVal, function(val) {
					val && keys.push(key+'='+val);
				});
			}
			return keys;
		}
	};
};

function _prefix(t) {
	return function(v) { return t+v; };
}
