import Container from "typedi";
import { App } from "./app";
import { FoodRoute } from "./routes/food.route";
import { UsersRoute } from "./routes/users.route";
import { ValidateEnv } from "./utils/config/validateEnv";
import { PredictorService } from "./utils/driver/predictor";
import { CommonRoute } from "./routes/common.route";
import { logger } from "./utils/logger/logger";

ValidateEnv();

Container.set("ready", false);

const app = new App("/api/v1", [
	new UsersRoute(),
	new FoodRoute(),
	new CommonRoute(),
]);

app.listen();

const asyncInit = [Container.get(PredictorService).init()];

Promise.all(asyncInit).finally(() => {
	Container.set("ready", true);
    logger.info("🚀 App ready");
}).catch((error) => {
    logger.error(error);
});

