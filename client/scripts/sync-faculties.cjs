const fs=require('fs'),path=require('path');
fs.copyFileSync(path.join(__dirname,'../../server/src/config/faculties.json'),path.join(__dirname,'../src/config/faculties.json'));
