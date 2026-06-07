import {createDefaultEsmPreset} from "ts-jest";


const presetConfig = createDefaultEsmPreset({
    tsconfig: "./tsconfig.json"
});
const sharedConfig = {
    ...presetConfig,
    moduleNameMapper: {
        "^(.*)\.js$": "$1"
    },
    setupFiles: ['<rootDir>/jest.setup.ts'],
}

export default {
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
    },
    projects: [
        {
            ...sharedConfig,
            displayName: "unit",
            testMatch: ['<rootDir>/src/tests/unit/**/*.test.ts']
        },
        {
            ...sharedConfig,
            displayName: "integration",
            testMatch: ['<rootDir>/src/tests/integration/**/*.test.ts']
        }
    ]
};
