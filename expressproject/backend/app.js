//Importing stuff
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const usersDataPath = path.join(__dirname, "./users.json");
const fs = require("fs");
const port = 3000;

app.use(bodyParser.json());
let artistsData = require("./artists.json");

app.post("/signup", async (req, res) => {
  console.log(req);
  try {
    const { username, password } = req.body;

    let favorites = [];
    //Read user data from the JSON file
    const usersDataRaw = fs.readFileSync(usersDataPath, "utf-8");
    const usersData = usersDataRaw ? JSON.parse(usersDataRaw) : [];

    //Checking if the user already exists
    if (usersData.find((user) => user.username === username)) {
      return res.status(409).send("Username already exists");
    }

    //Add the new user to the data
    usersData.push({ username, password, favorites });

    //Write updated user data back to the JSON file
    fs.writeFileSync(usersDataPath, JSON.stringify(usersData, null, 2));

    res.status(201).send("User registered successfully");
  } catch (error) {
    console.error("Error reading users data:", error);
    res.status(500).send("Error registering user");
    return;
  }
});
//serve login.html
app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/login.html"));
});
//serve signup.html
app.get("/signup.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/signup.html"));
});

//when you call the login endpoint here you send username and password which will be
//compared with the json users and then it will save the user session in a global app.locals value as a cookie
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    //Read user data from the JSON file
    const usersData = JSON.parse(fs.readFileSync(usersDataPath, "utf-8"));

    //Find the user function
    const user = usersData.find((user) => user.username === username);
    app.locals.storedUser = user;
    console.log(!password == user.password);
    if (!user) {
      return res.status(401).send("Invalid username or password");
    }
    console.log(!password == user.password);
    if (!password == user.password) {
      console.log(!password == user.password);
      return res.status(401).send("Invalid username or password");
    }

    //(todo) If authentication is successful, set a session or token here
    res.status(200).send("Login successful");
    app.locals.isAuthenticated = true;
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send("Error logging in");
  }
});

//checking if the user is logged in and has valid credentials when ever you try to access any page
//where you need to be authenticated
const authenticate = (req, res, next) => {
  //for debugging
  //app.locals.isAuthenticated = true;
  if (app.locals.isAuthenticated) {
    //If authenticated, set the app.locals to true
    app.locals.isAuthenticated = true;
    next();
  } else {
    //If not authenticated, set the app.locals flag to false
    app.locals.isAuthenticated = false;

    res.redirect("/login.html");
    //res.status(401).send("Unauthorized!!!");
  }
};
app.use(authenticate);

//get the artist name endpoint
app.get("/kunstner/:artistName", (req, res) => {
  const artistName = req.params.artistName;
  //Loading the artists data from JSON
  const artistsData = require("./artists.json");

  const artist = artistsData.find(
    (a) => a.name.toLowerCase() === artistName.toLowerCase()
  );

  if (!artist) {
    res.status(404).send("Artist not found");
    return;
  }
  //Send artist data as JSON
  res.json(artist);
});

app.get("/artistsList.html", (req, res) => {
  if (app.locals.isAuthenticated == true) {
    res.sendFile(path.join(__dirname, "../frontend/artistsList.html"));
  }
});

//Serve addArtist.html page
app.get("/addArtist.html", (req, res) => {
  if (app.locals.isAuthenticated == true) {
    res.sendFile(path.join(__dirname, "../frontend/addArtist.html"));
  }
});
app.get("/artists", (req, res) => {
  if (app.locals.isAuthenticated == true) {
    res.json(artistsData);
  }
});

//Serve the deleteArtist.html page
app.get("/deleteArtist.html", (req, res) => {
  if (app.locals.isAuthenticated == true) {
    res.sendFile(path.join(__dirname, "../frontend/deleteArtist.html"));
  }
});

app.get("/userPage.html", (req, res) => {
  if (app.locals.isAuthenticated) {
    const userPagePath = path.join(__dirname, "../frontend/userPage.html");

    //Read the content of userPage.html
    fs.readFile(userPagePath, "utf-8", (err, data) => {
      if (err) {
        return res.status(500).send("Error reading userPage.html");
      }

      //Passing a value into view
      const updatedData = data.replace(
        "USERNAME",
        app.locals.storedUser.username
      );

      //Sending the updated HTML content
      res.send(updatedData);
    });
  } else {
    res.status(401).send("Unauthorized");
  }
});

app.get("/userFavorites", async (req, res) => {
  try {
    const loggedInUsername = app.locals.storedUser.username;
    const usersData = JSON.parse(fs.readFileSync(usersDataPath, "utf-8"));

    //Finding the user in the data
    const user = usersData.find((user) => user.username === loggedInUsername);

    if (!user) {
      return res.status(404).send("User not found");
    }

    //Send the user's favorite artists as a response
    res.json({ favorites: user.favorites });
  } catch (error) {
    res.status(500).send("Error fetching user's favorites");
  }
});

app.put("/artists/:artistName", (req, res) => {
  if (app.locals.isAuthenticated == true) {
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
  }
});

//this will add the clicked artist req.params.artistName to a user who is logged in (app.locals.storedUser.username)
//to their favorites stored on the user in users.json
app.post("/addFavorite/:artistName", async (req, res) => {
  try {
    const artistName = req.params.artistName;
    const loggedInUsername = app.locals.storedUser.username;
    const usersData = JSON.parse(fs.readFileSync(usersDataPath, "utf-8"));

    //Find the user in the data
    const userIndex = usersData.findIndex(
      (user) => user.username === loggedInUsername
    );

    if (userIndex === -1) {
      return res.status(404).send("User not found");
    }

    //Add the artist to the user's favorites list
    if (!usersData[userIndex].favorites.includes(artistName)) {
      usersData[userIndex].favorites.push(artistName);

      //Write updated user data back to JSON file
      await fs.promises.writeFile(
        usersDataPath,
        JSON.stringify(usersData, null, 2)
      );
    }

    res.status(200).send("Artist added to favoritesAPI");
  } catch (error) {
    res.status(500).send("Error adding artist to favorites");
  }
});

app.delete("/artists/:artistName", (req, res) => {
  if (app.locals.isAuthenticated == true) {
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
  }
});

app.get("/updateArtist.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/updateArtist.html"));
});

app.get("/:artistName", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/artistPage.html"));
});

app.get("/", (req, res) => {
  res.redirect("/artistsList.html");
});

app.post("/artists", (req, res) => {
  const newArtist = req.body;
  artistsData.push(newArtist);
  fs.writeFileSync("./artists.json", JSON.stringify(artistsData, null, 2));

  res.json(newArtist);
});

app.listen(port, () => {
  console.log(`Server is running at port: ${port}`);
});

//Serving the static files
app.use(express.static(__dirname));
