const { EventEmitter } = require('events')
const { existsSync } = require('fs')
const { dbDumpFile } = require('../config')
const { writeFile } = require('../utils/fs')
const { prettifyJsonToString } = require('../utils/prettifyJsonToString')
const Img = require('./Img')

class Database extends EventEmitter {
	constructor() {
		super()

		this.idToImg = {}
	}

	async initFromDump() {
		if (existsSync(dbDumpFile) === false) {
			return
		}

		const dump = require(dbDumpFile)

		if (typeof dump.idToImg === 'object') {
			this.idToImg = {}

			for (let id in dump.idToImg) {
				const img = dump.idToImg[id]

				this.idToImg[id] = new Img(img.id, img.mimetype, img.size, img.createdAt)
			}
		}
	}

	async insert(img) {
		//    await img.saveOriginal(originalContent);

		this.idToImg[img.id] = img

		this.emit('changed')
	}

	async remove(imgId) {
		const imgRaw = this.idToImg[imgId]

		const img = new Img(imgRaw.id, imgRaw.mimetype, imgRaw.size, imgRaw.createdAt)

		await img.removeOriginal()

		delete this.idToImg[imgId]

		this.emit('changed')

		return imgId
	}

	findOne(imgId) {
		const imgRaw = this.idToImg[imgId]

		if (!imgRaw) {
			return null
		}

		const img = new Img(imgRaw.id, imgRaw.mimetype, imgRaw.size, imgRaw.createdAt)

		return img
	}

	find() {
		let allImgs = Object.values(this.idToImg)

		allImgs.sort((imgA, imgB) => imgB.createdAt - imgA.createdAt)

		return allImgs
	}

	toJSON() {
		return {
			idToImg: this.idToImg,
		}
	}
}

const db = new Database()

db.initFromDump()

db.on('changed', () => {
	writeFile(dbDumpFile, prettifyJsonToString(db.toJSON()))
})

module.exports = db
