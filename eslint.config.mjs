import next from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier";

const eslintConfig = [
  ...next,
  prettier,
  {
    // Initial rollout: keep these visible as warnings rather than hard
    // failures so adopting the linter doesn't require a large component
    // refactor in the same PR. Tracked for follow-up cleanup.
    rules: {
      // Internal nav still uses <a href="/..."> in a few page headers/footers;
      // converting to next/link is a separate, mechanical change.
      "@next/next/no-html-link-for-pages": "warn",
      // Intentional client-mount reads (window.location.origin, theme from DOM)
      // legitimately setState in an effect; the new React-Compiler rule is noisy
      // for this pattern.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
