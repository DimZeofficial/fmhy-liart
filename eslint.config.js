import eslint from '@eslint/js'
import configPrettier from 'eslint-config-prettier'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // Global ignores (including script files and type declarations)
  {
    ignores: [
      '**/dist/**',
      '**/.output/**',
      '**/.temp/**',
      '**/.vitepress/dist/**',
      '**/.vitepress/cache/**',
	  'scripts/broken-file.js',
      'node_modules/**',
      '**/scripts/**',
      '**/*.d.ts'
    ]
  },

  // Base JS/TS config
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Vue config
  ...pluginVue.configs['flat/recommended'],

  // Custom rules
  {
    files: ['**/*.{ts,vue,mts}'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        sourceType: 'module'
      },
      globals: {
		  window: 'readonly',
		document: 'readonly',
		navigator: 'readonly',
		setTimeout: 'readonly',
		clearTimeout: 'readonly',
		atob: 'readonly',
		btoa: 'readonly',
		requestAnimationFrame: 'readonly',
		URL: 'readonly'
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    rules: {
      'no-undef': 'off',
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'vue/require-v-for-key': 'off',
      'vue/no-v-html': 'off',
      'vue/require-default-prop': 'off',
      'no-useless-escape': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },

  // Prettier config (must be last to override styling rules)
  configPrettier
)
