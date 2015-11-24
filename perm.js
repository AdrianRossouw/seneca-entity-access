/**
* Backwards compatibility with seneca perm objects
*/
var keychain = require('./keychain');
var query = require('./query');
var locks = require('./locks');

module.exports = function(db, entity, perms) {

	return {
		keychain: keychain(db, entity, perms),
		locks: locks(db, entity, perms),
		query: query(db, entity, perms)
	};
};
