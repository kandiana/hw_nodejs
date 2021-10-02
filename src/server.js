const path = require('path')
const fs = require('fs')

const express = require('express')
const { PORT, imgFolder } = require('./config')
const db = require('./entities/Database')
const Img = require('./entities/Img')

const { nanoid } = require('nanoid')

const multer = require('multer')

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, imgFolder)
	},
	filename: function (req, file, cb) {
		cb(null, `${nanoid()}_original.${file.mimetype.split('/')[1]}`)
	},
})

const { replaceBackground } = require('backrem')

const upload = multer({ storage: storage })

const app = express()

app.use(express.json())

app.use('/files', express.static(imgFolder))

app.get('/ping', (req, res) => {
	return res.json({ ping: 'pong' })
})

app.get('/list', (req, res) => {
	const allImgs = db.find().map((img) => img.toPublicJSON())

	return res.json(allImgs)
})

app.get('/image/:id', (req, res) => {
	const imgId = req.params.id
	const img = db.findOne(imgId)
	if (!img) {
		return res.status(404).send('Not Found')
	}

	return res.download(path.resolve(imgFolder, `${img.id}_original.${img.mimetype.split('/')[1]}`))
})

app.post('/upload', upload.single('image'), async (req, res) => {
	const filename = req.file.filename
	const id = filename.substr(0, filename.lastIndexOf('_'))

	const imgFile = new Img(id, req.file.mimetype, req.file.size)

	await db.insert(imgFile)

	return res.json({ id: id })
})

app.delete('/image/:id', async (req, res) => {
	const imgId = req.params.id

	if (!db.findOne(imgId)) {
		return res.status(404).send('Not Found')
	}

	const id = await db.remove(imgId)

	return res.json({ id })
})

app.get('/merge?*', async (req, res) => {
	const parameters = {}
	req.url
		.split('?')[1]
		.split('&')
		.forEach((el) => {
			const [key, value] = el.split('=')
			parameters[key] = decodeURIComponent(value)
		})

	const frontId = parameters.front
	const backId = parameters.back

	const frontImg = db.findOne(frontId)
	const backImg = db.findOne(backId)

	if (!frontImg || !backImg) {
		return res.status(404).send('Not Found')
	}

	const frontFile = fs.createReadStream(path.resolve(imgFolder, `${frontId}_original.${frontImg.mimetype.split('/')[1]}`))

	const backFile = fs.createReadStream(path.resolve(imgFolder, `${backId}_original.${backImg.mimetype.split('/')[1]}`))

	const color = parameters.color ? parameters.color.split(',').map((el) => +el) : undefined
	const threshold = parameters.threshold ? +parameters.threshold : undefined

	replaceBackground(frontFile, backFile, color, threshold)
		.then(
			(readableStream) => {
				readableStream.pipe(res)
			},
			() => {
				return res.send('wrong file dimensions')
			}
		)
		.then(() => {
			res.header('Content-disposition', 'attachment; filename=merge.jpeg')
			res.header('Content-Type', frontImg.mimetype)
			return res.download
		})
})

app.get('/', (req, res) => {
	res.sendFile(path.resolve(__dirname, '../index.html'))
})

app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`)
})
