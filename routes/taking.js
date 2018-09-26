express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const Status = require("../models/Status");
const User = require("../models/User");
const sendMail = require("../mail/sendMail");
const uploadCloud = require('../config/cloudinary.js');
const hbs = require("handlebars");
const fs = require("fs");
const ensureLogin = require('connect-ensure-login')

router.get("/take/:itemID",uploadCloud.single("tag-photo"), ensureLogin.ensureLoggedIn('/'), (req, res, next) => {
  const itemID = encodeURIComponent(req.params.itemID);

//comprobación del tag
  let item;
  Item.findById(itemID).
    populate("statusID")
    .then(itemObj => {
      item = itemObj
      //console.log("item: --->" + item.statusID[0].takerID);
      return User.findById(item.statusID[0].takerID)
    })
    .then(user => {
      //console.log(item, user)
      res.render("items/take", { item, user })
    })
    .catch(e => console.log(e))
});

router.post("/taken/:itemID", ensureLogin.ensureLoggedIn('/'), (req, res, next) => {  //refactor this using populate
  const itemID = encodeURIComponent(req.params.itemID);
  const newKeeper = req.user;
  let itemVar;

  Item.findById(itemID)
    .then(item => {
      itemVar = item;
      return Status.findById(item.statusID);
      const htmlNotification = require('../mail/templateNotification')
      //sendMail(taker.email, "Your item " + item.name + " is changing hands!", htmlNotification(item.name, item.tag))
    })
    .then(status => {
      console.log("The keeper was " + status.currentHolderID);
      return Status.findByIdAndUpdate(
        { _id: status._id },
        { currentHolderID: newKeeper._id }
      );
    })
    .then(status => {
      console.log("Now the keeper is " + status.currentHolderID);
      res.render("items/confirmation");
    })
    .catch(err => {
      res.render("error", { message: "Keeper not found" });
    });
});


module.exports = router;