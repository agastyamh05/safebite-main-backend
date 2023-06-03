import { App } from "./app";
import { FoodRoute } from "./routes/food.route";
import { UsersRoute } from "./routes/users.route";
import { ValidateEnv } from "./utils/config/validateEnv";

ValidateEnv();

const app = new App("/api/v1",[new UsersRoute(), new FoodRoute()]);

app.listen();
