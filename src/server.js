const express = require('express')
const { PORT, imgFolder, path } = require('./config')

const { nanoid } = require('nanoid')

const multer = require('multer')

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, imgFolder)
	},
	filename: function (req, file, cb) {
		cb(null, `${nanoid()}.${file.mimetype.split('/')[1]}`)
	},
})

const upload = multer({ storage: storage })

const app = express()

app.use(express.json())

app.get('/ping', (req, res) => {
	res.json({ ping: 'pong' })
})

app.post('/upload', upload.single('image'), (req, res) => {
	console.log(req.file, req.body)
	res.send(req.file.filename.split('.')[0])
})

app.get('/', (req, res) => {
	res.sendFile(path.resolve(__dirname, '../index.html'))
})

app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`)
})
