const app = require('./app/app');
const PORT = process.env.PORT || 7000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
