var perms = require('./test.fixture');
var locks = require('./locks');
var db = require('knex')({client: 'postgresql'});
var _ = require('lodash');
var assert = require('assert');


var blogLocks = locks(db, 'blog', perms.accessControls);

var blogFixture = {
	id: 'test-blog',
	blogType: 'Investigation',
	blogStatus: 'draft',
	createdBy: 'not-test-user',
	section: 'global',
	owner: 'test-owner',
	privilegedBlog: true,
	restricted: true,
	userBlacklist: ['some-user', 'some-other-user']
};

describe('seneca-perm BC: acl locks', function() {
	var any, filter;

	before(function(done) {
		blogLocks(blogFixture, _storeLocks);

		function _storeLocks(err, locks) {
			any = _.partial(_.any, locks);
			filter = _.partial(_.filter, locks);
			done();
		}
	});

	it('exposes section lock', function() {
		assert.ok(any({
			lock: 'section',
			key: 'section=global',
			read: true,
			write: true
		}));
	});

	it('exposes investigation_blogs lock', function() {
		assert.ok(any({
			lock: 'investigation_blogs',
			key: 'role=investigation_blogs',
			read: true,
			write: true
		}));
	});

	it('exposes draft lock for createdBy user', function() {
		assert.ok(any({
			lock: 'draft',
			key: 'user=not-test-user',
			read: true,
			write: true
		}));
	});

	it('exposes role locks', function() {
		assert.ok(any({
			lock: 'role',
			key: 'role=editor',
			read: true,
			write: true
		}));
	});

	it('exposes single values on entity fields', function() {
		assert.equal(filter({ lock: 'section' }).length, 1);
	});

	it('exposes each value in an array on entity fields', function() {
		assert.equal(filter({ lock: 'manual_blacklist' }).length, 2);
	});
});

