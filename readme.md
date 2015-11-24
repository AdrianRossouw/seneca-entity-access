# seneca-perm backwards compatibility layer

The new entity-access layer provides a simpler way to resolve the same requirements
that the existing seneca-perm module currently handles.

But because you might already have a configured app, it might not be feasible to
re-develop the entire access control layer you have written.

This module will allow you to drive the new entity-access layer through
a mostly-unmodified 'seneca-perm' options object.

## Usage:

1. Create an `entities/foo/acl.js` file.
1. In this file:

```javascript
var db = require('../db');

var aclSeneca = require('seneca-entity-access/perm');
var perms = require('./config/options.permissions');

module.exports = aclSeneca(db, 'foo', perms.accessControls);
```
1. Load this file into the acl module in `entities/foo/index.js`

## options.permissions changes:

1. Go through each acl in the options.permissions file manually.
1. You only care about records that match all of these criteria :

	* Is the entity type you care about.
	* Has 'list' amongst it's actions.
	* Has control set to 'requisite', 'required' or 'sufficient'.

1. For each of these records, make the following changes :

	* Give the acl entry a 'lock' property with a simple identifier.
	* If the test has to be negative, add: `reject: true` to the object.
	  ie: users in manual blacklist are NOT allowed.
	* If the entry uses a fn condition, you will need to reimplement it.

## Re-implementing fn conditions
(see acl documentation)

#### TODO:

* use s-expression like syntax for the middlepoint between other engines.
* Support filtering of records at various places in the workflow.
* Set of seneca actions that allow/deny requests based on new acl.
