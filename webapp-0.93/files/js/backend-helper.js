

function setObjectPermissions(target, action, principalId, permissions) {

	if (Structr.isAllowed(Structr.me, target, 'accessControl')) {

		if (target != null) {

			if (principalId === "visibleToAuthenticatedUsers") {
				
				target.visibleToAuthenticatedUsers = (action === 'add');

			} else {

				var principal = Structr.find('AbstractNode', principalId);
				if (principal != null) {

					if (action === 'add') {

						Structr.grant(principal, target, permissions);

					} else if (action === 'remove') {

						Structr.revoke(principal, target, permissions);

					} else {

						Structr.log('Unknown action ' + action + ', dont know what to do with ' + targetId);
					}

				} else {

					Structr.log('Cannot set permissions, principal with ID ' + principalId + ' not found.');
				}
			}
			
		} else {

			Structr.log('Cannot set permissions, target not found.');
		}

	} else {

		Structr.log('Access control not allowed on ' + target.id + ', ignoring..');
	}
}