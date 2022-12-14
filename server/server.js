require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const saltRounds = 10;

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);

const DB =
  "mongodb+srv://Gagan_Saini:gaganiscoder@cluster0.afqpweg.mongodb.net/Impact?retryWrites=true&w=majority";
// mongoose.connect("mongodb://localhost:27017/impactDB");
mongoose
  .connect(DB)
  .then(() => {
    console.log("Connected Successfully");
  })
  .catch((err) => {
    console.log("Not connected to database");
  });

const postSchema = new mongoose.Schema({
  userName: String,
  userIntro: String,
  userEmail: String,
  postContent: String,
  postImgSrc: String,
  profileImage: String,
  likes: Number,
  comments: [{}],
  likeMails: [],
});

const userSchema = new mongoose.Schema({
  userName: String,
  userEmail: String,
  userIntro: String,
  userProfileImage: String,
  userAboutContent: String,
  password: String,
  allPosts: [{}],
  pendingRequests: [{}],
  invitations: [{}],
  connections: [{}],
  skills: [],
});

const User = new mongoose.model("user", userSchema);
const Post = new mongoose.model("post", postSchema);

app.get("/", function (req, res) {
  res.send("Hello");
});

app.get("/getAllPosts", function (req, res) {
  Post.find({}, function (err, foundPosts) {
    if (err) {
      console.log(err);
    } else {
      // Question -> If I directly pass foundPost in json then its not working
      // but If I pass by using another variable then it's working but HOW ???

      let posts = foundPosts;
      // I reversed array because last post must be on top.
      posts.reverse();
      res.json({ posts });
    }
  });
});

app.post("/postUpload", function (req, res) {
  const accessToken = JSON.parse(req.headers.accesstoken).accessToken;
  let finalUser;

  jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, user) {
    if (err) {
      console.log(err);
    }
    finalUser = user;
  });

  User.findOne({ userEmail: finalUser.userEmail }, function (err, foundUser) {
    if (!err) {
      const x = foundUser;

      if (req.body.postContent !== "") {
        const newPost = new Post({
          userName: x.userName,
          userIntro: x.userIntro,
          userEmail: x.userEmail,
          postContent: req.body.postContent,
          postImgSrc: req.body.postImgSrc,
          profileImage: x.userProfileImage,
          likes: 0,
          likeMails: [],
        });
        newPost.save();

        x.allPosts.push({
          postImgSrc: newPost.postImgSrc,
          postContent: newPost.postContent,
        });

        x.save();
      }
    }
  });

  res.redirect("/getAllPosts");
});

app.post("/signIn", function (req, res) {
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    if (!err) {
      const newUser = new User({
        userName: req.body.userName,
        userEmail: req.body.userEmail,
        password: hash,
        // Add all feilds
      });

      newUser.save();
      const accessToken = jwt.sign(
        {
          userName: req.body.userName,
          userEmail: req.body.userEmail,
          password: hash,
        },
        process.env.ACCESS_TOKEN
      );

      res.json({ accessToken: accessToken });
    } else {
      console.log(err);
    }
  });
});

app.post("/login", function (req, res) {
  User.findOne({ userEmail: req.body.userEmail }, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      bcrypt.compare(
        req.body.password,
        foundUser.password,
        function (err, result) {
          if (!err && result === true) {
            const accessToken = jwt.sign(
              {
                userEmail: req.body.userEmail,
                password: foundUser.password,
                role: "ADMIN",
              },
              process.env.ACCESS_TOKEN
            );
            res.json({ accessToken: accessToken });
          }
        }
      );
    }
  });
});

app.post("/currentUser", function (req, res) {
  // Use accessToken which is passed from frontend to get the user details.
  const accessToken = JSON.parse(req.headers.accesstoken).accessToken;

  jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, user) {
    if (!err) {
      User.findOne({ userEmail: user.userEmail }, function (err, foundUser) {
        if (!err) {
          const ans = {
            userName: foundUser.userName,
            userEmail: foundUser.userEmail,
            userIntro: foundUser.userIntro,
            userProfileImage: foundUser.userProfileImage,
          };
          res.json({ ans: ans });
        }
      });
    }
  });
});

function accessUser(token) {
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, user) {
    if (!err) {
      const foundUser = user;
      return foundUser;
    }
  });
}

app.post("/accessActivities", function (req, res) {
  const accessToken = JSON.parse(req.headers.accesstoken).accessToken;

  jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, user) {
    if (!err) {
      User.findOne({ userEmail: user.userEmail }, function (err, foundUser) {
        if (!err) {
          let currentUserAllPosts = foundUser.allPosts;
          currentUserAllPosts.reverse();
          res.json({ currentUserAllPosts });
        }
      });
    }
  });
});

app.post("/accessConnections", function (req, res) {
  const accessToken = JSON.parse(req.headers.accesstoken).accessToken;

  jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, user) {
    if (!err) {
      User.findOne({ userEmail: user.userEmail }, function (err, foundUser) {
        if (!err) {
          let currentUserConnections = foundUser.connections;
          res.json({ currentUserConnections });
        }
      });
    }
  });
});

