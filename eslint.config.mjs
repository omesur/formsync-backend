// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// eslint.config.mjs
// ... (imports al principio)

export default tseslint.config(
  // ... (otras configuraciones como ignores, recommended, etc.)

  // Este es el objeto donde probablemente van tus reglas personalizadas
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // --- REGLAS EXISTENTES ---
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',

      // --- NUEVA REGLA AÑADIDA ---
      '@typescript-eslint/no-unused-vars': [
        'warn', // Nivel de severidad: 'warn' o 'error'
        {
          argsIgnorePattern: '^_',          // Ignorar argumentos que empiezan con '_'
          varsIgnorePattern: '^_',          // Ignorar variables locales que empiezan con '_'
          caughtErrorsIgnorePattern: '^_', // Ignorar errores capturados que empiezan con '_'
        },
      ],
      // --- FIN NUEVA REGLA ---
    },
  }

  // ... (puede haber más objetos de configuración en el array si es necesario)
);