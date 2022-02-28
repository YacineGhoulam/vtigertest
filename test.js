const app = require("express")();
const http = require("http").Server(app);
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
	res.send("hello");
	res.sendStatus(200);
});
http.listen(4000, "localhost", () => {
	console.log("listening on port 4000");
});
