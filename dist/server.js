"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const users_route_1 = require("./routes/users.route");
const validateEnv_1 = require("./utils/config/validateEnv");
(0, validateEnv_1.ValidateEnv)();
const app = new app_1.App([new users_route_1.UsersRoute()]);
app.listen();
