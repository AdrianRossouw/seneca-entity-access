
module.exports = {

	accessControls: [

		{
			name: 'View, Read, Write on blogs user created and in draft status',
			lock: 'draft',
			roles: ['editor'],
			entities: [{
				zone: undefined,
				base: 'sys',
				name: 'blog'
			}],
			control: 'sufficient',
			actions: ['load', 'list', 'save_new', 'save_existing'],
			conditions: [{
				attributes: {
					'blogStatus': 'draft',
					'createdBy': '{user.id}'
				}
			}]
		},

		{
			name: 'access to blogs',
			lock: 'role',
			roles: ['editor'],
			entities: [{
				zone: undefined,
				base: 'sys',
				name: 'blog'
			}],
			control: 'required',
			actions: ['load', 'list', 'save_new', 'save_existing'],
			conditions: []
		},

		{
			name: 'manual_blacklist',
			roles: ['editor'],
			entities: [{
				zone: undefined,
				base: 'sys',
				name: 'blog'
			}],
			hard: true,
			reject: true,
			control: 'requisite',
			actions: ['load', 'list', 'save_new', 'save_existing'],
			conditions: [{
				attributes: {
					'userBlacklist': '{!user.id}'
				}
			}]
		},
		{
			name: 'Only View, Read, Write blogs in the same section',
			lock: 'section',
			roles: ['editor'],
			entities: [{
				zone: undefined,
				base: 'sys',
				name: 'blog'
			}],
			control: 'sufficient',
			actions: ['load', 'list', 'save_new', 'save_existing'],
			conditions: [{
				attributes: {
					'section': '{user.section}'
				}
			}]
		},

		// for fact checking? 
		{
			name: 'Access Investigation blogs',
			lock: 'investigation_blogs',
			roles: ['investigation_blogs'],
			entities: [{
				zone: undefined,
				base: 'sys',
				name: 'blog'
			}],
			hard: true,
			control: 'sufficient',
			actions: ['load', 'list', 'save_existing'],
			conditions: [{
				attributes: {
					'blogType': 'Investigation'
				}
			}]
		},
		{
			name: 'access to restricted blogs if assigned',
			lock: 'restricted_if_assigned',
			roles: ['restricted_if_assigned'],
			entities: [{
				zone: undefined,
				base: 'sys',
				name: 'blog'
			}],
			control: 'requisite',
			hard: true,

			actions: ['load', 'list', 'save_existing'],
			conditions: [{
				attributes: {
					'owner': '{user.id}',
					'restricted': true
				}
			}
			]
		},
	]
};
