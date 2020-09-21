const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const Users = new Schema({
	appname: { type: String, unique: true, required: true},
	username: { type: String, required: true},
	email: String,
	permissions: { type: String, default: '*' },
});

var options = {
	usernameUnique: true,
	saltlen: 12,
	keylen: 24,
	iterations: 901,
	encoding: 'base64'
};

Users.plugin(passportLocalMongoose,options);
Users.set('toObject', {getters: true});
Users.set('toJSON', {getters: true});

module.exports = mongoose.model('Users',Users);