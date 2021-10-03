const path = require('path')
const fs = require('fs')
const { nanoid } = require('nanoid')
const { replaceBackground } = require('backrem')

const express = require('express')
const { PORT, imgFolder } = require('./config')
const db = require('./entities/Database')
const Img = require('./entities/Img')

const multer = require('multer')
// задаем папку и имя для заргужаемой картинки
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, imgFolder)
	},
	filename: function (req, file, cb) {
		cb(null, `${nanoid()}_original.${file.mimetype.split('/')[1]}`)
	},
})
const upload = multer({ storage: storage })

/***********************************************/

const app = express()

app.use(express.json())

app.use('/files', express.static(imgFolder))

app.get('/ping', (req, res) => {
	return res.json({ ping: 'pong' })
})

// вывод списка загруженных файлов
app.get('/list', (req, res) => {
	const allImgs = db.find().map((img) => img.toPublicJSON())

	return res.json(allImgs)
})

// скачивание файла
app.get('/image/:id', (req, res) => {
	const imgId = req.params.id
	const img = db.findOne(imgId)
	if (!img) {
		return res.status(404).send('Not Found')
	}

	return res.download(path.resolve(imgFolder, `${img.id}_original.${img.mimetype.split('/')[1]}`))
})

// загрузка файла
app.post('/upload', upload.single('image'), async (req, res) => {
	const filename = req.file.filename
	const id = filename.substr(0, filename.lastIndexOf('_'))

	const imgFile = new Img(id, req.file.mimetype, req.file.size)

	await db.insert(imgFile)

	return res.json({ id: id })
})

// удаление файла
app.delete('/image/:id', async (req, res) => {
	const imgId = req.params.id

	if (!db.findOne(imgId)) {
		return res.status(404).send('Not Found')
	}

	const id = await db.remove(imgId)

	return res.json({ id })
})

// замена фона
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

	let color = parameters.color ? parameters.color.split(',').map((el) => +el) : undefined

	// проверка, что цвет указан в нужном формате
	if(!(color?.length === 3)) {
		console.log('Wrong background color, white will be used instead')
		color = undefined
	}
	else {
		for(const number in color) {
			if(isNaN(number) || number < 0 || number > 255) {
				console.log('Wrong background color, white will be used instead ')
				color = undefined
				break
			}
		}
	}
	
	let threshold = parameters.threshold ? +parameters.threshold : undefined

	// проверка, что порог указан верно
	if(isNaN(threshold) || threshold < 0 || threshold > 100) {
		console.log('Wrong threshold, 0 will be used instead')
		threshold = undefined
	}

	// запуск функции замены фона; color и threshold - не обязательные параметры; по умолчанию color = [255,255,255], threshold = 0
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

// открытие index.html, чтобы проще было подгружать картинки
app.get('/', (req, res) => {
	res.sendFile(path.resolve(__dirname, '../index.html'))
})

app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`)
})
