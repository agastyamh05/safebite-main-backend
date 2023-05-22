import { cleanEnv, str, port } from "envalid";

export const ValidateEnv = () => {
    cleanEnv(process.env, {
        NODE_ENV: str(),
        PORT: port(),
    });
}