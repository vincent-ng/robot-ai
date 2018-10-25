module.exports = {
    "extends": "airbnb",
    "env": {
        "browser": true,
        "node": true,
        "mocha": true
    },
    "parserOptions": {
        "ecmaVersion": 8,
        "sourceType": "module"
    },
    "rules": {
        "import/no-unresolved": 0,
        "import/no-extraneous-dependencies": 0,
        "semi": [2, "never"],
        "camelcase": 0,
        "react/jsx-indent": 0,
        "react/jsx-indent-props": [2, "tab"],
        "indent": [2, "tab", {
            "SwitchCase": 1,
        }],
        "react/forbid-prop-types": 0,
        "no-tabs": 0,
        "max-len": 0,
        "no-param-reassign": [2, { "props": false }],
        "func-names": [2, "never"]
    }
}