const HttpSrv = require('dev-http-server');
// create instance
const httpSrv = new HttpSrv();

httpSrv.setStatic('/', '.', 'index.html');
httpSrv.setStatic('/bak', '../bak');
httpSrv.setStatic('/dist', '../dist');

// run server
HttpSrv.run({
    httpSrv: httpSrv, // instance of HttpSrv object
    address: '127.0.0.1', // IP address of server
    port: 8080, // Port of server
});
