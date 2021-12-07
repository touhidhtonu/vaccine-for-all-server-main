const express = require('express')
const app = express()
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID
const cors = require('cors')
const bodyParser = require('body-parser')
require('dotenv').config()

const port = process.env.PORT || 5000

app.use(cors())
app.use(bodyParser.json())

const uri = `mongodb+srv://admin2:admin123@cluster0.ail13.mongodb.net/vaccinedb?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    console.log('connection err', err)
    const vaccineCollection = client.db('vaccinedb').collection("vaccines");
    const ordersCollection = client.db('vaccinedb').collection("orders");
    const adminCollection = client.db('vaccinedb').collection("admins")
    const reviewCollection = client.db('vaccinedb').collection("reviews")
    const liveChatQueueCollection = client.db('vaccinedb').collection("liveChatQueue")
    const vaccineUpazillaRelationCollection = client.db('vaccinedb').collection("vaccineUpazillaRelation")

    app.get('/vaccines', (req, res) => {
        vaccineCollection.find({})
            .toArray((err, items) => {
                res.send(items)
            })
    })

    app.get('/reviews', (req, res) => {
        reviewCollection.find({})
            .toArray((err, items) => {
                res.send(items)
            })
    })

    app.get('/vaccine/:id', (req, res) => {
        console.log(req.params.id)
        vaccineCollection.find({ _id: ObjectID(req.params.id) })
            .toArray((err, items) => {
                res.send(items[0])
            })
    })

    app.post('/addVaccine', (req, res) => {
        const newVaccine = req.body
        console.log('adding new vaccine:', newVaccine)
        vaccineCollection.insertOne(newVaccine)
            .then(result => {
                console.log('inserted Count', result.insertedCount)
                res.send(result.insertedCount > 0)
            })
    })

    app.post('/addReview', (req, res) => {
        const newReview = req.body
        console.log('adding new review:', newReview)
        reviewCollection.insertOne(newReview)
            .then(result => {
                console.log('inserted Count', result.insertedCount)
                res.send(result.insertedCount > 0)
            })
    })

    app.post('/addAdmin', (req, res) => {
        const newAdmin = req.body
        console.log('adding new admin:', newAdmin)
        adminCollection.insertOne(newAdmin)
            .then(result => {
                console.log('inserted Count', result.insertedCount)
                res.send(result.insertedCount > 0)
            })
    })

    app.post('/isAdmin', (req, res) => {
        const email = req.body.email
        adminCollection.find({ email: email })
            .toArray((err, admins) => {
                res.send(admins.length > 0)

            })
    })

    app.delete('/deleteVaccine/:id', (req, res) => {
        const id = ObjectID(req.params.id)
        console.log('delete this', id)
        vaccineUpazillaRelationCollection.findOneAndDelete({ _id: id })
            .then(documents => res.send(!!documents.value))
    })

    app.patch('/updateVaccine/:id', (req, res) => {
        console.log(req.body)
        vaccineCollection.updateOne({ _id: ObjectID(req.params.id) },
            {
                $set: { price: req.body.price }
            }
        )
            .then(result => {
                res.send(result.modifiedCount > 0)
            })
    })

    app.patch('/addStock/:id', (req, res) => {
        console.log(req.body, req.params.id)
        vaccineUpazillaRelationCollection.updateOne({ _id: ObjectID(req.params.id) },
            {
                $set: { available: req.body.available }
            }
        )
            .then(result => {
                res.send(result.modifiedCount > 0)
            })
    })

    app.patch('/updateOrderStatus/:id', (req, res) => {
        console.log(req.body)
        ordersCollection.updateOne({ _id: ObjectID(req.params.id) },
            {
                $set: { status: req.body.status }
            }
        )
            .then(result => {
                res.send(result.modifiedCount > 0)
            })
    })

    app.post('/addOrder', (req, res) => {
        const order = req.body
        console.log(order)
        ordersCollection.insertOne(order)
            .then(result => {
                console.log(result.insertedCount)
                res.send(result.insertedCount > 0)
            })
    })

    app.get('/orders', (req, res) => {
        const queryEmail = req.query.email
        adminCollection.find({ email: queryEmail })
            .toArray((err, admins) => {
                const filter = {}
                if (admins.length === 0) {
                    filter.email = queryEmail
                }
                ordersCollection.find(filter)
                    .toArray((err, orders) => {
                        res.send(orders)
                    })
            })
    })

    app.post('/orderByLocation', (req, res) => {
        const { division, district, upazilla } = req.body
        ordersCollection.find({
            'bookingData.division': division,
            'bookingData.district': district,
            'bookingData.upazilla': upazilla,
        })
            .toArray((err, orders) => {
                console.log(orders)
                res.send(orders)
            })

    })

    app.post('/addLiveChatQueue', (req, res) => {
        const newClient = req.body
        console.log('adding new client:', newClient)
        liveChatQueueCollection.insertOne(newClient)
            .then(result => {
                console.log('inserted Count', result.insertedCount)
                res.send(result.insertedCount > 0)
            })
    })

    app.get('/stopChat/:email', (req, res) => {
        const email = req.params.email
        console.log('delete this', email)
        liveChatQueueCollection.deleteMany({ email })
            .then(result => res.send(result))
    })

    app.get('/supportQueue', (req, res) => {
        liveChatQueueCollection.find({})
            .toArray((err, items) => {
                res.send(items)
            })
    })

    app.post('/loadVaccine', (req, res) => {
        const newVaccine = req.body
        // console.log('adding new vaccine:', newVaccine)
        vaccineUpazillaRelationCollection.insertOne(newVaccine)
            .then(result => {
                console.log('inserted Count', result.insertedCount)
                res.send(result.insertedCount > 0)
            })
    })

    app.post('/vaccineByUpazilla', (req, res) => {
        const query = req.body
        console.log('query:', query)
        const { division, district, upazilla } = query
        vaccineUpazillaRelationCollection.find({ division, district, upazilla })
            .toArray((err, vaccines) => {
                res.send(vaccines)
            })
    })

    app.patch('/updateStock/:id', (req, res) => {
        console.log(req.body)
        vaccineUpazillaRelationCollection.updateOne({ _id: ObjectID(req.params.id) },
            {
                $set: { available: req.body.available }
            }
        )
            .then(result => {
                res.send(result.modifiedCount > 0)
            })
    })

    app.patch('/updateServed/:id', (req, res) => {
        vaccineUpazillaRelationCollection.updateOne({ _id: ObjectID(req.params.id) },
            {
                $inc: { served: 1 }
            }
        )
            .then(result => {
                res.send(result.modifiedCount > 0)
            })
    })
});

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port)