var _ = require('lodash');

module.exports = function(entity, perms) {
	var matchRegex = /\{.?user\.(.*)\}/;
	var inheritRegex = /\{sys\/(.*)::(.*)\}/;

	var listPerms = _.filter(perms, _filterList);

	return _.reduce(listPerms, _patternKeys, []);

	// turn perm object into a flattened set of props to match for.
	function _patternKeys(patterns, perm) {
		// we can't support function conditions
		if (_.get(perm, 'conditions.fn')) {
			return {conditions:'fn'};
		}

		var pattern = {
			control: perm.control,
			reject: perm.reject || false,
			user: {},
			entity: {},
			inherit: false
		};

		pattern.lock = perm.lock;

		if (!pattern.lock) {
			console.warn('WARNING: no perm.lock, falling back to perm.name for : ', perm.name);
			pattern.lock = perm.name;
		}

		var conditions = _.get(perm, 'conditions[0]', {});
		var attributes = _.get(conditions, 'attributes', false);

		if (_.isString(conditions)) {
			var matches = inheritRegex.exec(conditions);
			pattern.inherit = {
				entity: matches[1],
				key: matches[2]
			};
		} else if (attributes) {
			// partition attributes between those that match {user.*}
			// and those that don't.
			var split = _(attributes).chain()
				.pairs()
				.partition(_partition)
				.map(_.partial(_.object, _, null))
				.value();

			pattern.entity = _.get(split, '[1]', {});

			pattern.user = _(split).chain()
				.get('[0]', {})
				.reduce(_reduceUserProps, {})
				.value();
		}

		pattern.entityArgs = !!_.size(pattern.entity);
		pattern.userArgs = !!_.size(pattern.user);
		pattern.roles = perm.roles;

		pattern.read = _permRead(perm);
		pattern.write = _permWrite(perm);

        pattern.perm$ = perm;

        if (!pattern.inherit) {
          patterns.push(pattern);
        }
        return patterns;
    }

	function _partition(v) {
		return matchRegex.test(v[1]);
	}

	function _reduceUserProps(m, v, k) {
		var match = matchRegex.exec(v);

		if (match && match[1]) {
			m[k] = (match[1] === 'id') ? 'user' : match[1];
		}

		return m;
	}

	function _filterList(p) {
		var rightEntity = _.find(p.entities, { name: entity	});
		var hasList = _.include(p.actions, 'list');
		var controlList = ['required', 'requisite', 'sufficient'];
		var validControl = _.include(controlList, p.control);

		return hasList && rightEntity && validControl;
	}

	function _permRead(perm) {
		var canList = _.include(perm.actions, 'list');
		var canLoad = _.include(perm.actions, 'load');
		return canLoad || canList;
	}

	function _permWrite(perm) {
		var canSaveNew = _.include(perm.actions, 'save_new');
		var canSaveExisting = _.include(perm.actions, 'save_existing');

		return canSaveExisting || canSaveNew;
	}
};
