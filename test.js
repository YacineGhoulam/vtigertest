const app = require("express")();

const request = require("request");

function waitfewseconds() {
	setTimeout(() => {}, 5000);
}

let getCallsHeader = {
	method: "GET",
	headers: {
		"Content-Type": "application/json",
		Authorization:
			"Basic ODk4MjVmMmUwMjY2ZWI3Zjc3YjczYTZlYzg3NWE2MjA6MWNiNWJiOGY3ZjEyYmEwNTdjMmU2NjI4OWFiZDE3YjA=",
	},
};

function addCall(uri) {
	let clientServerOptions = {
		uri: uri,
		body: JSON.stringify("yes yes yes"),
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-VTIGER-SECRET": "129412201662064da8bece7",
		},
	};
	request(clientServerOptions, function (error, response) {
		return;
	});
	waitfewseconds();
}

let isCallExistantHeader = {
	method: "GET",
	headers: {
		"Content-Type": "application/json",
		Authorization:
			"Basic eWFjaW5lQGRpZ2ltaXVtLmZyOktuNWtiYWttTFQzVURaV0U=",
	},
};

let calls = [];

setInterval(
	() => {
		// Set timing and URL
		let now = new Date().getTime();
		let oneHourAgo = now - 1000 * 60 * 60;
		getCallsHeader.uri =
			"https://api.aircall.io/v1/calls?from=" + oneHourAgo;

		// Get All Calls From 1hour ago
		request(getCallsHeader, function (error, response) {
			calls = JSON.parse(response.body).calls;

			//Send request for each call
			calls.forEach((call) => {
				if (call.status === "done" && call.user) {
					(isCallExistantHeader.uri =
						"https://digimium2.od2.vtiger.com/restapi/v1/vtiger/default/query?query= SELECT * FROM PhoneCalls WHERE sourceuuid=" +
						call.id +
						";"),
						request(
							isCallExistantHeader,
							function (error, response) {
								let result = JSON.parse(
									response.body
								).result;
								if (result.length === 0) {
									//Create the call
									let uri =
										"https://digimium2.od2.vtiger.com/modules/PhoneCalls/callbacks/Generic.php?to=" +
										encodeURI(
											call.raw_digits
										) +
										"&event=" +
										"call_initiated" +
										"&call_id=" +
										call.id +
										"&from=" +
										encodeURI(
											call.user.id
										) +
										"&direction=" +
										call.direction;

									addCall(uri);
								}
							}
						);

					// Save Recording
					uri =
						"https://digimium2.od2.vtiger.com/modules/PhoneCalls/callbacks/Generic.php?recordingurl=" +
						encodeURI(
							"https://assets.aircall.io/calls/" +
								call.id +
								"/recording"
						) +
						"&event=" +
						"call_recording" +
						"&call_id=" +
						call.id;
					addCall(uri);

					// End Call
					let comment = "No Comment.";
					if (call.comments.length > 0) {
						comment = call.comments[0].content;
					}
					uri =
						"https://digimium2.od2.vtiger.com/modules/PhoneCalls/callbacks/Generic.php?event=" +
						"call_hangup" +
						"&call_id=" +
						call.id +
						"&notes=" +
						encodeURI(
							comment +
								". Agent Number: " +
								call.number.digits
						);

					addCall(uri);
					console.log("done");
				}
			});
		});
	},

	1000 * 60 * 3
);

app.get("/", (req, res) => {
	res.send("<h1>Hello World</h1>");
	res.sendStatus(200);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	console.log("Listening on Port " + PORT);
});
