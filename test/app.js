const chai = require('chai')
const chaiHttp = require('chai-http')
const httpStatus = require('http-status')

const app = require('../app')
const {client: mongoClient, dbName, collection: mongoCollection} = require('../config/mongo')

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

    afterEach(function(done) {
        mongoClient.db(dbName).dropCollection(mongoCollection, function(err) {
            if(err) {
                console.log(`Couldn't drop test collection ${mongoCollection}`)
                throw new Error(err)
            }

            console.log(`Dropped test collection ${mongoCollection}`)
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

                    id1.should.not.equal(id2)
                    username1.should.not.equal(username2)
                    [username1, username2].should.include(firstUsername)
                    [username1, username2].should.include(secondUsername)

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
                        .send({ userid, description, duration, date })
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
                            res.body.duration.should.equald(duration)
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
                        .send({ userid, description, duration })
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
                            res.body.duration.should.equald(duration)
                            res.body.date.should.equal(today)
        
                            done()
                        })
                })

        })

        it('should send an error if userId, description, or duration are not specified', function(done) {
            chai.request(app)
                .post('/api/exercise/new-user')
                .send({ description: 'pectorals', duration : 60 })
                .end(function(err, res) {
                    if(err) {
                        throw new Error(err)
                    }

                    res.should.have.status(httpStatus.BAD_REQUEST)
                    res.should.be.json
                    res.body.should.be.an('object')
                    res.body.should.have.property('error')
                    res.body.error.should.equal("Field 'userId' was not provided")
                    done()
                })
        })

        it('should send an error if description is not specified', function(done) {
            chai.request(app)
                .post('/api/exercise/new-user')
                .send({ userId: '1334', duration : 60 })
                .end(function(err, res) {
                    if(err) {
                        throw new Error(err)
                    }

                    res.should.have.status(httpStatus.BAD_REQUEST)
                    res.should.be.json
                    res.body.should.be.an('object')
                    res.body.should.have.property('error')
                    res.body.error.should.equal("Field 'description' was not provided")
                    done()
                })
        })

        it('should send an error if duration is not specified', function(done) {
            chai.request(app)
                .post('/api/exercise/new-user')
                .send({ userId: '123', description: 'pectorals' })
                .end(function(err, res) {
                    if(err) {
                        throw new Error(err)
                    }

                    res.should.have.status(httpStatus.BAD_REQUEST)
                    res.should.be.json
                    res.body.should.be.an('object')
                    res.body.should.have.property('error')
                    res.body.error.should.equal("Field 'duration' was not provided")
                    done()
                })
        })

        it('should send an error if the userId does not match any user ids', function(done) {
            chai.request(app)
                .post('/api/exercise/new-user')
                .end(function(error, result) {
                    if(error) {
                        throw new Error(error)
                    }

                    const userId = result.body._id

                    chai.request(app)
                        .post('/api/exercise/new-user')
                        .send({ userId: `${userId}1`, description: 'pectorals', duration: 60 })
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
        it('should return the user object with the log and count')
        it('should handle from optional parameter')
        it('should handle to optional parameter')
        it('should handle limit optional parameter')
        it('should handle all optional parameters at the same time')
    })

})
