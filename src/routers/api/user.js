import express from 'express';

export default function () {
	const router = express.Router();

	router.post('/activate', activateUser);

	return router;
}

function activateUser (req, res, next) {
	res.send('Test');
}
