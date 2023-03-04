const express = require("express"); //importing express
const app = express(); // creating new application
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
app.use(bodyParser.json());
const path = require("path");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const flash = require("connect-flash");
const bcrypt = require("bcrypt");

const saltRounds = 10;
app.set("views", path.join(__dirname, "views"));
app.use(flash());
const { User, Appointment } = require("./models");
// eslint-disable-next-line no-unused-vars
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
//SET EJS AS VIEW ENGINE
app.use(cookieParser("shh! some secrete string"));
app.set("view engine", "ejs");
app.use(
  session({
    secret: "my-super-secret-key-21728172615261562",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, //24hours
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async function (user) {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch(() => {
          return done(null, false, {
            message: "Account doesn't exist for this mail",
          });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.get("/", async (request, response) => {
  if (request.user) {
    return response.redirect("/appointment");
  } else {
    return response.render("index", {
      title: "Application Scheduler",
    });
  }
});

app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Signup",
  });
});

app.post("/users", async (request, response) => {
  if (request.body.email.length == 0) {
    request.flash("error", "Email can not be empty!");
    return response.redirect("/signup");
  }

  if (request.body.firstName.length == 0) {
    request.flash("error", "First name can not be empty!");
    return response.redirect("/signup");
  }
  if (request.body.password.length < 8) {
    request.flash("error", "Password length should be minimun 8");
    return response.redirect("/signup");
  }
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  console.log(hashedPwd);

  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/appointment");
    });
  } catch (error) {
    request.flash(
      "error",
      "This mail already having account, try another mail!"
    );
    return response.redirect("/signup");
  }
});

app.get("/login", (request, response) => {
  response.render("login", { title: "Login" });
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (request, response) {
    console.log(request.user);
    response.redirect("/appointment");
  }
);
app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.get(
  "/appointment",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInUser = request.user.id;
    const user = await User.findByPk(loggedInUser);
    const userName = user.dataValues.firstName;
    const allAppointments = await Appointment.getAppointments(loggedInUser);
    if (request.accepts("html")) {
      response.render("appointment", {
        title: "Manage Appointments",
        userId: loggedInUser,
        userName,
        allAppointments,
      });
    } else {
      response.json({ userName, allAppointments });
    }
  }
);

app.post(
  "/appointments",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    let startTime = request.body.start;
    let endTime = request.body.end;
    const allAppointments = await Appointment.getAppointments(request.user.id);
    for (var i = 0; i < allAppointments.length; i++) {
      let appstartTime = allAppointments[i].start;
      let appendTime = allAppointments[i].end;
      if (
        (startTime < appstartTime &&
          endTime > appstartTime &&
          endTime < appendTime &&
          endTime < appstartTime) ||
        (startTime < appendTime &&
          startTime < appstartTime &&
          endTime > appendTime) ||
        (startTime > appstartTime &&
          startTime < appendTime &&
          endTime > appstartTime &&
          endTime < appendTime) ||
        (startTime <= appstartTime && endTime >= appendTime)
      ) {
        return response.render("deleteORsuggest", {
          title: request.body.title,
          start: request.body.start,
          end: request.body.end,
        });
      }
    }
    try {
      await Appointment.addAppointment({
        title: request.body.title,
        start: request.body.start,
        end: request.body.end,
        userId: request.user.id,
      });
      return response.redirect("/appointment");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.post(
  "/override",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    let startTime = request.body.start;
    let endTime = request.body.end;
    const allAppointments = await Appointment.getAppointments(request.user.id);
    for (var i = 0; i < allAppointments.length; i++) {
      let appstartTime = allAppointments[i].start;
      let appendTime = allAppointments[i].end;
      if (
        (startTime < appstartTime &&
          endTime > appstartTime &&
          endTime < appendTime &&
          endTime < appstartTime) ||
        (startTime < appendTime &&
          startTime < appstartTime &&
          endTime > appendTime) ||
        (startTime > appstartTime &&
          startTime < appendTime &&
          endTime > appstartTime &&
          endTime < appendTime) ||
        (startTime <= appstartTime && endTime >= appendTime)
      ) {
        await Appointment.deleteAppointment(allAppointments[i].id);
        try {
          await Appointment.addAppointment({
            title: request.body.title,
            start: request.body.start,
            end: request.body.end,
            userId: request.user.id,
          });
          return response.redirect("/appointment");
        } catch (error) {
          console.log(error);
          return response.status(422).json(error);
        }
      }
    }
  }
);

app.delete(
  "/appointments/:id/delete",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const res = await Appointment.deleteAppointment(request.params.id);
      return response.json({ success: res === 1 });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/appointments/:id/edit",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const appointment = await Appointment.findByPk(request.params.id);
    response.render("edit-appointment", {
      title: "Edit appointment",
      appointment: appointment,
      id: request.params.id,
    });
  }
);

app.post(
  "/appointments/:id/edit",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      await Appointment.editAppointment(request.params.id, request.body.title);
      response.redirect(`/appointment`);
    } catch (error) {
      console.log(error);
      return;
    }
  }
);

module.exports = app;