app.post("/accessAboutContent", function (req, res) {
  const accessToken = JSON.parse(req.headers.accesstoken).accessToken;

  jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, user) {
    if (!err) {
      User.findOne({ userEmail: user.userEmail }, function (err, foundUser) {
        let userAboutContent = foundUser.userAboutContent;

        res.json({ userAboutContent });
      });
    }
  });
});

app.post("/accessSkills", function (req, res) {
  const accessToken = JSON.parse(req.headers.accesstoken).accessToken;

  jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, user) {
    if (!err) {
      User.findOne({ userEmail: user.userEmail }, function (err, foundUser) {
        let currentUserSkills = foundUser.skills;

        res.json({ currentUserSkills });
      });
    }
  });
});

app.post("/accessNumOfConnections", function (req, res) {
  const accessToken = JSON.parse(req.headers.accesstoken).accessToken;
  jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, user) {
    if (!err) {
      User.findOne({ userEmail: user.userEmail }, function (err, foundUser) {
        if (!err) {
          const x = foundUser;
          const numConnections = x.connections.length;
          res.json({ numConnections });
        }
      });
    }
  });
});

app.post("/getLikes", function (req, res) {
  const clickedPostSrc = req.body.postSrc;
  const accessToken = JSON.parse(req.headers.accesstoken).accessToken;

  jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, user) {
    if (!err) {
      Post.findOne({ postImgSrc: clickedPostSrc }, function (err, foundPost) {
        if (!err) {
          const ans = {
            likeMails: foundPost.likeMails,
            userEmail: user.userEmail,
          };
          res.json({ ans });
        }
      });
    }
  });
});

app.post("/addLikes", function (req, res) {
  const clickedPostSrc = req.body.postSrc;
  const isLike = req.body.isLike;
  const userEmail = req.body.userEmail;

  Post.findOne({ postImgSrc: clickedPostSrc }, function (err, foundPost) {
    if (!err) {
      let x = foundPost;

      if (isLike == true) {
        x.likes = x.likes - 1;
        removeRequest(x.likeMails, userEmail);
      } else {
        x.likeMails.push(userEmail);
        x.likes = x.likes + 1;
      }
      x.save();

      let ans = {
        totalLikes: x.likes,
      };
      res.json({ ans });
    }
  });
});

app.post("/addComment", function (req, res) {
  const clickedPostSrc = req.body.postSrc;
  const commentValue = req.body.valueOfComment;
  const accessToken = JSON.parse(req.headers.accesstoken).accessToken;

  jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, user) {
    User.findOne({ userEmail: user.userEmail }, function (err, foundUser) {
      if (err) {
        console.log(err);
      }
      const postingUser = {
        userName: foundUser.userName,
        userIntro: foundUser.userIntro,
        userProfileImage: foundUser.userProfileImage,
      };

      Post.findOne({ postImgSrc: clickedPostSrc }, function (err, foundPost) {
        if (!err) {
          let x = foundPost;
          x.comments.push({ postingUser, commentValue });
          x.save();

          let allComments = x.comments;
          res.json({ allComments });
        }
      });
    });
  });
});

app.post("/getAllComments", function (req, res) {
  const clickedPostSrc = req.body.postSrc;
  const accessToken = JSON.parse(req.headers.accesstoken).accessToken;

  jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, user) {
    if (!err) {
      User.findOne({ userEmail: user.userEmail }, function (err, foundUser) {
        if (err) {
          console.log(err);
        }

        Post.findOne({ postImgSrc: clickedPostSrc }, function (err, foundPost) {
          if (!err) {
            let allComments = foundPost.comments;
            res.json({ allComments });
          }
        });
      });
    }
  });
});

app.post("/findUser", function (req, res) {
  const username = req.body.username;

  User.find({ userName: username }, function (err, foundUsers) {
    if (!err) {
      let users = [];
      for (let i = 0; i < foundUsers.length; i++) {
        const x = foundUsers[i];
        const user = {
          userName: x.userName,
          userEmail: x.userEmail,
          userIntro: x.userIntro,
          userProfileImage: x.userProfileImage,
        };

        users.push(user);
      }

      res.json({ users });
    }
  });
});

app.post("/makeConnection", function (req, res) {
  const receiver = req.body.receiver;

  const accessToken = JSON.parse(req.headers.accesstoken).accessToken;

  jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, user) {
    if (!err) {
      User.findOne({ userEmail: user.userEmail }, function (err, sender) {
        if (!err) {
          User.findOne(
            { userEmail: receiver.userEmail },
            function (err, foundUser) {
              if (err) {
                console.log(err);
              } else {
                const x = foundUser;

                x.invitations.push({
                  userName: sender.userName,
                  userEmail: sender.userEmail,
                  userIntro: sender.userIntro,
                  userProfileImage: sender.userProfileImage,
                });
                x.save();
              }
            }
          );
          const x = sender;
          x.pendingRequests.push(receiver);
          x.save();
        }
      });
    }
  });

  const status = "Pending";
  res.json({ status });

  // Recevier ke pending request array me sender ka {name,intro,email} ko push kerna h
  // And Sender ke bhi same pending connection me show kerdeta hu.
});

