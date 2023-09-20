const mysql = require("mysql2")
const bcrypt = require("bcryptjs")
require("dotenv").config();

//My Sql Connection
const db=mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user:  process.env.DATABASE_USER,
    password:  process.env.DATABASE_PASS,
    database:  process.env.DATABASE
})

exports.register=(req,res)=>{
    const {name,email,password,confirm_password} =req.body;
    db.query("select email from users where email=?", [email], async(error,result) =>
    {
        console.log(result);
        console.log(result.length);
        if(error)
        {
            confirm.log(error)
        }
        if(result.length>0)
        {
            return res.render("register",{msg: "Email already exists!!" ,msg_type: "error"})
        }
        else if(password!==confirm_password)
        {
            return res.render("register",{msg: "Password does not match!!",msg_type: "error"})
        }
        let hashedPassword = await bcrypt.hash(password,8);
        db.query("insert into users set ?",
        {name:name,email:email,pass:hashedPassword},
        (err,result)=>
        {
            if(err) console.log(err)
            else 
            {
                return res.render("register",{msg: "User Registration Success!!",msg_type: "good"})
            }
        })
    })
}

exports.login=async(req,res)=>{
    try {
        const {email,password} =req.body;
        console.log(email,password)
        if(!email || !password)
        {
            return res.status(400).render('login',{
                msg: "Please enter your email & password!!",
                msg_type:"error"
            })
        }
        db.query('select * from users where email=?',[email],async(error,result)=>{
            if(result.length<=0)
            return res.status(401).render('login',{
                msg: "Incorrect email/password..",
                msg_type:"error"
            })
            else
            {
                if(!(await bcrypt.compare(password,result[0].PASS)))
                {
                    return res.status(401).render('login',{
                    msg: "Incorrect email/password..",
                    msg_type:"error"})
                }
                else
                {
                    db.query("Update products set liked=0",async(error,lproducts)=>{
                        if (error) {
                            console.log(error);
                            return res.status(500).send("Internal Server Error");
                        }
                        db.query("update products set liked = 1 where pid in\
                            (select pid from wishlist where userid = ?)", [result[0].ID],(error, wlproduct)=>{
                                if (error) {
                                    console.log(error);
                                    return res.status(500).send("Internal Server Error");
                                }
                                return res.render("home",{userdetails : result[0]})
                        });
                    });
                }
            }
        });
    } catch (error) {
        console.log(error)
    }
}
