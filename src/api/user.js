import crypto from 'pn/crypto';
import moment from 'moment-timezone';
import url from 'url';
import path from 'path';
import bcrypt from 'bcrypt';

/**
 * Represents a user in CR
 */
class User {
	constructor (id, email, enabled, password) {
		this.id = id;
		this.email = email;
		this.enabled = !!enabled;
		this.password = password;

		this.activationKey = null;
		this.activationKeyTime = null;
	}

	/**
	 * Creates a new user
	 * @param  {string} email The user's primary email address
	 * @return {User} The new user
	 */
	static async createUser (email) {
		// Generate activation key
		const activationKeyBytes = await crypto.randomBytes(CR.conf.activationKeySize);
		const activationKey = activationKeyBytes.toString('hex');

		const activationKeyTime = moment().unix();

		const stmt = CR.db.users.prepare("insert into users (email, activation_key, activation_key_time) values (?, ?, ?)");
		const info = stmt.run(email, activationKey, activationKeyTime);

		const user = new User(info.lastInsertRowId, email, true, null);
		user.activationKey = activationKey;
		user.activationKeyTime = activationKeyTime;
		return user;
	}

	/**
	 * Checks whether a primary email address is taken
	 * @param  {string}  email The email address to check
	 * @return {Boolean} Whether the primary email address is taken
	 */
	static isEmailTaken (email) {
		return CR.db.users.prepare("select 1 from users where email = ?").get(email) != undefined;
	}

	/**
	 * Gets the URL needed to activate the user's account
	 * @return {string} The account activation url
	 */
	getActivationURL () {
		return url.resolve(CR.conf.addressPrefix, path.join('alighi', this.email, this.activationKey));
	}

	/**
	 * Activates a user by setting their activation key to null and applying the provided prehashed password
	 * @param  {string} password The user's password, already hashed
	 */
	activate (password) {
		const stmt = CR.db.users.prepare("update users set password = ?, activation_key = NULL, activation_key_time = NULL where id = ?");
		stmt.run(password, this.id);
		this.activationKey = null;
		this.activationKeyTime = null;
		this.password = password;
	}

	/**
	 * Obtains the user with the provided id, returns null if no user was found
	 * @param  {number} id The user's id
	 * @return {User}      The user instance
	 */
	static getUserById (id) {
		const data = CR.db.users.prepare("select email, enabled, password, activation_key, activation_key_time from users where id = ?")
			.get(id);

		if (!data) {
			return null;
		}

		const user = new User(id, data.email, data.enabled, data.password);
		user.activationKey = data.activation_key;
		user.activationKeyTime = data.activation_key_time;
		return user;
	}

	/**
	 * Obtains the user with the provided email, returns null if no user was found
	 * @param  {string}    id The user's email
	 * @return {User|null}    The user instance
	 */
	static getUserByEmail (email) {
		const data = CR.db.users.prepare("select id, enabled, password, activation_key, activation_key_time from users where email = ?")
			.get(email);

		if (!data) {
			return null;
		}

		const user = new User(data.id, email, data.enabled, data.password);
		user.activationKey = data.activation_key;
		user.activationKeyTime = data.activation_key_time;
		return user;
	}

	/**
	 * Hashes a plaintext password using bcrypt
	 * @param  {string} plaintext The plaintext password
	 * @return {string}           The bcrypt hash
	 */
	static hashPassword (plaintext) {
		return bcrypt.hash(plaintext, CR.conf.bcryptSaltRounds);
	}

	/**
	 * Returns whether the user has completed inital setup
	 * @return {Boolean} Whether the user has completed initial setup
	 */
	hasCompletedInitialSetup () {
		const stmt = CR.db.users.prepare("select 1 from users_details where user_id = ?");
		const row = stmt.get(this.id);
		return !!row;
	}
}

export default User;
