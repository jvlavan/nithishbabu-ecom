const hbs = require("hbs");
const moment = require('moment');

hbs.registerHelper("formatPrice", function (price) {
  return parseFloat(price).toFixed(2);
});

hbs.registerHelper("getRatingHTML", function (rating) {
  const filledStars = '<i class="fa fa-star"></i>'.repeat(rating);
  const emptyStars = '<i class="fa fa-star-o"></i>'.repeat(5 - rating);
  return new hbs.SafeString(filledStars + emptyStars);
});

hbs.registerHelper("mod", function (value, modulus) {
  return value % modulus;
});

hbs.registerHelper("eq", function (a, b, options) {
  return a === b;
});

hbs.registerHelper("multiply", function (a, b) {
  return a * b;
});

// Define a custom Handlebars helper to calculate the total price
hbs.registerHelper("calculateTotalPrice", function (products) {
  let totalPrice = 0;
  products.forEach(function (product) {
    totalPrice += product.quantity * product.price;
  });
  return totalPrice;
});

// Define a custom Handlebars helper to calculate the total price with tax
hbs.registerHelper("calculateTotalPriceWithTax", function (products) {
  	const taxRate = 0.10; // Assuming 10% tax rate
	// const totalPrice = hbs.helpers.calculateTotalPrice(products);
	let totalPrice = 0;
	products.forEach(function (product) {
	totalPrice += product.quantity * product.price;
	});
	const totalPriceWithTax = totalPrice + totalPrice * taxRate;
	return totalPriceWithTax;
});


hbs.registerHelper('getCurrentDate', function() {
    return moment().format('YYYY-MM-DD'); // Customize the date format as per your preference
});

hbs.registerHelper('dateFormat', function(date, format) {
  const formattedDate = moment(date).format(format);
  return formattedDate;
});

function groupOrdersByDate(orders) {
  const groupedOrders = [];
  let currentDate = null;
  let currentGroup = null;

  orders.forEach(order => {
      const orderDate = formatDate(order.orderdate, "YYYY-MM-DD");
      
      if (orderDate !== currentDate) {
          currentGroup = {
              orderdate: order.orderdate,
              items: []
          };
          groupedOrders.push(currentGroup);
          currentDate = orderDate;
      }

      currentGroup.items.push(order);
  });

  return groupedOrders;
}

// Helper function to format date using Moment.js
function formatDate(date, format) {
  return moment(date).format(format);
}

module.exports = {
  hbs,
  groupOrdersByDate
};