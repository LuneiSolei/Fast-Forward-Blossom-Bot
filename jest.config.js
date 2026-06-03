import {createDefaultEsmPreset} from "ts-jest";


const presetConfig = createDefaultEsmPreset({
    tsconfig: "./tsconfig.json"
});

export default {
    ...presetConfig,
    moduleNameMapper: {
        "^(.*)\.js$": "$1"
    },
    setupFiles: ['<rootDir>/jest.setup.ts'],
    collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
    cacheDirectory: '<rootDir>/tmp/jest',
    testTimeout: 5000
};
