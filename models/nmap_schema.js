const mongoose = require('mongoose');
const nmap_schema = mongoose.Schema({ },{ strict : false } );
module.exports=mongoose.model("nmap_schema",nmap_schema);