// @flow

import type {
  CombinatorTokenType,
  SelectorTokenType
} from './types';
import {Parser} from './grammar';

export default () => {
  const parse = (selector: string): Array<SelectorTokenType | CombinatorTokenType> => {
    return Parser.start.tryParse(selector);
  };

  return {
    parse
  };
};
