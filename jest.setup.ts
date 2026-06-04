import dotenv from "dotenv";
import {jest} from "@jest/globals";
dotenv.config({ path: "./.env" });

jest.unstable_mockModule("node:child_process", () => ({
    execSync: jest.fn().mockReturnValue(Buffer.from(""))
}));