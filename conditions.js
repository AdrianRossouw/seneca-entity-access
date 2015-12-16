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

module.exports = function(entity, key, perms) {
	var listPerms = permProcess(entity, perms);

	// we only care about the first instance of each lock
	var locks = _(listPerms).chain()
		.groupBy('lock')
		.map(_.first)
		.map(_.partial(_.pick, _, 'lock', 'control', 'reject'))
		.value();

	// returns a subselect to match the query
	return function conditions(xpr) {

    var cnds = _.reduce(locks, handleSufficient,
      [xpr.and.apply(xpr, addRequired())]);

    return xpr.or.apply(xpr, cnds);

    function handleSufficient(m, v, k) {
      if (v.control === 'sufficient') {
        var cnds = addRequired(k);
        cnds.push(v.reject ? xpr.not(v.lock) : v.lock);
        m.push(xpr.and.apply(xpr, cnds));
      }

      return m;
    }

		function addRequired(upTo) {
			if (upTo === 0) { return []; }

			var conditions = _(locks).chain()
			  .take((upTo || locks.length) + 1)
				.reject({ control: 'sufficient' })
				.value();

      return _.map(conditions, function (v) {
        return v.reject ? xpr.not(v.lock) : v.lock;
			});
		}

  };
};
