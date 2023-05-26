const mongoose = require('mongoose');
const relay_schema = mongoose.Schema({ },{ strict : false } );
module.exports=mongoose.model("relay_schema",relay_schema);
