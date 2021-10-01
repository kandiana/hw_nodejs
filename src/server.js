const path = require('path')

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
		res.status(404).send('Not Found')
	}

	console.log(imgFolder)
	console.log(path.resolve(imgFolder, `${img.id}_original.${img.mimetype}`))

	return res.download(path.resolve(imgFolder, `${img.id}_original.${img.mimetype}`))
})

app.post('/upload', upload.single('image'), async (req, res) => {
	console.log(req.file, req.body)
	const size = req.file.size
	const mimetype = req.file.mimetype.split('/')[1]
	const filename = req.file.filename
	const id = filename.substr(0, filename.lastIndexOf('_'))

	const imgFile = new Img(id, mimetype, size)

	await db.insert(imgFile)

	return res.json({ id: id })
})

app.delete('/image/:id', async (req, res) => {
	const imgId = req.params.id

	if (!db.findOne(imgId)) {
		res.status(404).send('Not Found')
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
	console.log(parameters)

	return res.json('ok')
})

app.get('/', (req, res) => {
	res.sendFile(path.resolve(__dirname, '../index.html'))
})

app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`)
})
