const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const httpStatus = require('http-status')

const { createNewUser, getAllUsers, validateUsername } = require('./user')
const { addExercise, getExercises, validateExercise, validateLog } = require('./exercises')

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/exercise/users', getAllUsers)
app.post('/api/exercise/new-user', validateUsername, createNewUser)
app.post('/api/exercise/add', validateExercise, addExercise)
app.get('/api/exercise/log', validateLog, getExercises)

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  console.log(err)

  return res
    .status(err.statusCode || httpStatus.INTERNAL_SERVER_ERROR)
    .json({ error: err.message || err })
})

app.on('ready', () => {
    const port = process.env.port || 3000
    app.listen(port, () => {
        console.log(`App listening on port ${port}`)
    })
})

module.exports = app;
