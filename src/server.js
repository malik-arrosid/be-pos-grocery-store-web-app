import config from "./config/config.js";
import app from "./app.js";
import startSchedulers from "./scheduler/index.js";
import "./config/firebase.js";

// startSchedulers();
// const PORT = config.app.port || 5000;
const PORT = config.app.port || 8080;
app.listen(PORT, () => {
  console.log(`Server is running in ${config.app.env} mode on port ${PORT}.`);
})