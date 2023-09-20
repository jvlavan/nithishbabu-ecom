const express = require("express"); //Framework for Node.JS
const mysql = require("mysql");
const app = express();
const path = require("path");
const hbs = require("hbs"); //view engine
const helpers = require("./helpers.js");
const { groupOrdersByDate } = require('./helpers');

require("dotenv").config();
//environment variables are a great way to securely and conveniently configure things\
// that don't change often, like URLs, authentication keys, and passwords

//My Sql Connection
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE,
});

db.connect((err) => {
    if (err) console.log(err);
    else console.log("My SQL connection success!!");
});

// Set up static files directory
app.use(express.static(path.join(__dirname, "./public")));
// Set the view engine and views directory
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: false }));
// Register Handlebars helpers
hbs.registerHelper(helpers);
hbs.registerPartials(path.join(__dirname, "views/partials"));
// Routes
app.use("/", require("./routes/pages"));
app.use("/auth", require("./routes/auth"));
// Home page route with user details
app.get("/home/:userid", (req, res) => {
    const userid = req.params.userid;
    db.query("select * from users where id=?", [userid], async (error, result) => {
        if (error) {
            return res.status(500).send("Internal Server Error");
        }
        return res.render("home", { userdetails: result[0] });
    });
});

// Products page route with product details and user details
app.get("/products/:userid", (req, res) => {
    const userid = req.params.userid;
    db.query("SELECT * FROM users where ID = ?", [userid], (error, userdetails) => {
        if (error) {
            return res.status(500).send("Internal Server Error");
        }
        db.query("SELECT * FROM products", (error, rows) => {
            if (error) {
                return res.status(500).send("Internal Server Error");
            }
            return res.render("products", { products: rows, userdetails: userdetails[0] });
        });
    });
});
// Product details page route with specific product and user details
app.get("/productdetails/:userid/:id", (req, res) => {
    const productId = req.params.id;
    const userid = req.params.userid;
    db.query("SELECT * FROM users where ID = ?", [userid], (error, userdetails) => {
        if (error) {
            return res.status(500).send("Internal Server Error");
        }
        db.query("SELECT * FROM products where pid=?", [productId], (error, results) => {
            if (error) {
                return res.status(500).send("Internal Server Error");
            }
            if (results.length === 0)
                return res.status(404).send("Product not found");
            res.render("productdetails", {
                product: results[0],
                userdetails: userdetails[0],
            });
        });
    });
});
// Cart Insert route for adding items to the cart
app.get("/cartInsert/:userid/:pid", (req, res) => {
    const productId = req.params.pid;
    const userid = req.params.userid;
    const size = req.query.size;
    const quantity = req.query.quantity;
    const successMessage = "Added to cart successfully!"
    db.query("select * from cart where userid = ? and pid = ?", [userid, productId], (error, results) => {
        if (error) {
            return res.status(500).send("Internal Server Error");
        }
        //If product not present in the cart insert it
        if (results.length === 0) {
            db.query("insert into cart (userid, pid, quantity, size) values(?,?,?,?)", [userid, productId, quantity, size], (error, results) => {
                if (error) {
                    return res.status(500).send("Internal Server Error");
                }
            });
        }
        else {
            //If present, delete the previous details of the product and insert the new modified values of products
            db.query("delete from cart where userid = ? and pid = ?", [userid, productId], (error) => {
                if (error) {
                    return res.status(500).send("Internal Server Error");
                }
                else {
                    db.query("insert into cart (userid, pid, quantity, size) values(?,?,?,?)", [userid, productId, quantity, size], (error, results) => {
                        if (error) {
                            return res.status(500).send("Internal Server Error");
                        }
                    });
                }
            });
        }
        //To remain in the same productdetails page after inserting into the cart by alerting cart insert process successfull
        db.query("SELECT * FROM users where ID = ?", [userid], (error, userdetails) => {
            if (error) {
                return res.status(500).send("Internal Server Error");
            }
            db.query("SELECT * FROM products where pid=?", [productId], (error, results) => {
                if (error) {
                    return res.status(500).send("Internal Server Error");
                }
                if (results.length === 0)
                    return res.status(404).send("Product not found");
                return res.render("productdetails", {
                    product: results[0],
                    userdetails: userdetails[0],
                    successMessage: successMessage
                })
            });
        });
    });
});
// Remove item from cart route
app.get("/cartDelete/:userid/:pid", (req, res) => {
    //After deleting from the cart reload the cart page
    const userid = req.params.userid;
    const productId = req.params.pid;
    db.query("delete from cart where userid = ? and pid = ?", [userid, productId], (error) => {
        if (error) {
            return res.status(500).send("Internal Server Error");
        }
        res.redirect(`/cart/${userid}`);
    });
});
// Cart route with user details and cart items
app.get("/cart/:userid", (req, res) => {
    //Loading the cart page when clicking from account dropdown
    const userid = req.params.userid;
    db.query("SELECT * FROM users where ID = ?", [userid], (error, userdetails) => {
        if (error) {
            return res.status(500).send("Internal Server Error");
        }
        db.query(
            "SELECT id, userid, pid, quantity, size, pname, price\
                FROM cart\
                NATURAL JOIN products\
                WHERE userid = ?; ", [userid], (error, results) => {
            if (error) {
                return res.status(500).send("Internal Server Error");
            }
            return res.render("cart", {
                products: results,
                userdetails: userdetails[0]
            });
        });
    }
    );
});
// Insert orders from cart route
app.get("/ordersInsert/:userid", (req, res) => {
    const userid = req.params.userid;
    db.query(
        "SELECT id, userid, pid, quantity, size, pname, price \
        FROM cart \
        NATURAL JOIN products \
        WHERE userid = ?;", [userid], (error, results) => {
        if (error) {
            return res.status(500).send("Internal Server Error");
        }
        const currentDate = new Date().toISOString().slice(0, 19).replace("T", " ");
        const orderItems = results.map((item) => {
            return [userid, item.pid, item.quantity, item.size, currentDate];
        });
        //Inserting into the orders table
        db.query("INSERT INTO orders (userid, pid, quantity, size, orderdate) VALUES ?", [orderItems], (error) => {
            if (error) {
                return res.status(500).send("Internal Server Error");
            }
        });
        //Deleting the same from cart
        db.query("DELETE FROM cart WHERE userid = ?", [userid], (error) => {
            if (error) {
                return res.status(500).send("Internal Server Error");
            }
        });
        return res.redirect(`/orders/${userid}`);
    });
});
// Orders route with user details and grouped order items
app.get("/orders/:userid", (req, res) => {
    const userid = req.params.userid;
    db.query("SELECT * FROM users WHERE ID = ?", [userid], (error, userdetails) => {
        if (error) {
            return res.status(500).send("Internal Server Error");
        }
        //Load the orders page from the orders table in decreasing order of date(Recent orders first)
        db.query(
            "SELECT id, userid, pid, quantity, size, pname, price, orderdate \
            FROM orders \
            NATURAL JOIN products \
            WHERE userid = ? \
            ORDER BY orderdate DESC", [userid], (error, rows) => {
            if (error) {
                return res.status(500).send("Internal Server Error");
            }
            if (rows.length === 0) {
                return res.render("orders", {
                    products: [],
                    userdetails: userdetails[0]
                });
            }
            // Group the rows by orderdate
            const groupedOrders = groupOrdersByDate(rows);
            return res.render("orders", {
                products: groupedOrders,
                userdetails: userdetails[0]
            });
        });
    });
});
// Add or remove product from wishlist route
app.get("/addToWishlist/:userid/:pid", (req, res) => {
    const productId = req.params.pid;
    const userid = req.params.userid;
    var successMessage = "Error connecting... Retry !!!";
    db.query("select * from wishlist where userid = ? and pid = ?", [userid, productId], (error, results) => {
        if (error) {
            return res.status(500).send("Internal Server Error");
        }
        //If not exists in wishlist add it. That is,change the liked value to 1
        if (results.length === 0) {
            db.query("insert into wishlist (userid, pid, liked) values(?,?,1)", [userid, productId], (error) => {
                if (error) {
                    return res.status(500).send("Internal Server Error");
                }
                successMessage = "Added to wishlist successfully!"
                db.query("update products set liked = 1 where pid = ?", [productId], (error) => {
                    if (error) {
                        return res.status(500).send("Internal Server Error");
                    }
                });
            });
        }
        else {
            //If already exists in wishlist, delete it. That is, change the liked value to 0.
            db.query("delete from wishlist where userid = ? and pid = ?", [userid, productId], (error) => {
                if (error) {
                    return res.status(500).send("Internal Server Error");
                }
                successMessage = "Removed from wishlist successfully !!!"
                db.query("update products set liked = 0 where pid = ?", [productId], (error) => {
                    if (error) {
                        return res.status(500).send("Internal Server Error");
                    }
                });
            });
        }
        //To remain in the same productdetails after clicking heart - icon
        db.query("SELECT * FROM users where ID = ?", [userid], (error, userdetails) => {
            if (error) {
                return res.status(500).send("Internal Server Error");
            }
            db.query("SELECT * FROM products where pid=?", [productId], (error, results) => {
                if (error) {
                    return res.status(500).send("Internal Server Error");
                }
                if (results.length === 0) {
                    return res.status(404).send("Product not found");
                }
                return res.render("productdetails", {
                    product: results[0],
                    userdetails: userdetails[0],
                    successMessage: successMessage
                });
            });
        });

    });
});
//Sending userid to wishlist and loading wishlist
app.get("/wishlist/:userid", (req, res) => {
    const userid = req.params.userid
    db.query("SELECT * FROM users where ID = ?", [userid], (error, userdetails) => {
        if (error) {
            return res.status(500).send("Internal Server Error");
        }
        db.query(
            "SELECT w.pid, p.pname, p.price, p.rating, w.liked FROM \
            (select * from wishlist where userid = ?) as w inner join products as p \
            on w.pid = p.pid;", [userid], (error, results) => {
            if (error) {
                return res.status(500).send("Internal Server Error");
            }
            return res.render("wishlist", { products: results, userdetails: userdetails[0] });
        });
    });
});

// Start the server
app.listen(5000, () => {
    console.log("Server started at port 5000");
});
