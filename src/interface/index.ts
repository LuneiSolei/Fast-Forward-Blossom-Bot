import Main from "./main.js"
import * as core from "@actions/core"

Main.run().catch(err => {
    core.setFailed(err.message);
});