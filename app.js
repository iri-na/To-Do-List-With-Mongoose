//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));



mongoose.connect("mongodb+srv://admin-irina:<PASSWORD>@cluster0-xpmes.mongodb.net/todolistDB");

const itemSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item ({
  name: "Welcome to your to-do list!"
});
const item2 = new Item ({
  name: "Hit the + button to add a new item."
});
const item3 = new Item ({
  name: "<-- Hit the checkbox to delete an item."
});
const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});
const List = mongoose.model("List", listSchema);




app.get("/", function(req, res) {

  Item.find(function(err, foundItems) {

    if (foundItems.length === 0) {

      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        }
        else{
          console.log("Default items have been added to collection.")
        }
      });
      res.redirect("/");

    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem; // "newItem" corresponds to name of input
  const listName = req.body.list; // "list" corresponds to name of button, its value is listTitle

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {

    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Checked item successfully removed.")
      }
    });
    res.redirect("/");

  } else {
    List.findOneAndUpdate(
        {name: listName},
        {$pull: {items: {_id: checkedItemId}}},
        function(err, foundList) {
          if (!err) {
            res.redirect("/" + listName);
          }
        }
    );
  }
});

app.get("/:otherList", function(req, res) {
  const otherList = _.capitalize(req.params.otherList);

  List.findOne({name: otherList}, function(err, foundList) {
    if (!err) {

      if (!foundList) { // {}
        const list = new List({
          name: otherList,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + otherList);
      } else {
        res.render("list", {listTitle: otherList, newListItems: foundList.items});
      }

    } else {
      console.log(err);
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully!");
});
