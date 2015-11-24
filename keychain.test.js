var perms = require('./test.fixture');
var keychain = require('./keychain');
var db = require('knex')({ client: 'postgresql'});
var _ = require('lodash');
var assert = require('assert');

var blogKeys = keychain(db, 'blog', perms.accessControls);

var userFixture = {
	id: 'test-user',
	section: ['local', 'other'],
	perm$: {
		roles: [
			'restricted_if_assigned',
			'editor',
			'not-in-keychain'
		]
	}
};

describe('seneca-perm BC: acl keychain', function() {
	var include;

	before(function(done) {
		blogKeys(userFixture, _storeKeys);

		function _storeKeys(err, keys) {
			include = _.partial(_.include, keys);
			done();
		}
	});

	it('exposes user id as user=*', function() {
		assert.ok(include('user=test-user'));
	});

	it('exposes sections as section=*', function() {
		assert.ok(include('section=local'));
		assert.ok(include('section=other'));
	});

	it('only exposes roles needed by access controls', function() {
		assert.ok(include('role=editor'));
		assert.ok(include('role=restricted_if_assigned'));
		assert.ok(!include('role=not-in-keychain'));
	});
});
