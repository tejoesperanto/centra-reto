class User {
	constructor ({
		data = {}
	}) {
		this.data = Object.assign({
			id: undefined
		}, data);
	}

	static async createUser (email) {
		// TODO: Create the user
	}
}

export default User;
