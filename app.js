const app = require("express")();
const request = require("request");
const CRM = require("vtiger");
const bodyParser = require("body-parser");
app.use(bodyParser.json());

// Aircall Card
const createInsightCardPayload = (lines) => {
	return {
		contents: lines,
	};
};

const sendInsightCard = (callId, payload) => {
	const API_ID = "89825f2e0266eb7f77b73a6ec875a620";
	const API_TOKEN = "1cb5bb8f7f12ba057c2e66289abd17b0";

	const uri = `https://${API_ID}:${API_TOKEN}@api.aircall.io/v1/calls/${callId}/insight_cards`;

	request.post(uri, { json: payload }, (error, response, body) => {
		if (!!error) {
			console.error("Error while sending insight card:", error);
		} else {
			console.log("HTTP body:", body);
		}
	});
};

let connection = new CRM.Connection(
	"https://digimium2.od2.vtiger.com",
	"yacine@digimium.fr",
	"Kn5kbakmLT3UDZWE"
);

// Update Calls Modules

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

app.post("/aircall/calls", (req, res) => {
	if (req.body.event === "call.created") {
		const callId = req.body.data.id;
		const phoneNumber = req.body.data.raw_digits;
		connection
			.login()
			.then(() =>
				connection.query(
					"SELECT * FROM Contacts WHERE phone = '" +
						phoneNumber +
						"' OR mobile = '" +
						phoneNumber +
						"';"
				)
			)
			.then((contact) => {
				if (contact.length > 0) {
					contact = contact[0];
					let { id, lastname, firstname, email } = contact;
					id = id.split("x").pop();
					let cardContent = [
						{
							type: "title",

							text: `${firstname} ${lastname} is calling`,
							link:
								"https://digimium2.od2.vtiger.com/view/detail?module=Contacts&id=" +
								id,
						},
						{
							type: "shortText",
							text: email,
							label: "Email",
							link: "https://www.youtube.com/watch?v=0T4UykXuJnI",
						},
					];

					const payload =
						createInsightCardPayload(cardContent);

					sendInsightCard(callId, payload);
				}
			});
	}
	res.sendStatus(200);
});

app.post("/outgoing", (req, res) => {
	console.log(req.body);
	res.sendStatus(200);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	console.log("Listening on Port " + PORT);
});
