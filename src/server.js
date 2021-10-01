const express = require('express')
const { PORT } = require('./config')

const app = express()

app.use(express.json())

app.get('/ping', (req, res) => {
	res.send('pong')
})

app.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`)
})
