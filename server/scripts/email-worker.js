const path=require('path');require('dotenv').config({path:path.join(__dirname,'../.env')});
const {testConnection,initializeTables}=require('../src/config/database');
(async()=>{await testConnection();await initializeTables();require('../src/services/emailService').startEmailWorker({keepAlive:true});console.log('Independent email worker running. SMTP settings were not changed.');})().catch(error=>{console.error('Worker startup failed:',error.code||error.message);process.exit(1);});
