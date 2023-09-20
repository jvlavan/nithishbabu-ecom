const express = require("express");
const router = express.Router();

router.get("/",(req,res)=>{
    res.render("login.hbs");
});

router.get("/login",(req,res)=>{
    res.render("login.hbs");
});

router.get("/register",(req,res)=>{
    res.render("register.hbs");
});

router.get("/profile",(req,res)=>{
    res.render("profile.hbs");
});

router.get("/home",(req,res)=>{
    res.render("home.hbs");
});

router.get("/cart",(req,res)=>{
    res.render("cart.hbs");
});

module.exports = router;