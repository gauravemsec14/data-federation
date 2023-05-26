const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const { exec } = require('child_process');
const mongoose = require('mongoose');
// const cpe_cve = require('./mongodbCve');
// const Selenium = require('./mongodbSelenium');
// const dbConnect = require("./mongodbnMap");
// const federation = require('./mongodbfederation');
const cron = require('node-cron');
// const combine = require()
const schedule = require("./models/schedule");

mongoose.connect(`mongodb+srv://emseccomandcenter:TUXnEN09VNM1drh3@shodan.tqwfjzh.mongodb.net/shodan`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000 
});


const app = express();
app.use(bodyParser.json());

const worker = 5; // Maximum number of workers allowed
let count = 0; // Number of running workers


const axios = require('axios');
// const nmap_schema = require('./models/nmap_schema');
const final_schema = require('./models/final_schema');

// axios.post('http://localhost:4000/api/nmap', { target: 'netflix.com' })
//   .then(response => {
//     console.log(response.data);
//     const rest = response.data;
//     const insert = async () => {
//       const db = await dbConnect();
//       const result = await db.insertOne(rest);
//       if (result.acknowledged) {
//         console.log("data insert");
//       }
//     };
//     insert();
//   })
//   .catch(error => {
//     console.log(error);
//   });









// Define the endpoint for MongoDB queries
app.post('/query', async (req, res) => {
  const query = req.body.query;
  const collection = req.body.collection; // The MongoDB collection to query

  // Connect to the MongoDB database
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('mydatabase');

  // Execute the MongoDB query on the specified collection
  const result = await db.collection(collection).find(query).toArray();

  // Send the response back to the client
  res.json(result);
});

// Define an endpoint to receive Nmap data
app.post('/nmap', async (req, res) => {
  const nmapData = req.body;

  // Process the Nmap data as needed
  console.log('Received Nmap data:', nmapData);

  // Run a command using child_process.exec
  exec('dir', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);

    // Call the worker function
    workerFunction();
  });

  // Send a response back to the client
  res.send('Nmap data received');
});




app.post('/search', async (req, res) => {
  const relayData = req.body;

  // Process the Relay data as needed
  console.log('Received Relay data:', relayData);

  // Run a command using child_process.exec
  exec('dir', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);

    // Call the worker function
    workerFunction();
  });

  // Send a response back to the client
  res.send('Relay data received');
});








// Define an endpoint to receive Selenium data
app.post('/selenium', async (req, res) => {
  const seleniumData = req.body;

  // Process the Selenium data as needed
  console.log('Received Selenium data:', seleniumData);

  // Call the worker function
  workerFunction();

  // Send a response back to the client
  res.send('Selenium data received');
});



// Define the cron job to run every minute
cron.schedule('* * * * *', () => {
  console.log('Running cron job');

  // Call the worker function
  workerFunction();
});

//Define the worker function
const workerFunction = async () => {
  if (await schedule.countDocuments({ "status": "scheduled" }) > 0 &&  await schedule.countDocuments({ "status": "running" }) == 0) {
    const target = await schedule.findOne({ "status": "scheduled" });
    await schedule.updateOne({ "_id": target._id }, { "status": "running" })
    var final = {};
    try {
      const nmapresult = await axios.post('http://localhost:4000/api/nmap', { target: target.target })
      final = { ...final, ...nmapresult.data }

      console.log("NMap Done");
    } catch {
      console.log("NMap Error");
    }
    
    //relay integrate..

    try {
      const relayresult = await axios.post('http://localhost:4000/search', { target: target.target })
      final = { ...final, ...relayresult.data }

      console.log("Relay Done");
    } catch {
      console.log("Relay Error");
    }


    try {
      const seleniumresult = await axios.get(`http://localhost:5000/versions?url=${target.target}`)

      final = { ...final, "application": seleniumresult.data.applications }
      console.log("Selenium Done");

    } catch {
      final = { ...final, "application": [] }

    }
    // Scheduler
    const currentTime = new Date();
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const day = currentTime.getDay(); // day 0 means Sunday

    // Checking time
    if ((hours === 0 && minutes >= 5 && minutes <= 30) && day === 0) {
      console.log('Skipping scan due to scheduled time');
      return;
    }
    
    cveList = []
    //OS CVE
    if (final.os.osCPE !== '') {
      cveList = await parseData(final.os.osCPE);
    }
    final.application.forEach(async (item) => {
      if(item.cpe != null) {
        const cveResult = await parseData(item.cpe);
        if (cveResult) {
          cveList = [...cveList, ...cveResult];
        }
      }
    });

    final = { ...final, "cves": cveList, "requestId": target._id, "target": target.target, "completedAt": new Date() }

    console.log("Final", final);

    // await final_schema.insert(final);
    await new final_schema(final).save();

    await schedule.updateOne({ "_id": target._id }, { "status": "done", "completedAt": new Date() })
  }


};

// Function to fetch data using src and version
const fetchData = async (src, version) => {
  const url = `https://services.nvd.nist.gov/rest/json/cpes/2.0/?keywordSearch=${src} ${version}`;
  
  try {
    const response = await axios.get(url);
    const data = await response.data;
    const cpe = data.result.cpes[0].cpe23Uri;
    console.log(`Fetching CVE data for CPE: ${cpe}`);
   const result = await parseData(cpe);
   return result;
  } catch (error) {
    console.error(`Error fetching data: ${error}`);
    return [];
  }
};

// Function to parse CVE data for a given CPE
const parseData = async (cpe) => {
  const url = `https://services.nvd.nist.gov/rest/json/cves/1.0?cpeName=${cpe}`;
  
  try {
    const response = await axios.get(url);
    const data = await response.data;
    // Create an array of objects with desired fields
    const cveArray = data.result.CVE_Items.map(item => {
        return {
          id: item.cve.CVE_data_meta.ID,
          published: item.publishedDate,
          description: item.cve.description.description_data[0].value
        }
      });
      return cveArray;
  } catch (error) {
    console.error(`Error parsing data: ${error}`);
  }
};


// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

