const path = require('path')

const dbFolder = path.resolve(__dirname, '../../db/')
const imgFolder = path.resolve(dbFolder, 'imgs')

module.exports = {
	PORT: 8080,

	path,
	dbFolder,
	imgFolder,
}
