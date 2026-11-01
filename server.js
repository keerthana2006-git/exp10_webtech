
const http = require("http");
const fs = require("fs");
const { MongoClient } = require("mongodb");

const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url);

const PORT = 6000;

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (c) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[c];
    });
}

async function startServer() {

    await client.connect();

    console.log("MongoDB Connected");

    const db = client.db("sciencefair");
    const collection = db.collection("participants");

    const server = http.createServer(async function (req, res) {

        // Display Registration Form

        if (req.url === "/" && req.method === "GET") {

            res.writeHead(200, {
                "Content-Type": "text/html"
            });

            fs.createReadStream("./index.html").pipe(res);

        }

        // Handle Form Submission

        else if (req.url === "/server" &&
                 req.method === "POST") {

            let rawData = "";

            req.on("data", function (data) {
                rawData += data;
            });

            req.on("end", async function () {

                try {

                    const formData =
                        new URLSearchParams(rawData);

                    const participant = {

                        name: formData.get("name"),

                        password: formData.get("password"),

                        age: Number(formData.get("age")),

                        mobile: formData.get("mobile"),

                        email: formData.get("email"),

                        gender: formData.get("gender"),

                        state: formData.get("state"),

                        skills: formData.getAll("skills")

                    };

                    // Insert Data into MongoDB

                    await collection.insertOne(participant);

                    // Retrieve Data from MongoDB

                    const users = await collection
                        .find({})
                        .toArray();

                    // Display Submitted Details

                    let rows = "";

                    users.forEach(function (user) {

                        rows += `
                            <tr>
                                <td>${escapeHTML(user.name)}</td>
                                <td>${escapeHTML(user.password)}</td>
                                <td>${escapeHTML(user.age)}</td>
                                <td>${escapeHTML(user.mobile)}</td>
                                <td>${escapeHTML(user.email)}</td>
                                <td>${escapeHTML(user.gender)}</td>
                                <td>${escapeHTML(user.state)}</td>
                                <td>${escapeHTML(
                                    Array.isArray(user.skills)
                                    ? user.skills.join(", ")
                                    : ""
                                )}</td>
                            </tr>
                        `;

                    });

                    res.writeHead(200, {
                        "Content-Type": "text/html; charset=utf-8"
                    });

                    res.end(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Science Fair Submitted Details</title>

                            <style>
                                body {
                                    font-family: Arial;
                                    background: #eaf6ff;
                                    text-align: center;
                                }

                                h1 {
                                    background: #003366;
                                    color: white;
                                    padding: 20px;
                                }

                                table {
                                    width: 95%;
                                    margin: 30px auto;
                                    border-collapse: collapse;
                                    background: white;
                                }

                                th, td {
                                    border: 1px solid #777;
                                    padding: 10px;
                                }

                                th {
                                    background: #0077b6;
                                    color: white;
                                }

                                a {
                                    background: #003366;
                                    color: white;
                                    padding: 12px 20px;
                                    text-decoration: none;
                                }
                            </style>
                        </head>

                        <body>

                            <h1>SCIENCE FAIR 2026</h1>

                            <h2>User Submitted Details</h2>

                            <table>

                                <tr>
                                    <th>Name</th>
                                    <th>Password</th>
                                    <th>Age</th>
                                    <th>Mobile</th>
                                    <th>Email</th>
                                    <th>Gender</th>
                                    <th>State</th>
                                    <th>Skills</th>
                                </tr>

                                ${rows}

                            </table>

                            <a href="/">Back to Registration</a>

                        </body>
                        </html>
                    `);

                } catch (error) {

                    console.error(error);

                    res.writeHead(500, {
                        "Content-Type": "text/plain"
                    });

                    res.end("Error processing form");

                }

            });

        }

        else {

            res.writeHead(404, {
                "Content-Type": "text/plain"
            });

            res.end("Page Not Found");

        }

    });

    server.listen(PORT, function () {

        console.log(
            "Server running at http://localhost:" + PORT
        );

    });

}

startServer().catch(console.error);
