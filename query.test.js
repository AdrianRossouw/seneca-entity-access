var perms = require('./test.fixture');
var query = require('./query');
var db = require('knex')({ 'client': 'postgresql' });
var assert = require('assert');

var blogQuery = query(db, 'blog', perms.accessControls);

var opts = {
	entity: 'blog',
	access: 'read',
	key: 'id',
	keychain: [
		'user=test-user'
	]
};

describe('seneca-perm BC: acl query', function() {
	var _result;

	before(function(done) {
		blogQuery(opts, function (err, result) {
			_result = result.toString()
			  .replace(/"(\w*)"."key" in \('user=test-user'\)/g, '$1')
			  .replace(/"(\w*)"."key" not in \('user=test-user'\)/g, 'not $1')
			  .replace(/.* and \((.*)\)$/g, '$1');
			done();
		});
	});

	it('first sufficient lock', function() {
		assert.ok(~_result.indexOf('(draft)'));
	});

	it('supports reject locks', function() {
		assert.ok(~_result.indexOf('not manual_blacklist'));
	});

	it('second sufficient lock', function() {
		assert.ok(~_result.indexOf('(role and not manual_blacklist and section)'));
	});

	it('directly following third sufficient lock', function() {
		assert.ok(~_result.indexOf('(role and not manual_blacklist and investigation_blogs)'));
	});

	it('all required/requisite locks', function() {
		assert.ok(~_result.indexOf('(role and not manual_blacklist and restricted_if_assigned)'));
	});
});
