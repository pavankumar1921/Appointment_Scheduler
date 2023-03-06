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
const { start } = require("repl");
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
    const Rtime1 = new Date("2023-03-04T" + startTime + "Z");
    const Rtime2 = new Date("2023-03-04T" + endTime + "Z");
    const diffInMilliseconds = Math.abs(Rtime2.getTime() - Rtime1.getTime());
    const RdiffInMinutes = Math.floor(diffInMilliseconds / 1000 / 60);
    const allAppointments = await Appointment.getAppointments(request.user.id);
    let clash = [];
    let diff = [];
    for (var i = 0; i < allAppointments.length - 1; i++) {
      let a = allAppointments[i].end;
      let b = allAppointments[i + 1].start;
      let end = a.slice(0, 5);
      let start = b.slice(0, 5);
      const time1 = new Date("2023-03-04T" + start + "Z");
      const time2 = new Date("2023-03-04T" + end + "Z");
      const diffInMilliseconds = Math.abs(time2.getTime() - time1.getTime());
      const appdiffInMinutes = Math.floor(diffInMilliseconds / 1000 / 60);
      diff.push(appdiffInMinutes);
    }
    for (var j = 0; j < allAppointments.length; j++) {
      let x = allAppointments[j].start;
      let y = allAppointments[j].end;
      let appstartTime = x.slice(0, 5);
      let appendTime = y.slice(0, 5);
      console.log(
        startTime < appstartTime &&
          appstartTime < endTime &&
          endTime < appendTime
      );
      if (
        (startTime < appstartTime &&
          appstartTime < endTime &&
          endTime < appendTime) ||
        (appstartTime <= startTime &&
          startTime < appendTime &&
          appendTime <= endTime) ||
        (appstartTime < endTime &&
          endTime < appendTime &&
          appstartTime < startTime &&
          startTime < appendTime) ||
        (startTime <= appstartTime && appendTime <= endTime)
      ) {
        clash.push(true);
      }
    }
    console.log(clash);
    for (var k = 0; k < allAppointments.length; k++) {
      if (clash.find((value) => Boolean(value)) && diff[k] >= RdiffInMinutes) {
        console.log("Test1");
        let x = allAppointments[k].end;
        let appendTime = x.slice(0, 5);
        const time1 = new Date("2023-03-04T" + appendTime + "Z");
        const minutes = RdiffInMinutes;
        const hours = Math.floor(minutes / 60);
        const minutesToAddFinal = minutes % 60;
        const newTime = new Date(time1);
        newTime.setHours(time1.getHours() + hours);
        newTime.setMinutes(time1.getMinutes() + minutesToAddFinal);
        let newTime1 = newTime.toISOString();
        return response.render("deleteORsuggest", {
          title: request.body.title,
          start: request.body.start,
          end: request.body.end,
          newStart: appendTime,
          newEnd1: newTime1.slice(11, 16),
        });
      } else if (k + 1 === allAppointments.length && clash.length != 0) {
        console.log("Test2");
        let len = allAppointments.length;
        let x = allAppointments[len - 1].end;
        let appendTime = x.slice(0, 5);
        const time1 = new Date("2023-03-04T" + appendTime + "Z");
        const minutes = RdiffInMinutes;
        const hours = Math.floor(minutes / 60);
        const minutesToAddFinal = minutes % 60;
        const newTime = new Date(time1);
        newTime.setHours(time1.getHours() + hours);
        newTime.setMinutes(time1.getMinutes() + minutesToAddFinal);
        let newTime1 = newTime.toISOString();
        console.log(appendTime);
        console.log(newTime1.slice(11, 16));
        return response.render("deleteORsuggest", {
          title: request.body.title,
          start: request.body.start,
          end: request.body.end,
          newStart: appendTime,
          newEnd1: newTime1.slice(11, 16),
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
    let overlap = [];
    for (var i = 0; i < allAppointments.length; i++) {
      let x = allAppointments[i].start;
      let y = allAppointments[i].end;
      let appstartTime = x.slice(0, 5);
      let appendTime = y.slice(0, 5);
      if (
        (startTime < appstartTime &&
          appstartTime < endTime &&
          endTime < appendTime) ||
        (appstartTime < startTime &&
          startTime < appendTime &&
          appendTime < endTime) ||
        (appstartTime < endTime &&
          endTime < appendTime &&
          appstartTime < startTime &&
          startTime < appendTime) ||
        (startTime <= appstartTime && appendTime <= endTime)
      ) {
        overlap.push(allAppointments[i]);
      }
    }
    for (var k = 0; k < overlap.length; k++) {
      await Appointment.deleteAppointment(overlap[k].id);
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
