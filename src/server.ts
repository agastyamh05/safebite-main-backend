import { App } from "./app";
import { UsersRoute } from "./routes/users.route";
import { ValidateEnv } from "./utils/config/validateEnv";

ValidateEnv();

const app = new App([new UsersRoute()]);

app.listen();
