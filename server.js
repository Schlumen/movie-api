const http = module.require("http"),
url = module.require("url"),
fs = module.require("fs");

http.createServer((request, response) => {
    let addr = url.parse(request.url, true);
    let filePath = "";

    if (addr.pathname.includes("documentation")) {
        filePath = __dirname + "/documentation.html"
    } else {
        filePath = "index.html";
    }

    fs.readFile(filePath, (err, data) => {
        if (err) throw err;
        response.writeHead(200, {contentType: "text/html"});
        response.write(data);
        response.end();
    });

}).listen(8080);

console.log("Node Server running on Port 8080");