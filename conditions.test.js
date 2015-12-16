var perms = require('./test.fixture');
var conditions = require('./conditions');
var toString = require('entity-access/logic/string');
var assert = require('assert');

var opts = {
	entity: 'blog',
	access: 'read',
	key: 'id',
	keychain: [
		'user=test-user'
	]
};

var _result = toString(opts, conditions('blog', 'id', perms.accessControls))();

describe('seneca-perm BC: acl conditions', function() {

	it('first sufficient lock', function() {
		assert.ok(~_result.indexOf("'draft'"));
	});

	it('supports reject locks', function() {
		assert.ok(~_result.indexOf("xpr.not('manual_blacklist')"));
	});

	it('second sufficient lock', function() {
		assert.ok(~_result.indexOf("xpr.and('role', xpr.not('manual_blacklist'), 'section')"));
	});

	it('directly following third sufficient lock', function() {
		assert.ok(~_result.indexOf("xpr.and('role', xpr.not('manual_blacklist'), 'investigation_blogs')"));
	});

	it('all required/requisite locks', function() {
		assert.ok(~_result.indexOf("xpr.and('role', xpr.not('manual_blacklist'), 'restricted_if_assigned')"));
	});
});
