const chai = require('chai')
const chaiHttp = require('chai-http')
const httpStatus = require('http-status')

const app = require('../src/app')
const { client: mongoClient, dbName, usersCollection, exercisesCollection } = require('../config/mongo')
const { NUM_HEX_CHAR_FOR_MONGO_ID } = require('../src/exercises')

chai.use(chaiHttp).should()

describe('app', function() {
    before(function(done) {
        mongoClient.connect(function(err) {
            if(err) {
                throw new Error(err)
            }
        })

        console.log('Connected to mongo')
        done()
    })

    // TODO: refacto all beforeEach and afterEach
    beforeEach(function(done) {
        mongoClient.db(dbName).createCollection(usersCollection, function(err) {
            if(err) {
                console.log(`Couldn't create collection ${usersCollection}`)
                throw new Error(err)
            }

            console.log(`Created test collection ${usersCollection}`)
            done()
        })
    })

    beforeEach(function(done) {
        mongoClient.db(dbName).createCollection(exercisesCollection, function(err) {
            if(err) {
                console.log(`Couldn't create collection ${exercisesCollection}`)
                throw new Error(err)
            }

            console.log(`Created test collection ${exercisesCollection}`)
            done()
        })
    })

    afterEach(function(done) {
        mongoClient.db(dbName).dropCollection(usersCollection, function(err) {
            if(err) {
                console.log(`Couldn't drop test collection ${usersCollection}`)
                throw new Error(err)
            }

            console.log(`Dropped test collection ${usersCollection}`)
            done()
        })
    })

    afterEach(function(done) {
        mongoClient.db(dbName).dropCollection(exercisesCollection, function(err) {
            if(err) {
                console.log(`Couldn't drop test collection ${exercisesCollection}`)
                throw new Error(err)
            }

            console.log(`Dropped test collection ${exercisesCollection}`)
            done()
        })
    })

    after(function(done) {
        mongoClient.close(function(err) {
            if(err) {
                throw new Error(err)
            }

            console.log('Closed connection to mongo')
            done()
        })
    })

    describe('POST /api/exercise/new-user', function() {
        it('should insert a new user with its username', function(done) {
            const username = 'flo'

            chai.request(app)
                .post('/api/exercise/new-user')
                .send({ username })
                .end(function(err, res) {
                    if(err) {
                        throw new Error(err)
                    }

                    res.should.have.status(httpStatus.OK)
                    res.should.be.json
                    res.body.should.be.an('object')
                    res.body.should.have.property('_id')
                    res.body.should.have.property('username')
                    res.body.username.should.equal(username)
                    done()
                })
        })

        it('should return an error if a username already exists', function(done) {
            const username = 'flo'

            chai.request(app)
                .post('/api/exercise/new-user')
                .send({ username })
                .end(function(err) {
                    if(err) {
                        throw new Error(err)
                    }

                    chai.request(app)
                        .post('/api/exercise/new-user')
                        .send({ username })
                        .end(function(error, res) {
                            if(error) {
                                throw new Error(error)
                            }

                            res.should.have.status(httpStatus.BAD_REQUEST)
                            res.should.be.json
                            res.body.should.be.an('object')
                            res.body.should.have.property('error')
                            res.body.error.should.equal(`User ${username} already exists`)
                            done()
                        })
                })
        })

        it('should send an error if no username was provided', function(done) {
            chai.request(app)
                .post('/api/exercise/new-user')
                .send({ username: '' })
                .end(function(err, res) {
                    if(err) {
                        throw new Error(err)
                    }

                    res.should.have.status(httpStatus.BAD_REQUEST)
                    res.should.be.json
                    res.body.should.be.an('object')
                    res.body.should.have.property('error')
                    res.body.error.should.equal('No username was provided')
                    done()
                })
        })
    })

    describe('GET /api/exercise/users', function() {
        const firstUsername = 'flo'
        const secondUsername = 'jean'

        beforeEach(function(done) {
            Promise.all([
                chai.request(app).post('/api/exercise/new-user').send({ username: firstUsername }),
                chai.request(app).post('/api/exercise/new-user').send({ username: secondUsername }),
            ])
            .then(() => done())
        })

        it('should get all users', function(done) {
            chai.request(app)
                .get('/api/exercise/users')
                .end(function(err, res) {
                    if(err) {
                        throw new Error(err)
                    }

                    res.should.have.status(httpStatus.OK)
                    res.should.be.json
                    res.body.should.be.an('array')
                    res.body.should.have.lengthOf(2)
                    res.body[0].should.have.property('_id')
                    res.body[0].should.have.property('username')

                    const { _id: id1, username: username1 } = res.body[0]
                    const { _id: id2, username: username2 } = res.body[1]
                    const usernames = [username1, username2]

                    id1.should.not.equal(id2)
                    username1.should.not.equal(username2)
                    usernames.should.include(firstUsername)
                    usernames.should.include(secondUsername)

                    done()
                })
        })
    })

    describe('POST /api/exercise/add', function() {

        it('should add an exercise to a user and return the updated user object', function(done) {
            const username = 'flo'

            const description = 'pectorals'
            const duration = 60
            const date = '2019-04-23'

            chai.request(app)
                .post('/api/exercise/new-user')
                .send({ username })
                .end(function(error, result) {
                    if(error) {
                        throw new Error(error)
                    }

                    const userId = result.body._id

                    chai.request(app)
                        .post('/api/exercise/add')
                        .send({ userId, description, duration, date })
                        .end(function(err, res) {
                            if(err) {
                                throw new Error(err)
                            }
        
                            res.should.have.status(httpStatus.OK)
                            res.should.be.json
                            res.body.should.be.an('object')
                            res.body.should.have.property('_id')
                            res.body.should.have.property('username')
                            res.body.should.have.property('description')
                            res.body.should.have.property('duration')
                            res.body.should.have.property('date')
                            res.body._id.should.equal(userId)
                            res.body.username.should.equal(username)
                            res.body.description.should.equal(description)
                            res.body.duration.should.equal(duration)
                            res.body.date.should.equal(date)
        
                            done()
                        })
                })

        })

        it('should use the current date if no date is supplied', function(done) {
            const username = 'flo'

            const description = 'pectorals'
            const duration = 60

            chai.request(app)
                .post('/api/exercise/new-user')
                .send({ username })
                .end(function(error, result) {
                    if(error) {
                        throw new Error(error)
                    }

                    const userId = result.body._id

                    const today = new Date().toISOString().split('T')[0]

                    chai.request(app)
                        .post('/api/exercise/add')
                        .send({ userId, description, duration })
                        .end(function(err, res) {
                            if(err) {
                                throw new Error(err)
                            }
        
                            res.should.have.status(httpStatus.OK)
                            res.should.be.json
                            res.body.should.be.an('object')
                            res.body.should.have.property('_id')
                            res.body.should.have.property('username')
                            res.body.should.have.property('description')
                            res.body.should.have.property('duration')
                            res.body.should.have.property('date')
                            res.body._id.should.equal(userId)
                            res.body.username.should.equal(username)
                            res.body.description.should.equal(description)
                            res.body.duration.should.equal(duration)
                            res.body.date.should.equal(today)
        
                            done()
                        })
                })

        })

        it('should send an error if userId is not specified', function(done) {
            chai.request(app)
                .post('/api/exercise/add')
                .send({ description: 'pectorals', duration : 60 })
                .end(function(err, res) {
                    if(err) {
                        throw new Error(err)
                    }

                    res.should.have.status(httpStatus.BAD_REQUEST)
                    res.should.be.json
                    res.body.should.be.an('object')
                    res.body.should.have.property('error')
                    done()
                })
        })

        it('should send an error if description is not specified', function(done) {
            chai.request(app)
                .post('/api/exercise/add')
                .send({ userId: '1334', duration : 60 })
                .end(function(err, res) {
                    if(err) {
                        throw new Error(err)
                    }

                    res.should.have.status(httpStatus.BAD_REQUEST)
                    res.should.be.json
                    res.body.should.be.an('object')
                    res.body.should.have.property('error')
                    done()
                })
        })

        it('should send an error if duration is not specified', function(done) {
            chai.request(app)
                .post('/api/exercise/add')
                .send({ userId: '123', description: 'pectorals' })
                .end(function(err, res) {
                    if(err) {
                        throw new Error(err)
                    }

                    res.should.have.status(httpStatus.BAD_REQUEST)
                    res.should.be.json
                    res.body.should.be.an('object')
                    res.body.should.have.property('error')
                    done()
                })
        })

        it('should send an error if the userId does not match any user ids', function(done) {
            chai.request(app)
                .post('/api/exercise/new-user')
                .send({ username: 'flo' })
                .end(function(error, result) {
                    if(error) {
                        throw new Error(error)
                    }

                    const userId = result.body._id
                    const userIdLastLetter = userId[NUM_HEX_CHAR_FOR_MONGO_ID - 1]
                    const newLastLetter = userIdLastLetter === '1' ? '2' : '1'
                    const nonExistentUserId = userId.slice(0, NUM_HEX_CHAR_FOR_MONGO_ID - 1) + newLastLetter

                    chai.request(app)
                        .post('/api/exercise/add')
                        .send({ userId: nonExistentUserId, description: 'pectorals', duration: 60 })
                        .end(function(err, res) {
                            if(err) {
                                throw new Error(err)
                            }

                            res.should.have.status(httpStatus.BAD_REQUEST)
                            res.should.be.json
                            res.body.should.be.an('object')
                            res.body.should.have.property('error')
                            res.body.error.should.equal("Field 'userId' doesn't match any user ids")
                            done()
                        })
                })
        })
    })

    describe('GET /api/exercise/log?{userId}[&from][&to][&limit]', function() {
        const firstUsername = 'flo'
        const secondUsername = 'jean'

        let firstUserId
        let secondUserId

        const firstUserFullLog = [
            {
                description: 'ex1',
                duration: 20,
                date: '2019-04-10'
            },
            {
                description: 'ex2',
                duration: 40,
                date: '2019-04-12'
            },
            {
                description: 'ex3',
                duration: 60,
                date: '2019-04-14'
            },
        ]

        const firstUserFullLogCount = firstUserFullLog.length

        // TODO: refacto all beforeEach
        beforeEach(function(done) {
            chai.request(app)
                .post('/api/exercise/new-user')
                .send({ username: firstUsername })
                .end(function(err, res) {
                    if(err) {
                        throw new Error(err)
                    }

                    firstUserId = res.body._id
                    done()
                })
        })

        beforeEach(function(done) {
            chai.request(app)
                .post('/api/exercise/new-user')
                .send({ username: secondUsername })
                .end(function(err, res) {
                    if(err) {
                        throw new Error(err)
                    }

                    secondUserId = res.body._id
                    done()
                })
        })

        beforeEach(function(done) {
            Promise.all([
                chai.request(app).post('/api/exercise/add').send({ userid: firstUserId, ...firstUserFullLog[0] }),
                chai.request(app).post('/api/exercise/add').send({ userid: secondUserId, description: 'ex11', duration: 30, date: '2019-04-11' }),
                chai.request(app).post('/api/exercise/add').send({ userid: firstUserId, ...firstUserFullLog[1] }),
                chai.request(app).post('/api/exercise/add').send({ userid: firstUserId, ...firstUserFullLog[2] }),
            ])
            .then(() => done())
        })

        it('should return the user object with the log and count', function(done) {
            chai.request(app)
                .get(`/api/exercise/log?${firstUserId}`)
                .end(function(err, res) {
                    if(err) {
                        throw new Error(err)
                    }

                    res.should.have.status(httpStatus.OK)
                    res.should.be.json
                    res.body.should.be.an('object')
                    res.body.should.have.property('_id')
                    res.body.should.have.property('username')
                    res.body.should.have.property('log')
                    res.body.should.have.property('count')
                    res.body._id.should.equal(firstUserId)
                    res.body.username.should.equal(firstUsername)
                    res.body.log.should.be.an('array')
                    res.body.log.should.deep.equal(firstUserFullLog)
                    res.body.count.should.equal(firstUserFullLogCount)

                    done()
                })
        })

        it('should handle from optional parameter', function(done) {
            chai.request(app)
            .get(`/api/exercise/log?${firstUserId}&from=2019-04-12`) // don't retrieve the first exercise
            .end(function(err, res) {
                if(err) {
                    throw new Error(err)
                }

                res.should.have.status(httpStatus.OK)
                res.should.be.json
                res.body.should.be.an('object')
                res.body.should.have.property('_id')
                res.body.should.have.property('username')
                res.body.should.have.property('log')
                res.body.should.have.property('count')
                res.body._id.should.equal(firstUserId)
                res.body.username.should.equal(firstUsername)
                res.body.log.should.be.an('array')
                res.body.log.should.deep.equal(firstUserFullLog.slice(1))
                res.body.count.should.equal(firstUserFullLogCount-1)

                done()
            })
        })

        it('should handle to optional parameter', function(done) {
            chai.request(app)
            .get(`/api/exercise/log?${firstUserId}&to=2019-04-11`) // don't retrieve the last two exercises
            .end(function(err, res) {
                if(err) {
                    throw new Error(err)
                }

                res.should.have.status(httpStatus.OK)
                res.should.be.json
                res.body.should.be.an('object')
                res.body.should.have.property('_id')
                res.body.should.have.property('username')
                res.body.should.have.property('log')
                res.body.should.have.property('count')
                res.body._id.should.equal(firstUserId)
                res.body.username.should.equal(firstUsername)
                res.body.log.should.be.an('array')
                res.body.log.should.deep.equal(firstUserFullLog.slice(0, 1))
                res.body.count.should.equal(1)

                done()
            })
        })

        it('should handle limit optional parameter', function(done) {
            const limit = 2

            chai.request(app)
            .get(`/api/exercise/log?${firstUserId}&limit=${limit}`)
            .end(function(err, res) {
                if(err) {
                    throw new Error(err)
                }

                res.should.have.status(httpStatus.OK)
                res.should.be.json
                res.body.should.be.an('object')
                res.body.should.have.property('_id')
                res.body.should.have.property('username')
                res.body.should.have.property('log')
                res.body.should.have.property('count')
                res.body._id.should.equal(firstUserId)
                res.body.username.should.equal(firstUsername)
                res.body.log.should.be.an('array')
                res.body.log.should.deep.equal(firstUserFullLog.slice(0, limit))
                res.body.count.should.equal(limit)

                done()
            })
        })

        it('should retrieve all exercises if limit parameter is larger than the number of all exercises', function(done) {
            const limit = 5

            chai.request(app)
            .get(`/api/exercise/log?${firstUserId}&limit=${limit}`)
            .end(function(err, res) {
                if(err) {
                    throw new Error(err)
                }

                res.should.have.status(httpStatus.OK)
                res.should.be.json
                res.body.should.be.an('object')
                res.body.should.have.property('_id')
                res.body.should.have.property('username')
                res.body.should.have.property('log')
                res.body.should.have.property('count')
                res.body._id.should.equal(firstUserId)
                res.body.username.should.equal(firstUsername)
                res.body.log.should.be.an('array')
                res.body.log.should.deep.equal(firstUserFullLog)
                res.body.count.should.equal(firstUserFullLogCount)

                done()
            })
        })

        it('should handle all optional parameters at the same time', function(done) {
            chai.request(app)
            .get(`/api/exercise/log?${firstUserId}&from=2019-04-11&to=2019-04-15&limit=1`)
            .end(function(err, res) {
                if(err) {
                    throw new Error(err)
                }

                res.should.have.status(httpStatus.OK)
                res.should.be.json
                res.body.should.be.an('object')
                res.body.should.have.property('_id')
                res.body.should.have.property('username')
                res.body.should.have.property('log')
                res.body.should.have.property('count')
                res.body._id.should.equal(firstUserId)
                res.body.username.should.equal(firstUsername)
                res.body.log.should.be.an('array')
                res.body.log.should.deep.equal(firstUserFullLog.slice(1, 2))
                res.body.count.should.equal(1)

                done()
            })
        })
    })

})
