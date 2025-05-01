const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieparser = require('cookie-parser')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000

app.use(cors({
  origin:['http://localhost:5173'],
  credentials:true
}))
app.use(cookieparser())
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0xslwlb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");


    const jobportal = client.db("JobPortal").collection("job");
    const job_application_collection = client.db("JobPortal").collection("jobApplication");

    
    
    
    //auth releted api
    app.post('/jwt',async(req,res)=>{
      const user = req.body
      const token = jwt.sign(user,process.env.JWI_SECRET,{expiresIn:60*60})
      res
      .cookie('token',token,{
        httpOnly:true,
        secure:false,
      })
      .send({success:true}) 
    })






    app.post("/job", async (req, res) => {
      const job = req.body
      const result = await jobportal.insertOne(job)

      res.send(result)
    })

    app.get('/job', async (req, res) => {
      const email = req.query.email
      let quary = {}
      if (email) {
        quary = { hr_email: email }
      }

      const job = jobportal.find(quary)
      const result = await job.toArray()
      res.send(result)
    })

    app.get('/job/:id', async (req, res) => {
      const id = req.params.id
      const quary = { _id: new ObjectId(id) }
      const result = await jobportal.findOne(quary)
      res.send(result)
    })


    //job application
    app.post('/job-application', async (req, res) => {
      const application = req.body
      const result = await job_application_collection.insertOne(application)

      const id = application.Job_id
      const quary = { _id: new ObjectId(id) }
      const job = await jobportal.findOne(quary)
      console.log(job)
      let newcount = 0
      if (job.applicationcount) {
        newcount = job.applicationcount + 1

      }
      else {
        newcount = 1
      }
      const filter = { _id: new ObjectId(id) }
      const updatedDock = {
        $set: {
          applicationcount: newcount
        }
      }
      const updatedResult = await jobportal.updateOne(filter, updatedDock)
      res.send(result)
    })

    app.delete('/job-application/:id', async (req, res) => {
      const id = req.params.id
      console.log('plasedeletuser', id)
      const quary = { _id: new ObjectId(id) }
      const result = await job_application_collection.deleteOne(quary)
      res.send(result)
    })

    app.get('/job-application/jobs/:job_id', async (req, res) => {
      const jobid = req.params.job_id
      const quary = { Job_id: jobid }
      const result = await job_application_collection.find(quary).toArray()
      res.send(result)
    })

    app.patch('/job-application/:id', async (req, res) => {
      const id = req.params.id
      const data = req.body
      const filter = { _id: new ObjectId(id) }
      const updateDock = {
        $set: {
          status: data.status
        }
      }
      const result = await job_application_collection.updateOne(filter, updateDock)
      res.send(result)
    })

    app.get('/job-application', async (req, res) => {
      const email = req.query.email
      const quary = { job_applicant: email }


      console.log('coooooookis',req.cookies)
      const result = await job_application_collection.find(quary).toArray()

      for (const application of result) {
        console.log(application.Job_id)
        const quary1 = { _id: new ObjectId(application.Job_id) }
        const job = await jobportal.findOne(quary1)

        if (job) {
          application.title = job.title
          application.company = job.company
          application.location = job.location
          application.company_logo = job.company_logo
        } else {
          console.log('No job found for this application');
        }
      }

      res.send(result)



    })





  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('server is ok')
})

app.listen(port, () => {
  console.log(`server is runing ${port}`)
})