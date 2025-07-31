import { defineBackend, defineFunction } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
export const backend = defineBackend({
  helloFunction: defineFunction({
    entry: './functions/myFunction.ts',
    environment: {
      SANDWICH_TABLE_NAME: "Sandwich",
    },
  }),
});