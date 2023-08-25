const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path"); // Import the path module
const fs = require("fs");
const port = 3000;
// respond with "hello world" when a GET request is made to the homepage
app.use(bodyParser.json());
let artistsData = require("./artists.json");

app.get("/artistsList.html", (req, res) => {
  res.sendFile(path.join(__dirname, "artistsList.html"));
});

// Serve the addArtist.html page
app.get("/addArtist.html", (req, res) => {
  res.sendFile(path.join(__dirname, "addArtist.html"));
});

// Serve the updateArtist.html page
app.get("/updateArtist.html", (req, res) => {
  res.sendFile(path.join(__dirname, "updateArtist.html"));
});

// Serve the deleteArtist.html page
app.get("/deleteArtist.html", (req, res) => {
  res.sendFile(path.join(__dirname, "deleteArtist.html"));
});

app.get("/artists", (req, res) => {
  res.json(artistsData);
});

app.post("/artists", (req, res) => {
  const newArtist = req.body;
  artistsData.push(newArtist);
  fs.writeFileSync("./artists.json", JSON.stringify(artistsData, null, 2));

  res.json(newArtist);
});

app.put("/artists/:artistName", (req, res) => {
  const artistName = req.params.artistName;
  const updatedArtist = req.body;
  const index = artistsData.findIndex(
    (a) => a.name.toLowerCase() === artistName.toLowerCase()
  );

  if (index === -1) {
    res.status(404).send("Artist not found");
    return;
  }

  artistsData[index] = { ...artistsData[index], ...updatedArtist };
  fs.writeFileSync("./artists.json", JSON.stringify(artistsData, null, 2));

  res.json(artistsData[index]);
});

app.delete("/artists/:artistName", (req, res) => {
  const artistName = req.params.artistName;
  const index = artistsData.findIndex(
    (a) => a.name.toLowerCase() === artistName.toLowerCase()
  );

  if (index === -1) {
    res.status(404).send("Artist not found");
    return;
  }

  const deletedArtist = artistsData.splice(index, 1);
  fs.writeFileSync("./artists.json", JSON.stringify(artistsData, null, 2));

  res.json(deletedArtist);
});

const authenticate = (req, res, next) => {
  // You can implement your authentication logic here
  // For example, check if the user is logged in or has valid credentials
  const isAuthenticated = true; // Replace this with your authentication check

  if (isAuthenticated) {
    // If authenticated, move to the next middleware or route handler
    next();
  } else {
    // If not authenticated, send an unauthorized response
    res.status(401).send("Unauthorized");
  }
};

app.use(authenticate);

app.get("/:artistName", (req, res) => {
  res.sendFile(path.join(__dirname, "artistPage.html"));
});

app.get("/kunstner/:artistName", (req, res) => {
  const artistName = req.params.artistName;
  const artistsData = require("./artists.json"); // Load the artists data from JSON

  const artist = artistsData.find(
    (a) => a.name.toLowerCase() === artistName.toLowerCase()
  );

  if (!artist) {
    res.status(404).send("Artist not found");
    return;
  }

  res.json(artist); // Send artist data as JSON
});

app.listen(port, () => {
  console.log(`Server is running at port: ${port}`);
});

app.use(express.static(__dirname)); // Serve static files, including artist.html
