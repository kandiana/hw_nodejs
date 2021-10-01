const express = require('express')
const { PORT } = require('./config')

const multer = require('multer')

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, __dirname + '/imgs/')
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname) // modified here  or user file.mimetype
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
	res.send('ok')
})

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html')
})

app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`)
})
