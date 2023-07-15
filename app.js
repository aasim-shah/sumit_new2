const express = require('express')
const app = express()
var bodyParser = require('body-parser')
const mongoose = require('mongoose')
const userModel = require('./models/userModel')
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const passportLocal = require('passport-local').Strategy
const cookieParser = require('cookie-parser');
const session = require('express-session')
const port = process.env.PORT || 5000;
const axios = require("axios")
const jwt = require('jsonwebtoken');

const multer = require('multer')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + "-" + file.originalname)
  }
})

const upload = multer({ storage: storage })


mongoose.connect('mongodb://keptxtech:mardan8110@ac-oqhdud5-shard-00-00.v8w9wry.mongodb.net:27017,ac-oqhdud5-shard-00-01.v8w9wry.mongodb.net:27017,ac-oqhdud5-shard-00-02.v8w9wry.mongodb.net:27017/summit_new2?ssl=true&replicaSet=atlas-q5c8vd-shard-0&authSource=admin&retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true }).then(res => console.log("db connected")).catch((err) => { console.log(err); });



// Middleware function to check if the request contains a valid JWT token
const authenticateToken = (req, res, next) => {
  const token = req.cookies.jwt_token || ''; // Extract token from the request cookies
  console.log('cokkiess' , req.cookies)
  console.log('token_from midde' , token)
  if (!token) {
    return res.redirect('/login')
  }

  jwt.verify(token, "mysupersecret123", (err, decoded) => {
    if (err) {
      return res.redirect('/login')
    }

    req.userId = decoded.userId; // Store the decoded user ID in the request object for further use
    next();
  });
};




//midlewares 
// parse application/json
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.set("view engine", "ejs")
app.use(cookieParser());




app.use(session({
  secret: "mysupersecret123",
  resave: true,
  saveUninitialized: false,
}))
app.use(flash())


app.use(passport.initialize())
app.use(passport.session())





passport.serializeUser((user, done) => {
  done(null, user._id)
})

passport.deserializeUser(async (userId, done) => {
  const userObj = await userModel.findById(userId)
  done(null, userObj)
})


app.get("/", async (req, res) => {
  res.render('Homepage')
})


app.get("/priv" , authenticateToken , (req ,res) =>{
  res.send("authancaed")
  })

app.get("/login", async (req, res) => {
  res.render('Login', { stepper: 0, otp: null, phone: null })
})

app.get("/register", async (req, res) => {
  res.render('Signup')
})




app.post("/register", async (req, res) => {
  const { firstName, lastName, phone, otpValue, inputOtp } = req.body
  if (otpValue !== inputOtp) {
    req.flash('error', 'OTP does not matched !')
    return res.redirect('/register')
  }
  console.log({ body: req.body })
  const data = userModel({
    firstName,
    lastName,
    phone

  })

  if (firstName === "" || lastName === "" || phone === "") {
    req.flash('error', "Fill All Fields Properly !")
    return res.redirect('/register')
  }
  try {
    const findUser = await userModel.findOne({ phone: phone })
    if (findUser) {
      req.flash('error', 'user alraedy')
      res.redirect('/register')
    }
    const newUser = await data.save()
    const token = jwt.sign({ userId: newUser._id }, "mysupersecret123", { expiresIn: '1m' });
    console.log({token})
    res.cookie('jwt_token', token);
    res.redirect("/")
  } catch (error) {
    console.log(error)
    res.send({ error })
  }

})

function generateOTP() {
  var digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

app.get("/get/otp/:number", (req, res) => {
  var otp = generateOTP();
  console.log({ otp })
  console.log(req.params.number)
  axios({
    url: "https://www.fast2sms.com/dev/bulkV2",
    method: "post",
    headers: { "authorization": "vTNLWtjHiSlzJCEkfbGVpnPmh7OxrQcgX6B9sd58qMyoFYR4ZIrDxhbHul5AvPe8sK3Xckm49aLSfpBn" },
    data: {
      "variables_values": otp,
      "route": "otp",
      "numbers": req.params.number,
    }
  }).then((ee) => {
    console.log(ee.data);
  }).catch((err) => {
    console.log(err);
  });
  res.send(otp);
});
app.get("/get/loginOtp", (req, res) => {
  var otp = generateOTP();
  axios({
    url: "https://www.fast2sms.com/dev/bulkV2",
    method: "post",
    headers: { "authorization": "vTNLWtjHiSlzJCEkfbGVpnPmh7OxrQcgX6B9sd58qMyoFYR4ZIrDxhbHul5AvPe8sK3Xckm49aLSfpBn" },
    data: {
      "variables_values": otp,
      "route": "otp",
      "numbers": req.query.phone,
    }
  }).then((ee) => {
    return res.render("Login", { stepper: 1, otp: otp, phone: req.query.phone })
  }).catch((err) => {
    console.log(err);
    return res.render("Login", { stepper: 1, otp: null, phone: null })
  });
});



app.post('/authanticate', async (req ,res) =>{
   
  try{
      const { inputOtp, phone, otp } = req.body
      if (otp !== inputOtp) {
        req.flash('info', 'OTP Does not matched !');
        return res.redirect('/login');
      }

      const user = await userModel.findOne({phone})
      console.log(user)
      if(user){
        const token = jwt.sign({ userId: user._id }, "mysupersecret123", { expiresIn: '1m' });
        console.log({token})
        res.cookie('jwt_token', token);
        return res.redirect("/")
      }else{
        return res.redirect("/login")
      }
      console.log(req.body)
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
});




app.get('/logout', (req, res) => {
  // Clear the token cookie by setting an empty value and an expired date
  res.cookie('jwt_token', '', { expires: new Date(0) });
  res.redirect('/login'); // Redirect to the login page or any other desired route
});

app.listen(port, () => {
  console.log(`server is running on port ${port} , http://localhost:${port}`)
})
