const path = require('path')

const { imgFolder } = require('../config')
const { writeFile, removeFile } = require('../utils/fs')

module.exports = class Img {
	constructor(id, mimetype, size, createdAt) {
		this.id = id
		this.mimetype = mimetype
		this.size = size
		this.createdAt = createdAt || Date.now()
	}

	// async saveOriginal(content) {
	// 	await writeFile(path.resolve(imgFolder, this.originalFilename), content)
	// }

	async removeOriginal() {
		await removeFile(path.resolve(imgFolder, `${this.id}_original.${this.mimetype}`))
	}

	toPublicJSON() {
		return {
			id: this.id,
			size: this.size,
			createdAt: this.createdAt,
		}
	}

	toJSON() {
		return {
			id: this.id,
			mimetype: this.mimetype,
			size: this.size,
			createdAt: this.createdAt,
		}
	}
}
