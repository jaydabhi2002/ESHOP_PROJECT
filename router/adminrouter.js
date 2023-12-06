const router = require("express").Router();
const Admin = require("../model/admins");
const jwt = require("jsonwebtoken");
const aauth = require("../middleware/aauth");

router.get("/admin", (req, resp) => {
  resp.render("adminlogin");
});

router.get("/dashboard", aauth, (req, resp) => {
  resp.render("dashboard");
});

router.post("/admin_login", async (req, resp) => {
  try {
    const admin = await Admin.findOne({ uname: req.body.uname });

    if (admin.pass == req.body.pass) {
      const token = await jwt.sign({ _id: admin._id }, process.env.A_KEY);
      resp.cookie("ajwt", token);
      resp.render("dashboard");
    } else {
      resp.render("adminlogin", { err: "Invalid credenials" });
    }
  } catch (error) {
    console.log(error);
    resp.render("adminlogin", { err: "Invalid credenials" });
  }
});

router.get("/admin_logout", aauth, (req, resp) => {
  resp.clearCookie("ajwt");
  resp.render("adminlogin");
});

router.get("/users", (req, resp) => {
  resp.render("users");
});

router.get("/orders", (req, resp) => {
  resp.render("orders");
});

//*************category************ */
const Category = require("../model/categories");
router.get("/categories", async (req, resp) => {
  try {
    const catdata = await Category.find();
    // console.log(catdata);
    resp.render("category", { catdata: catdata });
  } catch (error) {
    console.log(error);
  }
});

router.post("/add_category", aauth, async (req, resp) => {
  try {
    if (req.body.id == "") {
      const cat = new Category({ catname: req.body.catname });
      // console.log(cat);
      await cat.save();
      resp.redirect("categories");
    } else {
      await Category.findByIdAndUpdate(req.body.id, {
        catname: req.body.catname,
      });
      resp.redirect("categories");
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/deletecategory", async (req, resp) => {
  const _id = req.query.cid;
  try {
    await Category.findByIdAndDelete(_id);
    resp.redirect("categories");
  } catch (error) {
    console.log(error);
  }
});

router.get("/editcategory", async (req, resp) => {
  const _id = req.query.cid;
  try {
    const data = await Category.findOne({ _id: _id });
    const catdata = await Category.find();
    resp.render("category", { edata: data, catdata: catdata });
  } catch (error) {
    console.log(error);
  }
});

//********************************************product */
const product = require("../model/products");
const multer = require("multer");
const fs = require("fs");

const storageEngine = multer.diskStorage({
  destination: "./public/productimg",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}--${file.originalname}`);
  },
});
const upload = multer({
  storage: storageEngine,
});

router.get("/products", aauth, async (req, resp) => {
  try {
    const catdata = await Category.find();

    const data = await product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "catid",
          foreignField: "_id",
          as: "category",
        },
      },
    ]);
    // console.log(data);
    resp.render("products", { pdata: data, catdata: catdata });
  } catch (error) {
    console.log(error);
  }
  // resp.render("admin_product")
});
router.post("/add_product", upload.single("img"), async (req, resp) => {
  try {
    if (req.body.id == "") {
      const prod = new product({
        catid: req.body.catid,
        pname: req.body.pname,
        price: req.body.price,
        qty: req.body.qty,
        img: req.file.filename,
      });
    //   console.log(prod);
      const dt = await prod.save();
      // console.log(dt);
      resp.redirect("products");
    } else {
      const dt = await product.findByIdAndUpdate(req.body.id, {
        catid: req.body.catid,
        pname: req.body.pname,
        price: req.body.price,
        qty: req.body.qty,
        img: req.file.filename,
      });
      // console.log(dt);
      resp.redirect("products");
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/deleteproduct", async (req, resp) => {
  try {
    const id = req.query.pid;
    const data = await product.findByIdAndDelete(id);
    fs.unlinkSync("public/productimg/" + data.img);
    resp.redirect("products");
  } catch (error) {
    console.log(error);
  }
});

router.get("/editproduct", async (req, resp) => {
  try {
    const id = req.query.pid;
    const data = await product.findOne({ _id: id });
    // console.log(data);
    const catdata = await Category.find();
    const prod = await product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "catid",
          foreignField: "_id",
          as: "category",
        },
      },
    ]);
    resp.render("products", {
      edata: data,
      catdata: catdata,
      pdata: prod,
    });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
