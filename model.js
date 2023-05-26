const mongoose = require('mongoose');

const schedule_schema = mongoose.Schema({ },{ strict : false } )
const nvd_schema = mongoose.Schema({ },{ strict : false } )
const nmap_schema = mongoose.Schema({ },{ strict : false } )
const selenium_schema= mongoose.Schema({ },{ strict : false } )
const final_schema= mongoose.Schema({ },{ strict : false } )
const relay_schema= mongoose.Schema({ },{ strict : false } )


// database schema

module.exports=mongoose.model("schedule_schema",schedule_schema);
module.exports=mongoose.model("nvd_schema", nvd_schema);
module.exports=mongoose.model("nmap_schema",nmap_schema);
module.exports=mongoose.model("selenium_schema",selenium_schema);
module.exports=mongoose.model("final_schema",final_schema);
module.exports=mongoose.model("relay_schema",relay_schema);