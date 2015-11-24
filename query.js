/**
* @file seneca-perm backwards compatibility layer.
*
* This module will read in a valid seneca-perms options object, and
* return the 'locks' that the acl api will expect.
*
* It does so by :
*
*   - pre-processing the original structure into something that
*   - finding only the first instance of each lock (subsequent are ignored)
*   - iterate through the locks and generate sql conditions for each of them.
*   - if the lock is sufficient, it passes when itself and all of the previous
*     required/requisite locks pass.
*   - After all sufficient locks are processed, a condition is added for
*     all required/requisite locks to pass.
*   - If a lock has a 'reject' property, the condition will match the negative.
*/

var _ = require('lodash');
var permProcess = require('./process');

module.exports = function(db, entity, perms) {
	var listPerms = permProcess(entity, perms);

	// we only care about the first instance of each lock
	var locks = _(listPerms).chain()
		.groupBy('lock')
		.map(_.first)
		.map(_.partial(_.pick, _, 'lock', 'control', 'reject'))
		.value();

	// returns a subselect to match the query
	return function query(opts, done) {

		// The first table needs to be selected, not joined.
		var firstLock = _.first(locks).lock;

		var knex = db('acl as ' + firstLock).select(firstLock + '.entity_id');

		// join all the needed tables
		_.each(locks, addJoins(knex));

		// match the needed conditions
		knex.where(function() {
			var knex = this;
			_.each(locks, function(v, k) {
				// we only care for sufficient. required/requisite are handled differently.
				if (v.control === 'sufficient') {
					knex.orWhere(function() {
						// each sufficient needs to match all preceding required/requisites too.
						addRequired(this, k);

						if (v.reject) {
							this.whereNotIn(v.lock + '.key', opts.keychain);
						} else {
							this.whereIn(v.lock + '.key', opts.keychain);
						}
					});
				}
			});

			// finally, add all the required/requisite in their own condition.
			knex.orWhere(function() {
				addRequired(this);
			});
		});

		return done(null, knex);

		function addJoins(knex) {
			return function(v, k) {
				var lock = v.lock;

				// first table is already selected from
				k && knex.leftJoin(
					'acl as ' + lock,
					lock + '.entity_id',
					firstLock+'.entity_id'
				);

				var join = {};
				join[lock + '.entity'] = opts.entity;
				join[lock + '.lock'] = lock;
				join[lock + '.'+ opts.access] = true;

				knex.where(join);
			};
		}

		function addRequired(knex, upTo) {
			if (upTo === 0) { return null; }

			var conditions = _(locks).chain()
			    .take((upTo || locks.length) + 1)
				.reject({ control: 'sufficient' })
				.value();

			_.each(conditions, function (v) {
				if (v.reject) {
					knex.whereNotIn(v.lock + '.key', opts.keychain);
				} else {
					knex.whereIn(v.lock + '.key', opts.keychain);
				}
			});
		}

	};
};
