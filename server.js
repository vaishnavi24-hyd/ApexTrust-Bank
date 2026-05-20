const express = require('express');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', routes);

// 404 Page handler
app.use((req, res) => {
  res.status(404).render('login', { 
    title: '404 - Not Found - ApexTrust Bank', 
    activePage: '', 
    error: 'The requested page was not found.' 
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`ApexTrust Bank server is running on http://localhost:${PORT}`);
});