app.post("/showInvitations", function (req, res) {
  const accessToken = JSON.parse(req.headers.accesstoken).accessToken;

  jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, user) {
    if (!err) {
      User.findOne({ userEmail: user.userEmail }, function (err, foundUser) {
        if (!err) {
          const x = foundUser.invitations;
          res.json({ x });
        }
      });
    }
  });
});

app.post("/showPendingRequest", function (req, res) {
  const accessToken = JSON.parse(req.headers.accesstoken).accessToken;

  jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, user) {
    if (!err) {
      User.findOne({ userEmail: user.userEmail }, function (err, foundUser) {
        if (!err) {
          const x = foundUser.pendingRequests;
          res.json({ x });
        }
      });
    }
  });
});

app.post("/showConnections", function (req, res) {
  const accessToken = JSON.parse(req.headers.accesstoken).accessToken;

  jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, user) {
    if (!err) {
      User.findOne({ userEmail: user.userEmail }, function (err, foundUser) {
        if (!err) {
          const x = foundUser.connections;
          res.json({ x });
        } else {
          console.log(err);
        }
      });
    } else {
      console.log(err);
    }
  });
});

app.post("/acceptConnectionRequest", function (req, res) {
  const user = req.body.user;
  const accessToken = JSON.parse(req.headers.accesstoken).accessToken;

  jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, getUser) {
    if (!err) {
      let currentUserDetails;
      User.findOne({ userEmail: getUser.userEmail }, function (err, foundUser) {
        if (!err) {
          const x = foundUser;
          x.connections.push(user);
          removeRequest(x.invitations, getUser);

          currentUserDetails = {
            userProfileImage: x.userProfileImage,
            userName: x.userName,
            userEmail: x.userEmail,
            userIntro: x.userIntro,
          };
          x.save();

          User.findOne(
            { userEmail: user.userEmail },
            function (err, foundUser) {
              if (err) {
                console.log(err);
              } else {
                const y = foundUser;
                y.connections.push(currentUserDetails);

                removeRequest(y.pendingRequests, user);
                y.save();
              }
            }
          );
        }
      });
    }
  });

  // I also have to update connections array of user (which is  got from post request)
  // Updating connection array of user.

  const status = "ADDED";
  res.json({ status });
});

app.post("/ignoreConnectionRequest", function (req, res) {
  const user = req.body.user;
  const accessToken = JSON.parse(req.headers.accesstoken).accessToken;

  jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, getUser) {
    if (!err) {
      User.findOne({ userEmail: getUser.userEmail }, function (err, foundUser) {
        if (!err) {
          const x = foundUser;
          removeRequest(x.invitations, getUser);

          x.save();
        }
      });

      User.findOne({ userEmail: user.userEmail }, function (err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          const x = foundUser;
          removeRequest(x.pendingRequests, user);
          x.save();
        }
      });
    }
  });

  // I also have to update connections array of user (which is  got from post request)
  // Updating connection array of user.

  const status = "REMOVED";
  res.json({ status });
});

function removeRequest(arr, keyUser) {
  // Delete from pendingRequest array
  let pos = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === keyUser) {
      pos = i;
      break;
    }
  }

  // moving object to one step towards left
  for (let i = pos; i < arr.length - 1; i++) {
    arr[i] = arr[i + 1];
  }

  // To remove last duplicate
  // console.log(arr);
  arr.pop();
}

app.post("/updateInformation", function (req, res) {
  const userIntro = req.body.userIntro;
  const userProfileImage = req.body.userImg;
  const accessToken = JSON.parse(req.headers.accesstoken).accessToken;

  jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, user) {
    if (!err) {
      User.findOne({ userEmail: user.userEmail }, function (err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          const newUser = foundUser;
          newUser.userIntro = userIntro;
          newUser.userProfileImage = userProfileImage;

          newUser.save();
        }
      });

      const status = "Information updated";
      res.json({ status });
    }
  });
});

app.post("/updateAboutContent", function (req, res) {
  const accessToken = JSON.parse(req.headers.accesstoken).accessToken;

  jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, user) {
    if (!err) {
      User.findOne({ userEmail: user.userEmail }, function (err, foundUser) {
        if (!err) {
          const x = foundUser;
          x.userAboutContent = req.body.userAboutContent;
          x.save();

          const ans = x.userAboutContent;
          res.json({ ans });
        }
      });
    }
  });
});

app.post("/addSkill", function (req, res) {
  const currentSkill = req.body.skill;
  const accessToken = JSON.parse(req.headers.accesstoken).accessToken;

  jwt.verify(accessToken, process.env.ACCESS_TOKEN, function (err, user) {
    if (!err) {
      User.findOne({ userEmail: user.userEmail }, function (err, foundUser) {
        if (!err) {
          const x = foundUser;
          x.skills.push(currentSkill);

          x.save();
          const skills = x.skills;
          res.json({ skills });
        }
      });
    }
  });
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log("Server is running at port 5000");
});
