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
    testTimeout: 5000,
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100
        }
    }
};
