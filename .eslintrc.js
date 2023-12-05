module.exports = {
  root: true,
  parser: 'vue-eslint-parser',
  env: {
    browser: true,
    node: true,
    es2021: true
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/standard',
    '@vue/prettier'
  ],
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    ecmaVersion: 2020,
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ['vue', '@typescript-eslint'],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'vue/no-v-html': 'off',
    'import/first': 'off',
    '@typescript-eslint/no-this-alias': 'off'
  },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      env: {
        jest: true
      }
    }
  ],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json'
      }
    }
  },
  globals: {
    defineProps: 'readonly',
    defineEmits: 'readonly',
    defineExpose: 'readonly',
    NodeJS: 'readonly'
  }
}
