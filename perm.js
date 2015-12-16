/**
* Backwards compatibility with seneca perm objects
*/
var keychain = require('./keychain');
var conditions = require('./conditions');
var locks = require('./locks');

module.exports = function(db, entity, perms) {

	return {
		keychain: keychain(db, entity, perms),
		locks: locks(db, entity, perms),
		conditions: conditions(db, entity, perms)
	};
};
