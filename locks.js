/**
* @file seneca-perm backwards compatibility layer.
*
* This module will read in a valid seneca-perms options object, and
* return the 'locks' that the acl api will expect.
*
* It does so by :
*
*   - pre-processing the original structure into something that
*   - setting up a series of patterns to match against
*   - iterate through the processed perms
*   - the return the output of the matched functions for each of them.
*/

var patrun = require('patrun');
var _ = require('lodash');
var permProcess = require('./process');

module.exports = function(db, entity, perms) {

	var listPerms = permProcess(entity, perms);
	var patterns = patrun();

	/**
	* Locks that evaluate user and entity properties.
	*/
	patterns.add(
		{ userArgs:true, entityArgs:true },
		function lockEntityUser(ent, perm) {
			var locks = [];

			var pair = _.pairs(perm.user)[0];

			var userPropName = pair[1];
			var entPropVal = _.flatten([ent[pair[0]]]);

			if (_.isMatch(ent, perm.entity)) {
				_.each(entPropVal, function(val) {
					locks.push({
						lock: perm.lock,
						key: userPropName+'='+val,
						read: perm.read,
						write: perm.write
					});
				});
			}
			return locks;
		}
	);

	/**
	* Locks that only evaluate a user property
	*
	* These locks will provide requirements that the user object
	* needs to meet to be able to open it.
	*/
	patterns.add({ userArgs:true }, function _lockUser(ent, perm) {
		var locks = [];

		var pair = _.pairs(perm.user)[0];

		var userPropName = pair[1];
		var entPropVal = _.flatten([ent[pair[0]]]);

		_.each(entPropVal, function(val) {
			if (!val) { return null; }
			// Only a user property is involved int his lock
			locks.push({
				lock: perm.lock,
				key: userPropName+'='+val,
				read: perm.read,
				write: perm.write
			});
		});
		return locks;
	});

	/**
	* Locks that only evaluate an entity property
	*
	* If this entity does not have or match this property, we
	* will emit an 'all' key that will allow users to open this
	* lock.
	*/
	patterns.add({entityArgs:true}, function _lockEntity(ent, perm) {
		var locks = [];
		if (_.isMatch(ent, perm.entity)) {
			locks.push({
				lock: perm.lock,
				key: 'role=' + perm.roles[0],
				read: perm.read,
				write: perm.write
			});
		} else {
			locks.push({
				lock: perm.lock,
				key: 'all',
				read: perm.read,
				write: perm.write
			});
		}
		return locks;
	});

	/**
	* Locks that have no conditions.
	*
	* This implies that the lock only cares about the correct user roles.
	*/
	patterns.add({}, function _lockRole(ent, perm) {
		var locks = [];
		locks.push({
			lock: perm.lock,
			key: 'role=' + perm.roles[0],
			read: perm.read,
			write: perm.write
		});

		return locks;
	});

	// Return 'locks' implementation for ACL library.
	return function locks(entity, done) {
		done(null,  _.reduce(listPerms, _reduceLocks, []));

		function _reduceLocks(locks, perm) {
			var matchFn = patterns.find(perm);

			if (matchFn) {
				var fnLocks = matchFn(entity, perm) || [];
				locks = locks.concat(fnLocks);
			}
			return locks;
		}
	};
};
