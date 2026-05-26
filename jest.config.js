import {createDefaultEsmPreset} from "ts-jest";


const presetConfig = createDefaultEsmPreset({
    tsconfig: "./tsconfig.json"
});

export default {
    ...presetConfig,
    moduleNameMapper: {
        "^(.*)\.js$": "$1"
    }
};
